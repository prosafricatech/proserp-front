import React from 'react';
import { 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Divider, 
    DialogActions, 
    Button, 
    DialogContent, 
    Grid 
} from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Product } from '@/components/productAndServices/products/ProductType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';

interface PurchaseOrderItem {
    id: number;
    product_id: number;
    product: Product;
    measurement_unit_id: number;
    measurement_unit: MeasurementUnit;
    quantity: number;
    rate: number;
    vat_percentage: number;
    vat_exempted: number;
    conversion_factor: number;
    unreceived_quantity: number;
}

interface Creator {
    id: number;
    name: string;
    email: string;
    phone: string;
}

interface Order {
    id: number;
    orderNo: string;
    order_date: string;
    date_required: string | null;
    amount: number;
    vat_amount: number;
    currency_id: number;
    currency: Currency;
    cost_centers: CostCenter[];
    creator: Creator;
    purchase_order_items: PurchaseOrderItem[];
    stakeholder: Stakeholder;
    stakeholder_id: number;
    reference: string | null;
    requisitionNo: string | null;
    exchange_rate: number;
    status: string;
    terms_of_payment: string | null;
    paid_from?: {
        name: string;
    };
}

interface RelatableOrderDetailsProps {
    order: Order;
    toggleOpen: (open: boolean) => void;
}

function RelatableOrderDetails({ order, toggleOpen }: RelatableOrderDetailsProps) {
    const currencyCode = order.currency.code;
    const { checkOrganizationPermission, authOrganization } = useJumboAuth();
    const organization = authOrganization?.organization;
    const mainColor = organization?.settings?.main_color || "#2113AD";
    const lightColor = organization?.settings?.light_color || "#bec5da";
    const contrastText = organization?.settings?.contrast_text || "#FFFFFF";
    const withPrices = checkOrganizationPermission([PERMISSIONS.PURCHASES_CREATE, PERMISSIONS.ACCOUNTS_REPORTS]);
    
    const vatAmount = order.purchase_order_items.reduce((total, item) => {
        return total + (item.rate * item.quantity * item.vat_percentage * 0.01);
    }, 0);

    return (
        <>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color={mainColor}>PURCHASE ORDER</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">{order.orderNo}</Typography>
                    </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mt: 5, mb: 10 }}>
                    <Grid size={{ xs: 8, md: 6, lg: 4 }}>
                        <Typography variant="body2" color={mainColor}>Order Date</Typography>
                        <Typography variant="body2">{readableDate(order.order_date)}</Typography>
                    </Grid>
                    {order.date_required && (
                        <Grid size={{ xs: 4, md: 6, lg: 4 }}>
                            <Typography variant="body2" color={mainColor}>Date Required</Typography>
                            <Typography variant="body2">{readableDate(order.date_required)}</Typography>
                        </Grid>
                    )}
                    {order.cost_centers && (
                        <Grid size={{ xs: 8, md: 6, lg: 4 }}>
                            <Typography variant="body2" color={mainColor}>Purchase For</Typography>
                            <Typography variant="body2">
                                {order.cost_centers.map(cc => cc.name).join(', ')}
                            </Typography>
                        </Grid>
                    )}
                    <Grid size={{ xs: 8, md: 6, lg: 4 }}>
                        <Typography variant="body2" color={mainColor}>Created By:</Typography>
                        <Typography variant="body2">{order.creator.name}</Typography>
                    </Grid>
                    {(order.reference || order.requisitionNo) && (
                        <Grid size={{ xs: 4, md: 6, lg: 4 }}>
                            <Typography variant="body2" color={mainColor}>Reference</Typography>
                            {order.reference && <Typography variant="body2">{order.reference}</Typography>}
                            {order.requisitionNo && <Typography variant="body2">{order.requisitionNo}</Typography>}
                        </Grid>
                    )}
                    {order.currency_id > 1 && (
                        <Grid size={{ xs: 8, md: 6, lg: 4 }}>
                            <Typography variant="body2" color={mainColor}>Exchange Rate</Typography>
                            <Typography variant="body2">{order.exchange_rate}</Typography>
                        </Grid>
                    )}
                </Grid>

                <Grid container spacing={1} sx={{ mt: 2, mb: 3 }}>
                    <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color={mainColor} sx={{ p: '5px' }}>SUPPLIER</Typography>
                        <Divider/>
                        <Typography variant="body1">{order.stakeholder.name}</Typography>
                        {order.stakeholder.address && <Typography variant="body2">{order.stakeholder.address}</Typography>}
                        {order.stakeholder_id === null && order.paid_from && (
                            <Grid container justifyContent="space-between">
                                <Typography variant="body2">Paid From:</Typography>
                                <Typography variant="body2">{order.paid_from.name}</Typography>
                            </Grid>
                        )}
                        {order.stakeholder.tin && (
                            <Grid container justifyContent="space-between">
                                <Typography variant="body2">TIN:</Typography>
                                <Typography variant="body2">{order.stakeholder.tin}</Typography>
                            </Grid>
                        )}
                        {order.stakeholder.vrn && (
                            <Grid container justifyContent="space-between">
                                <Typography variant="body2">VRN:</Typography>
                                <Typography variant="body2">{order.stakeholder.vrn}</Typography>
                            </Grid>
                        )}
                        {order.stakeholder.phone && (
                            <Grid container justifyContent="space-between">
                                <Typography variant="body2">Phone:</Typography>
                                <Typography variant="body2">{order.stakeholder.phone}</Typography>
                            </Grid>
                        )}
                        {order.stakeholder.email && (
                            <Grid container justifyContent="space-between">
                                <Typography variant="body2">Email:</Typography>
                                <Typography variant="body2">{order.stakeholder.email}</Typography>
                            </Grid>
                        )}
                    </Grid>
                </Grid>

                <>
                    <Grid container spacing={1} sx={{ pt: 2 }}>
                        <Grid size={12} sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color={mainColor}>ITEMS</Typography>
                        </Grid>
                    </Grid>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Product/Service</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Unit</TableCell>
                                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>Quantity</TableCell>
                                    {withPrices && (
                                        <>
                                            <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>
                                                Price{vatAmount > 0 ? ' (Excl.)' : ''}
                                            </TableCell>
                                            {vatAmount > 0 && (
                                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>VAT</TableCell>
                                            )}
                                            <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>
                                                Amount{vatAmount > 0 ? ' (Incl.)' : ''}
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order.purchase_order_items.map((orderItem, index) => (
                                    <TableRow key={orderItem.id} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{orderItem.product.name || orderItem.product.item_name}</TableCell>
                                        <TableCell>{orderItem.measurement_unit.symbol}</TableCell>
                                        <TableCell align="right">{orderItem.quantity}</TableCell>
                                        {withPrices && (
                                            <>
                                                <TableCell align="right">
                                                    {orderItem.rate.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                </TableCell>
                                                {vatAmount > 0 && (
                                                    <TableCell align="right">
                                                        {(orderItem.rate * orderItem.quantity * orderItem.vat_percentage * 0.01)
                                                            .toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                )}
                                                <TableCell align="right">
                                                    {(orderItem.rate * orderItem.quantity * (1 + orderItem.vat_percentage * 0.01))
                                                        .toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>

                {withPrices && (
                    <>
                        <Grid container sx={{ pt: 15 }}>
                            <Grid size={7}>
                                <Typography variant="body2">Total</Typography>
                            </Grid>
                            <Grid size={5} sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight="bold">
                                    {order.amount.toLocaleString("en-US", { 
                                        style: "currency", 
                                        currency: currencyCode 
                                    })}
                                </Typography>
                            </Grid>
                        </Grid>
            
                        {vatAmount > 0 && (
                            <>
                                <Grid container sx={{ mt: 1 }}>
                                    <Grid size={7}>
                                        <Typography variant="body2">VAT</Typography>
                                    </Grid>
                                    <Grid size={5} sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            {vatAmount.toLocaleString("en-US", { 
                                                style: "currency", 
                                                currency: currencyCode 
                                            })}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Grid container sx={{ mt: 1 }}>
                                    <Grid size={7}>
                                        <Typography variant="body2">Grand Total (VAT Incl.)</Typography>
                                    </Grid>
                                    <Grid size={5} sx={{ textAlign: 'right' }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            {(order.amount + vatAmount).toLocaleString("en-US", { 
                                                style: "currency", 
                                                currency: currencyCode 
                                            })}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button size="small" variant='outlined' onClick={() => toggleOpen(false)}>
                    Close
                </Button>
            </DialogActions>
        </>
    );
}

export default RelatableOrderDetails;