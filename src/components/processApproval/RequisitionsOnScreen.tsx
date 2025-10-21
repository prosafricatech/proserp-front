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
import RelatableOrderDetails from './listItem/tabs/form/RelatableOrderDetails';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PaymentItem, PurchaseItem, Requisition, RequisitionItem } from './RequisitionType';
import { Organization } from '@/types/auth-types';

interface Props {
  requisition: Requisition;
  organization: Organization;
  belowLargeScreen: boolean;
}

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

  const totalVAT = requisition?.items
    ?.filter((item: RequisitionItem) => (item.vat_percentage || 0) > 0)
    .reduce((total: number, item: RequisitionItem) => 
      total + (item.rate * item.quantity * (item.vat_percentage || 0) * 0.01), 0) || 0;

  const grandTotal = requisition.items
    ?.reduce((total, item) => total + item.quantity * item.rate * (1 + (item.vat_percentage || 0) / 100), 0) || 0;

  const subtotal = requisition?.items?.reduce((total, item) => total + (item.quantity || 0) * (item.rate || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
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
        <Grid container spacing={2}>
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
              <Typography variant="h4" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                {isPurchase ? 'PURCHASE REQUISITION' : 'PAYMENT REQUISITION'}
              </Typography>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {requisition.requisitionNo}
              </Typography>
            </Box>
          </Grid>

          {/* Meta Information */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                  Requisition Date
                </Typography>
                <Typography variant="body1">
                  {readableDate(requisition.requisition_date)}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                  Cost Center
                </Typography>
                <Typography variant="body1">{requisition.cost_center.name}</Typography>
              </Box>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 4}}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
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
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                      #
                    </TableCell>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {isPurchase ? 'Product' : 'Ledger'}
                    </TableCell>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                      Quantity
                    </TableCell>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                      Rate
                    </TableCell>
                    {isPurchase && requisition.vat_amount > 0 && (
                      <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                        VAT
                      </TableCell>
                    )}
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requisition.items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <TableRow sx={{ 
                        backgroundColor: theme.palette.background.paper,
                        '&:nth-of-type(even)': {
                          backgroundColor: theme.palette.action.hover,
                        }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>{index + 1}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {isPurchase ? (item as PurchaseItem).product?.name : (item as PaymentItem).ledger?.name}
                            </Typography>
                            {item.remarks && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mt: 0.5 }}>
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
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                          {`${item.quantity?.toLocaleString()} ${item.measurement_unit.symbol}`}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                          {formatNumber(item.rate)}
                        </TableCell>
                        {isPurchase && requisition?.vat_amount > 0 && (
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                            {formatNumber(item.rate * (item.vat_percentage || 0) * 0.01)}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {formatCurrency(item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01))}
                        </TableCell>
                      </TableRow>

                      {/* Vendors Section */}
                      {Array.isArray(item?.vendors) && item.vendors.length > 0 && (
                        <>
                          <TableRow>
                            <TableCell colSpan={isPurchase && requisition.vat_amount > 0 ? 6 : 5} 
                              sx={{ 
                                textAlign: 'center', 
                                backgroundColor: theme.palette.background.default,
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                borderBottom: `1px solid ${theme.palette.divider}`
                              }}
                            >
                              Vendors
                            </TableCell>
                          </TableRow>
                          {item.vendors.map((vendor, i) => (
                            <TableRow 
                              key={vendor.id} 
                              sx={{ 
                                backgroundColor: theme.palette.background.paper,
                                '&:nth-of-type(even)': {
                                  backgroundColor: theme.palette.action.hover,
                                }
                              }}
                            >
                              <TableCell colSpan={2} sx={{ fontWeight: 'medium' }}>{vendor.name}</TableCell>
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
              </Table>
            </TableContainer>
          </Grid>

          {/* Totals Section */}
          <Grid size={12}>
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
                  <Typography variant="body1" fontWeight="medium">
                    Subtotal
                  </Typography>
                </Grid>
                <Grid size={5} sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" fontWeight="medium" fontFamily="monospace">
                    {formatCurrency(subtotal)}
                  </Typography>
                </Grid>

                {isPurchase && (
                  <>
                    <Grid size={7}>
                      <Typography variant="body1" fontWeight="medium">
                        VAT
                      </Typography>
                    </Grid>
                    <Grid size={5} sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight="medium" fontFamily="monospace">
                        {formatCurrency(totalVAT)}
                      </Typography>
                    </Grid>
                    <Grid size={7}>
                      <Typography variant="h6" fontWeight="bold" color={headerColor}>
                        Grand Total
                      </Typography>
                    </Grid>
                    <Grid size={5} sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" color={headerColor} fontFamily="monospace">
                        {formatCurrency(grandTotal)}
                      </Typography>
                    </Grid>
                  </>
                )}

                {!isPurchase && (
                  <>
                    <Grid size={7}>
                      <Typography variant="h6" fontWeight="bold" color={headerColor}>
                        Total
                      </Typography>
                    </Grid>
                    <Grid size={5} sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" color={headerColor} fontFamily="monospace">
                        {formatCurrency(subtotal)}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </Grid>

          {/* Remarks Section */}
          {requisition.remarks && (
            <Grid size={12} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
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