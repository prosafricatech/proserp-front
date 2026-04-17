import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Paper,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  useTheme
} from '@mui/material';
import { VisibilityOutlined } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import purchaseServices from '../procurement/purchases/purchase-services';
import RelatableOrderDetails from './requisitions/listItem/tabs/form/RelatableOrderDetails';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PaymentItem, PurchaseItem, Requisition, RequisitionItem, Vendor } from './RequisitionType';
import { Organization } from '@/types/auth-types';

interface Props {
  requisition: Requisition;
  organization: Organization;
  belowLargeScreen: boolean;
}

type LeaveViewItem = {
  id?: number;
  employee_id?: number;
  start_date?: string;
  end_date?: string;
  days_requested?: number;
  reason?: string;
  employee?: {
    employee_number?: string;
    first_name?: string;
    last_name?: string;
  };
  leave_type?: {
    name?: string;
  };
};

const normalizeLeaveItem = (item: any): LeaveViewItem => ({
  ...item,
  days_requested: Number(item?.days_requested || 0),
  employee:
    item?.employee ||
    (item?.employee_number || item?.first_name || item?.last_name
      ? {
          employee_number: item?.employee_number,
          first_name: item?.first_name,
          last_name: item?.last_name,
        }
      : undefined),
  leave_type:
    item?.leave_type ||
    (item?.leave_type_name
      ? {
          name: item.leave_type_name,
        }
      : undefined),
});

// --- Fetch Order Details Component ---
const FetchRelatableDetails: React.FC<{
  relatable: { id: number } | undefined;
  toggleOpen: (open: boolean) => void;
}> = ({ relatable, toggleOpen }) => {
  const { data: orderDetails, isPending } = useQuery({
    queryKey: ['purchaseOrder', relatable?.id],
    queryFn: () => {
      if (!relatable?.id) throw new Error('Missing relatable ID');
      return purchaseServices.orderDetails(relatable.id);
    },
    enabled: !!relatable?.id
  });

  if (isPending) return <LinearProgress />;
  return <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen} />;
};

// --- Main Component ---
const RequisitionsOnScreen: React.FC<Props> = ({
  requisition,
  organization,
  belowLargeScreen
}) => {
  const theme = useTheme();
  const [selectedRelated, setSelectedRelated] = useState<{ id: number } | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);

  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || '#2113AD');
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const isPurchase = requisition?.approval_chain.process_type?.toLowerCase() === 'purchase';
  const isLeaveRequest = requisition?.approval_chain.process_type?.toLowerCase() === 'leave_request';
  const requisitionItems: RequisitionItem[] = 'items' in requisition ? (requisition.items || []) : [];
  const leaveSource = (requisition?.leave_items && requisition.leave_items.length ? requisition.leave_items : requisitionItems) || [];
  const leaveItems: LeaveViewItem[] = (leaveSource as any[]).map(normalizeLeaveItem);

  const totalVAT = requisitionItems
    ?.filter((item: RequisitionItem) => (item.vat_percentage || 0) > 0)
    .reduce((total: number, item: RequisitionItem) => 
      total + (item.rate * item.quantity * (item.vat_percentage || 0) * 0.01), 0) || 0;

  const grandTotal = requisitionItems
    .reduce((total: number, item: RequisitionItem) => total + item.quantity * item.rate * (1 + (item.vat_percentage || 0) / 100), 0) || 0;

  const subtotal = requisitionItems.reduce((total: number, item: RequisitionItem) => total + (item.quantity || 0) * (item.rate || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: requisition.currency?.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} width={'100%'}>
          {/* Header Section */}
          <Grid size={12} sx={{ mb: 3 }}>
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                width: '100%'
              }}
            >
              <Typography variant="h4" sx={{ color: headerColor }}>
                {isLeaveRequest ? 'LEAVE REQUEST' : isPurchase ? 'PURCHASE REQUISITION' : 'PAYMENT REQUISITION'}
              </Typography>
              <Typography variant="h6">
                {requisition.requisitionNo}
              </Typography>
            </Box>
          </Grid>

          {/* Meta Information */}
          <Grid container spacing={2} sx={{ mb: 3 }} width={'100%'}>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor }}>
                  Requisition Date
                </Typography>
                <Typography variant="body1">
                  {readableDate(requisition.requisition_date)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor }}>
                  Cost Center
                </Typography>
                <Typography variant="body1">{requisition.cost_center.name}</Typography>
              </Box>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor }}>
                  Requested By
                </Typography>
                <Typography variant="body1">{requisition.creator.name}</Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Items Table */}
          <Grid size={12}>
            <TableContainer 
              component={Paper}
              sx={{
                boxShadow: theme.shadows[2],
                '& .MuiTableRow-root:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              <Table>
                {isLeaveRequest ? (
                  <>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Employee</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Leave Type</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Start Date</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>End Date</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Days</TableCell>
                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaveItems.map((item, index) => (
                        <TableRow key={item.id || `${item.employee_id}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {[item.employee?.first_name, item.employee?.last_name, item.employee?.employee_number]
                              .filter(Boolean)
                              .join(' ')}
                          </TableCell>
                          <TableCell>{item.leave_type?.name || '-'}</TableCell>
                          <TableCell>{readableDate(item.start_date)}</TableCell>
                          <TableCell>{readableDate(item.end_date)}</TableCell>
                          <TableCell align="right">{Number(item.days_requested || 0).toLocaleString()}</TableCell>
                          <TableCell>{item.reason || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </>
                ) : (
                  <>
                    <TableHead>
                      <TableRow>
                        <TableCell colSpan={1} sx={{ backgroundColor: mainColor, color: contrastText }}>
                          S/N
                        </TableCell>
                        <TableCell colSpan={3} sx={{ backgroundColor: mainColor, color: contrastText }}>
                          {isPurchase ? 'Product' : 'Ledger'}
                        </TableCell>
                        <TableCell colSpan={1} sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
                          Quantity
                        </TableCell>
                        <TableCell colSpan={1} sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
                          Rate
                        </TableCell>
                        {isPurchase && requisition.vat_amount > 0 && (
                          <TableCell colSpan={1} sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
                            VAT
                          </TableCell>
                        )}
                        <TableCell colSpan={1} sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
                          Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requisitionItems.map((item: RequisitionItem, index: number) => (
                        <React.Fragment key={item.id}>
                          <TableRow sx={{ 
                            backgroundColor: theme.palette.background.paper,
                            '&:nth-of-type(even)': {
                              backgroundColor: theme.palette.action.hover,
                            }
                          }}>
                            <TableCell colSpan={1}>{index + 1}</TableCell>
                            <TableCell colSpan={3}>
                              <Box>
                                <Typography variant="body2">
                                  {isPurchase ? (item as PurchaseItem).product?.name : (item as PaymentItem).ledger?.name}
                                </Typography>
                                {item.remarks && (
                                  <Typography variant="body2" color="text.secondary" sx={{  mt: 0.5 }}>
                                    ({item.remarks})
                                  </Typography>
                                )}
                                {item.relatableNo && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Tooltip title="Related to">
                                      <Typography variant="body2" component="span" color="primary.main">
                                        {item.relatableNo}
                                      </Typography>
                                    </Tooltip>
                                    <Tooltip title="View Order">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setSelectedRelated((item as any).relatable || null);
                                          setOpenViewDialog(true);
                                        }}
                                        sx={{ 
                                          color: 'primary.main',
                                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                                        }}
                                      >
                                        <VisibilityOutlined fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell colSpan={1} align="right" sx={{ fontFamily: 'monospace' }}>
                              {`${item.quantity?.toLocaleString()} ${item.measurement_unit.symbol}`}
                            </TableCell>
                            <TableCell colSpan={1} align="right" sx={{ fontFamily: 'monospace' }}>
                              {formatNumber(item.rate)}
                            </TableCell>
                            {isPurchase && requisition?.vat_amount > 0 && (
                              <TableCell colSpan={1} align="right" sx={{ fontFamily: 'monospace' }}>
                                {formatNumber(item.rate * (item.vat_percentage || 0) * 0.01)}
                              </TableCell>
                            )}
                            <TableCell colSpan={1} align="right" sx={{ fontFamily: 'monospace' }}>
                              {formatCurrency(item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01))}
                            </TableCell>
                          </TableRow>

                          {Array.isArray(item?.vendors) && item.vendors.length > 0 && (
                            <>
                              <TableRow>
                                <TableCell colSpan={isPurchase && requisition.vat_amount > 0 ? 6 : 5} 
                                  sx={{ 
                                    textAlign: 'center', 
                                    backgroundColor: theme.palette.background.default,
                                    borderBottom: `1px solid ${theme.palette.divider}`
                                  }}
                                >
                                  Vendors
                                </TableCell>
                              </TableRow>
                              {item.vendors.map((vendor: Vendor, i: number) => (
                                <TableRow 
                                  key={vendor.id} 
                                  sx={{ 
                                    backgroundColor: theme.palette.background.paper,
                                    '&:nth-of-type(even)': {
                                      backgroundColor: theme.palette.action.hover,
                                    }
                                  }}
                                >
                                  <TableCell colSpan={2}>{vendor.name}</TableCell>
                                  <TableCell colSpan={isPurchase && requisition.vat_amount > 0 ? 4 : 3}>
                                    {vendor.remarks}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </>
                )}
              </Table>
            </TableContainer>
          </Grid>

          {/* Totals Section */}
          {!isLeaveRequest && <Grid size={12}>
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1
              }}
            >
                <Grid container spacing={1}>
                  <Grid size={7}>
                    <Typography variant="body1">
                      Subtotal
                    </Typography>
                  </Grid>
                  <Grid size={5} sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontFamily="monospace">
                      {formatCurrency(subtotal)}
                    </Typography>
                  </Grid>

                  {isPurchase && (
                    <>
                      <Grid size={7}>
                        <Typography variant="body1">
                          VAT
                        </Typography>
                      </Grid>
                      <Grid size={5} sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" fontFamily="monospace">
                          {formatCurrency(totalVAT)}
                        </Typography>
                      </Grid>
                      <Grid size={7}>
                        <Typography variant="h6" color={headerColor}>
                          Grand Total
                        </Typography>
                      </Grid>
                      <Grid size={5} sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color={headerColor} fontFamily="monospace">
                          {formatCurrency(grandTotal)}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  {!isPurchase && (
                    <>
                      <Grid size={7}>
                        <Typography variant="h6" color={headerColor}>
                          Total
                        </Typography>
                      </Grid>
                      <Grid size={5} sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color={headerColor} fontFamily="monospace">
                          {formatCurrency(subtotal)}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
            </Box>
          </Grid>}

          {/* Remarks Section */}
          {requisition.remarks && (
            <Grid size={12} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor }}>
                  Remarks
                </Typography>
                <Typography variant="body1" sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  lineHeight: 1.5
                }}>
                  {requisition.remarks}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Relatable Details Dialog */}
      <Dialog
        open={openViewDialog}
        maxWidth="md"
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={() => setOpenViewDialog(false)}
      >
        <FetchRelatableDetails relatable={selectedRelated || undefined} toggleOpen={setOpenViewDialog} />
      </Dialog>
    </>
  );
};

export default RequisitionsOnScreen;