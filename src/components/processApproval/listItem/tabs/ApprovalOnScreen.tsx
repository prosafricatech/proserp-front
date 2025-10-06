import React, { useState } from 'react';
import { Grid, Typography, Paper, Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Tooltip, IconButton, Dialog } from '@mui/material';
import RelatableOrderDetails from './form/RelatableOrderDetails';
import { VisibilityOutlined } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';
import { Approval, RequisitionItem } from '../../RequisitionType';

interface FetchRelatableDetailsProps {
  approval: Approval;
  relatable: {
    id: string;
  } | null;
  toggleOpen: (open: boolean) => void;
}

interface ApprovalOnScreenProps {
  approval: Approval;
  organization: Organization;
  belowLargeScreen: boolean;
}

const FetchRelatableDetails = ({ relatable, toggleOpen }: FetchRelatableDetailsProps) => {
    const { data: orderDetails, isFetching } = useQuery({
        queryKey: ['purchaseOrder', { id: relatable?.id }],
        queryFn: async () => relatable?.id ? purchaseServices.orderDetails(relatable.id) : null
    });

    if (isFetching) {
        return <LinearProgress/>;
    }

    return (
        <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen}/>
    );
};

function ApprovalOnScreen({ approval, organization, belowLargeScreen }: ApprovalOnScreenProps) {
    const [selectedRelated, setSelectedRelated] = useState<any>(null);
    const [openViewDialog, setOpenViewDialog] = useState(false);

    const mainColor = organization.settings?.main_color || "#2113AD";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";
    const lightColor = organization.settings?.light_color || "#bec5da";

    const totalVAT = approval.items
        ?.filter((item: RequisitionItem) => (item.vat_percentage ?? 0) > 0)
        .reduce((total: number, item: RequisitionItem) => 
            total + (item.rate * item.quantity * (item.vat_percentage ?? 0) * 0.01), 0);

    const grandTotal = approval.items
        ?.reduce((total: number, item: RequisitionItem) => 
            total + (item.quantity * item.rate * (1 + (item.vat_percentage ?? 0) * 0.01)), 0);

    return (
        <>
            <Box sx={{ padding: 1 }}>
                <Grid container spacing={1} width={'100%'}>
                    <Grid container spacing={2} width={'100%'}>
                        <Grid size={12} sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color={mainColor}>
                                {approval.requisition?.process_type?.toLowerCase() === 'purchase' 
                                    ? 'Purchase Requisition Approval' 
                                    : 'Payment Requisition Approval'}
                            </Typography>
                            <Typography variant="subtitle1">{approval.requisition?.requisitionNo}</Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} width={'100%'}>
                        <Grid size={6}>
                            <Typography variant="body2" sx={{ color: mainColor }}>Approval Date:</Typography>
                            <Typography variant="body2">{readableDate(approval.approval_date)}</Typography>
                        </Grid>
                    </Grid>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>
                                        {approval.requisition?.process_type?.toLowerCase() === 'purchase' ? 'Product' : 'Ledger'}
                                    </TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>Quantity</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>Rate</TableCell>
                                    {approval.requisition?.process_type?.toLowerCase() === 'purchase' && approval.vat_amount > 0 && (
                                        <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>VAT</TableCell>
                                    )}
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {approval.items.map((item: RequisitionItem, index: number) => (
                                    <React.Fragment key={item.id}>
                                        <TableRow sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    {approval.requisition?.process_type?.toLowerCase() === 'purchase'
                                                        ? item.requisition_product?.product?.name
                                                        : item.requisition_ledger_item?.ledger?.name}
                                                </div>
                                                {item.relatableNo && 
                                                    <>
                                                        <Tooltip title="Related to">
                                                            <span>{item.relatableNo}</span>
                                                        </Tooltip>
                                                        <Tooltip title="View Order">
                                                            <IconButton size='small' onClick={() => {
                                                                setSelectedRelated(item.relatable); 
                                                                setOpenViewDialog(true);
                                                            }}>
                                                                <VisibilityOutlined/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                }
                                                {item.remarks && <div>{`(${item.remarks})`}</div>}
                                            </TableCell>
                                            <TableCell align="right">
                                                {item.quantity?.toLocaleString()} {item.measurement_unit?.symbol || item.requisition_ledger_item?.measurement_unit?.symbol}
                                            </TableCell>
                                            <TableCell align="right">{item.rate?.toLocaleString()}</TableCell>
                                            {approval.requisition?.process_type?.toLowerCase() === 'purchase' && approval.vat_amount > 0 && (
                                                <TableCell align="right">
                                                    {((item.rate * (item.vat_percentage ?? 0) * 0.01)).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                </TableCell>
                                            )}
                                            <TableCell align="right">
                                                {(item.quantity * item.rate * (1 + (item.vat_percentage ?? 0) * 0.01)).toLocaleString('en-US', { 
                                                    style: 'currency', 
                                                    currency: approval.requisition?.currency?.code 
                                                })}
                                            </TableCell>
                                        </TableRow>

                                        {Array.isArray(item?.vendors) && item.vendors.length > 0 && (
                                            <React.Fragment>
                                                <TableRow>
                                                    <TableCell colSpan={6} sx={{ textAlign: 'center', backgroundColor: mainColor, color: contrastText }}>
                                                        Vendors
                                                    </TableCell>
                                                </TableRow>
                                                {item.vendors?.map((vendor, i) => (
                                                    <TableRow key={vendor.id} sx={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                                        <TableCell colSpan={2}>{vendor.name}</TableCell>
                                                        <TableCell colSpan={4}>{vendor.remarks}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Grid container spacing={2} sx={{ mt: 10 }} width={'100%'}>
                        <Grid size={7}>
                            <Typography variant="body2" sx={{ color: mainColor }}>Total</Typography>
                        </Grid>
                        <Grid size={5}>
                            <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                {approval?.items?.reduce((total, item) =>total + (item.quantity || 0) * (item.rate || 0),0).toLocaleString('en-US', { 
                                    style: 'currency', 
                                    currency: approval.requisition?.currency?.code 
                                })}
                            </Typography>
                        </Grid>
                        {approval.requisition?.process_type?.toLowerCase() === 'purchase' && (totalVAT ?? 0) > 0 && (
                            <>
                                <Grid size={7}>
                                    <Typography variant="body2" sx={{ color: mainColor }}>VAT</Typography>
                                </Grid>
                                <Grid size={5}>
                                    <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                        {(totalVAT ?? 0).toLocaleString('en-US', { 
                                            style: 'currency', 
                                            currency: approval.requisition?.currency?.code 
                                        })}
                                    </Typography>
                                </Grid>
                                <Grid size={7}>
                                    <Typography variant="body2" sx={{ color: mainColor }}>Grand Total (VAT Incl.)</Typography>
                                </Grid>
                                <Grid size={5}>
                                    <Typography variant="body2" sx={{ textAlign: 'right' }}>
                                        {(grandTotal ?? 0).toLocaleString('en-US', { 
                                            style: 'currency', 
                                            currency: approval.requisition?.currency?.code 
                                        })}
                                    </Typography>
                                </Grid>
                            </>
                        )}
                    </Grid>

                    <Grid size={12} container spacing={2} sx={{ mt: 2 }} width={'100%'}>
                        {approval.remarks && (
                            <Grid size={6}>
                                <Typography variant="body2" sx={{ color: mainColor }}>Remarks</Typography>
                                <Typography variant="body2">{approval.remarks}</Typography>
                            </Grid>
                        )}
                    </Grid>
                    <Grid container spacing={2} sx={{ mt: 5 }} width={'100%'}>
                        <Grid size={6}>
                            <Typography variant="body2" color={mainColor}>Requested By:</Typography>
                            <Typography variant="body2">{approval.requisition?.creator.name}</Typography>
                        </Grid>
                        <Grid size={6}>
                            <Typography variant="body2" color={mainColor}>Approved By:</Typography>
                            <Typography variant="body2">{approval.creator.name}</Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
            <Dialog 
                open={openViewDialog} 
                fullScreen={belowLargeScreen} 
                maxWidth='lg' 
                fullWidth 
                onClose={() => setOpenViewDialog(false)}
            >
                <FetchRelatableDetails 
                    approval={approval} 
                    relatable={selectedRelated} 
                    toggleOpen={setOpenViewDialog} 
                />
            </Dialog>
        </>
    );
}

export default ApprovalOnScreen;