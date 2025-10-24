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
    const theme = useTheme();
    const [selectedRelated, setSelectedRelated] = useState<any>(null);
    const [openViewDialog, setOpenViewDialog] = useState(false);

    const mainColor = organization.settings?.main_color || "#2113AD";
    const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

    const isPurchase = approval.requisition?.process_type?.toLowerCase() === 'purchase';

    const totalVAT = approval.items
        ?.filter((item: RequisitionItem) => (item.vat_percentage ?? 0) > 0)
        .reduce((total: number, item: RequisitionItem) => 
            total + (item.rate * item.quantity * (item.vat_percentage ?? 0) * 0.01), 0);

    const grandTotal = approval.items
        ?.reduce((total: number, item: RequisitionItem) => 
            total + (item.quantity * item.rate * (1 + (item.vat_percentage ?? 0) * 0.01)), 0);

    const subtotal = approval?.items?.reduce((total, item) => total + (item.quantity || 0) * (item.rate || 0), 0);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { 
            style: 'currency', 
            currency: approval.requisition?.currency?.code,
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
            <Box sx={{ padding: 2 }}>
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
                                {isPurchase ? 'PURCHASE REQUISITION APPROVAL' : 'PAYMENT REQUISITION APPROVAL'}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {approval.requisition?.requisitionNo}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Approval Information */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{xs: 12, sm: 6, md: 4}}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                    Approval Date
                                </Typography>
                                <Typography variant="body1">
                                    {readableDate(approval.approval_date)}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 4}}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                    Requested By
                                </Typography>
                                <Typography variant="body1">{approval.requisition?.creator.name}</Typography>
                            </Box>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6, md: 4}}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                    Approved By
                                </Typography>
                                <Typography variant="body1">{approval.creator.name}</Typography>
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
                                        {isPurchase && approval.vat_amount > 0 && (
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
                                    {approval.items.map((item: RequisitionItem, index: number) => (
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
                                                            {isPurchase
                                                                ? item.requisition_product?.product?.name
                                                                : item.requisition_ledger_item?.ledger?.name
                                                            }
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
                                                                        size='small' 
                                                                        onClick={() => {
                                                                            setSelectedRelated(item.relatable); 
                                                                            setOpenViewDialog(true);
                                                                        }}
                                                                        sx={{ 
                                                                            color: 'primary.main',
                                                                            '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                                                                        }}
                                                                    >
                                                                        <VisibilityOutlined fontSize="small"/>
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                                    {`${item.quantity?.toLocaleString()} ${item.measurement_unit?.symbol || item.requisition_ledger_item?.measurement_unit?.symbol}`}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                                    {formatNumber(item.rate)}
                                                </TableCell>
                                                {isPurchase && approval.vat_amount > 0 && (
                                                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                                        {formatNumber((item.rate * (item.vat_percentage ?? 0) * 0.01))}
                                                    </TableCell>
                                                )}
                                                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                    {formatCurrency(item.quantity * item.rate * (1 + (item.vat_percentage ?? 0) * 0.01))}
                                                </TableCell>
                                            </TableRow>

                                            {/* Vendors Section */}
                                            {Array.isArray(item?.vendors) && item.vendors.length > 0 && (
                                                <React.Fragment>
                                                    <TableRow>
                                                        <TableCell 
                                                            colSpan={isPurchase && approval.vat_amount > 0 ? 6 : 5} 
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
                                                    {item.vendors?.map((vendor, i) => (
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
                                                            <TableCell colSpan={isPurchase && approval.vat_amount > 0 ? 4 : 3}>
                                                                {vendor.remarks}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
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

                                {isPurchase && (totalVAT ?? 0) > 0 && (
                                    <>
                                        <Grid size={7}>
                                            <Typography variant="body1" fontWeight="medium">
                                                VAT
                                            </Typography>
                                        </Grid>
                                        <Grid size={5} sx={{ textAlign: 'right' }}>
                                            <Typography variant="body1" fontWeight="medium" fontFamily="monospace">
                                                {formatCurrency(totalVAT ?? 0)}
                                            </Typography>
                                        </Grid>
                                        <Grid size={7}>
                                            <Typography variant="h6" fontWeight="bold" color={headerColor}>
                                                Grand Total
                                            </Typography>
                                        </Grid>
                                        <Grid size={5} sx={{ textAlign: 'right' }}>
                                            <Typography variant="h6" fontWeight="bold" color={headerColor} fontFamily="monospace">
                                                {formatCurrency(grandTotal ?? 0)}
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
                    {approval.remarks && (
                        <Grid size={12} sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                    Approval Remarks
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                    p: 2, 
                                    backgroundColor: theme.palette.background.default,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 1,
                                    lineHeight: 1.5
                                }}>
                                    {approval.remarks}
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Relatable Details Dialog */}
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