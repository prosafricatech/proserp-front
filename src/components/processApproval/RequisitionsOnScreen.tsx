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
  Dialog
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
    const [selectedRelated, setSelectedRelated] = useState<{ id: number } | null>(null);
    const [openViewDialog, setOpenViewDialog] = useState(false);

    const mainColor = organization.settings?.main_color || '#2113AD';
    const contrastText = organization.settings?.contrast_text || '#FFFFFF';
    const lightColor = organization.settings?.light_color || '#bec5da';

    const isPurchase = requisition?.approval_chain.process_type?.toLowerCase() === 'purchase';

    const totalVAT = requisition?.items
        ?.filter((item: RequisitionItem) => (item.vat_percentage || 0) > 0)
        .reduce((total: number, item: RequisitionItem) => 
            total + (item.rate * item.quantity * (item.vat_percentage || 0) * 0.01), 0) || 0;

    const grandTotal =
        requisition.items
        ?.reduce((total, item) => total + item.quantity * item.rate * (1 + (item.vat_percentage || 0) / 100), 0) || 0;

  return (
    <>
      <Box sx={{ p: 1 }}>
        <Grid container spacing={1}>
          {/* Title */}
          <Grid size={12} sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: mainColor }}>
              {isPurchase ? 'Purchase Requisition' : 'Payment Requisition'}
            </Typography>
            <Typography variant="subtitle1">{requisition.requisitionNo}</Typography>
          </Grid>

          {/* Meta Info */}
          <Grid container spacing={2} sx={{ mt: 1, mb: 2 }} width={'100%'}>
            <Grid size={6}>
              <Typography variant="body2" sx={{ color: mainColor }}>Requisition Date:</Typography>
              <Typography variant="body2">{readableDate(requisition.requisition_date)}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="body2" sx={{ color: mainColor }}>Cost Center:</Typography>
              <Typography variant="body2">{requisition.cost_center.name}</Typography>
            </Grid>
          </Grid>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                    {isPurchase ? 'Product' : 'Ledger'}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Quantity</TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Rate</TableCell>
                  {isPurchase && requisition.vat_amount > 0 && (
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">VAT</TableCell>
                  )}
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requisition.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TableRow sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>{isPurchase ? (item as PurchaseItem).product?.name : (item as PaymentItem).ledger?.name}</div>
                        {item.relatableNo && (
                          <>
                            <Tooltip title="Related to">
                                <Typography variant="body2" component="span">
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
                              >
                                <VisibilityOutlined />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {item.remarks && <div>({item.remarks})</div>}
                      </TableCell>
                      <TableCell align="right">
                        {item.quantity?.toLocaleString()} {item.measurement_unit.symbol}
                      </TableCell>
                      <TableCell align="right">{item.rate?.toLocaleString()}</TableCell>
                      {isPurchase && requisition?.vat_amount > 0 && (
                        <TableCell align="right">
                          {(item.rate * (item.vat_percentage || 0) * 0.01).toLocaleString(undefined, {
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {(item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01)).toLocaleString('en-US', {
                          style: 'currency',
                          currency: requisition.currency?.code
                        })}
                      </TableCell>
                    </TableRow>

                    {/* Vendors */}
                    {Array.isArray(item?.vendors) && item.vendors.length > 0 && (
                      <>
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', backgroundColor: mainColor, color: contrastText }}>
                            Vendors
                          </TableCell>
                        </TableRow>
                        {item.vendors.map((vendor, i) => (
                          <TableRow key={vendor.id} sx={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor }}>
                            <TableCell colSpan={2}>{vendor.name}</TableCell>
                            <TableCell colSpan={4}>{vendor.remarks}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Grid container spacing={2} sx={{ mt: 2 }} width={'100%'}>
            <Grid size={7}>
              <Typography variant="body2" sx={{ color: mainColor }}>Total</Typography>
            </Grid>
            <Grid size={5}>
              <Typography variant="body2" align="right">
                {requisition?.items?.reduce((total, item) =>total + (item.quantity || 0) * (item.rate || 0),0).toLocaleString('en-US', {
                  style: 'currency',
                  currency: requisition.currency?.code
                })}
              </Typography>
            </Grid>

            {isPurchase && (
              <>
                <Grid size={7}>
                  <Typography variant="body2" sx={{ color: mainColor }}>VAT</Typography>
                </Grid>
                <Grid size={5}>
                  <Typography variant="body2" align="right">
                    {totalVAT.toLocaleString('en-US', {
                      style: 'currency',
                      currency: requisition.currency?.code
                    })}
                  </Typography>
                </Grid>
                <Grid size={7}>
                  <Typography variant="body2" sx={{ color: mainColor }}>Grand Total (VAT Incl.)</Typography>
                </Grid>
                <Grid size={5}>
                  <Typography variant="body2" align="right">
                    {grandTotal.toLocaleString('en-US', {
                      style: 'currency',
                      currency: requisition.currency?.code
                    })}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>

          {/* Remarks & Creator */}
          <Grid container spacing={2} sx={{ mt: 2 }} width={'100%'}>
            {requisition.remarks && (
              <Grid size={6}>
                <Typography variant="body2" sx={{ color: mainColor }}>Remarks</Typography>
                <Typography variant="body2">{requisition.remarks}</Typography>
              </Grid>
            )}
            <Grid size={6}>
              <Typography variant="body2" sx={{ color: mainColor }}>Requested By:</Typography>
              <Typography variant="body2">{requisition.creator.name}</Typography>
            </Grid>
          </Grid>
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
