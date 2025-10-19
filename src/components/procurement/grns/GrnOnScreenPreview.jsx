import React from 'react';
import { Grid, Typography, Divider, Box, Tooltip, useTheme } from '@mui/material';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function GrnOnScreenPreview({ grn, baseCurrency, checkOrganizationPermission, organization }) {
    const theme = useTheme();
    const currencySymbol = grn.currency.symbol;
    const base_Currency = baseCurrency.symbol;
    const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
    const displayAmounts = checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS]);

    const exchangeRate = grn.exchange_rate;
    const costFactor = grn.cost_factor;

    let totalAmountBaseCurrency = 0;
    grn.items.forEach((grnItem) => {
        totalAmountBaseCurrency += (costFactor * grnItem.rate * exchangeRate * grnItem.quantity);
    });

    let totalAmount = 0;
    grn.items.forEach((grnItem) => {
        totalAmount += (grnItem.rate * grnItem.quantity);
    });

    let totalAdditionalCosts = 0;
    grn.additional_costs.forEach((item) => {
        totalAdditionalCosts += (item.amount * item.exchange_rate);
    });

    const formatNumber = (value) => {
        return value.toLocaleString('en-US', { 
            maximumFractionDigits: 2, 
            minimumFractionDigits: 2 
        });
    };

    return (
        <Box sx={{ padding: 2 }}>
            {/* Header Section */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={12}>
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
                            GOODS RECEIVED NOTE
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {grn.grnNo}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Metadata Section */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Date Received
                        </Typography>
                        <Typography variant="body1">
                            {readableDate(grn.date_received)}
                        </Typography>
                    </Box>
                </Grid>
                {grn?.reference && (
                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                Reference
                            </Typography>
                            <Typography variant="body1">{grn.reference}</Typography>
                        </Box>
                    </Grid>
                )}
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Currency
                        </Typography>
                        <Typography variant="body1">{grn.currency.name}</Typography>
                    </Box>
                </Grid>
                {grn?.currency.id > 1 && displayAmounts && (
                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                Exchange Rate
                            </Typography>
                            <Typography variant="body1">{exchangeRate}</Typography>
                        </Box>
                    </Grid>
                )}
                {grn?.cost_factor > 1 && displayAmounts && (
                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                Cost Factor
                            </Typography>
                            <Typography variant="body1">{costFactor}</Typography>
                        </Box>
                    </Grid>
                )}
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Supplier
                        </Typography>
                        <Typography variant="body1">{grn.order.stakeholder?.name}</Typography>
                    </Box>
                </Grid>
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Receiving Store
                        </Typography>
                        <Typography variant="body1">{grn.store.name}</Typography>
                    </Box>
                </Grid>
                {grn?.cost_centers && (
                    <Grid size={{xs: 12, sm: 6, md: 4}}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                                Cost Center{grn.cost_centers.length > 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="body1">{grn.cost_centers.map((cc) => cc.name).join(', ')}</Typography>
                        </Box>
                    </Grid>
                )}
                <Grid size={{xs: 12, sm: 6, md: 4}}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                            Received By
                        </Typography>
                        <Typography variant="body1">{grn.creator?.name}</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Items Section */}
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: headerColor, 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        mb: 2
                    }}
                >
                    ITEMS RECEIVED
                </Typography>
                
                <Box 
                    sx={{ 
                        p: 2, 
                        backgroundColor: theme.palette.background.default,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1
                    }}
                >
                    {grn.items.map((grnItem, index) => (
                        <Box key={index}>
                            <Grid container alignItems="center" sx={{ py: 1 }}>
                                <Grid size={{xs: 1, md: 1}}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {index + 1}.
                                    </Typography>
                                </Grid>
                                <Grid size={{xs: 7, md: 5}}>
                                    <Typography variant="body2" fontWeight="medium">
                                        {grnItem.product.name}
                                    </Typography>
                                </Grid>
                                <Grid size={{xs: 4, md: 2}} sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                                        {`${grnItem.quantity} ${grnItem.measurement_unit?.symbol}`}
                                    </Typography>
                                </Grid>
                                
                                {displayAmounts && (
                                    <>
                                        <Grid size={{xs: 6, md: 2}} sx={{ textAlign: 'right' }}>
                                            <Tooltip title="Unit Price">
                                                <Typography variant="body2" fontFamily="monospace">
                                                    {currencySymbol} {formatNumber(grnItem.rate)}
                                                </Typography>
                                            </Tooltip>
                                        </Grid>
                                        <Grid size={{xs: 6, md: 2}} sx={{ textAlign: 'right' }}>
                                            <Tooltip title="Amount">
                                                <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
                                                    {currencySymbol} {formatNumber(grnItem.quantity * grnItem.rate)}
                                                </Typography>
                                            </Tooltip>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                            
                            {displayAmounts && grn.additional_costs.length > 0 && (
                                <Grid container sx={{ pl: 4, py: 0.5 }}>
                                    <Grid size={{xs: 6, md: 3}} sx={{ textAlign: 'right' }}>
                                        <Tooltip title={`Cost Per Unit in ${base_Currency}`}>
                                            <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                                                {base_Currency} {formatNumber(costFactor * grnItem.rate * exchangeRate)}
                                            </Typography>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={{xs: 6, md: 3}} sx={{ textAlign: 'right' }}>
                                        <Tooltip title={`Amount in ${base_Currency}`}>
                                            <Typography variant="body2" color="text.secondary" fontWeight="medium" fontFamily="monospace">
                                                {base_Currency} {formatNumber(costFactor * grnItem.rate * exchangeRate * grnItem.quantity)}
                                            </Typography>
                                        </Tooltip>
                                    </Grid>
                                </Grid>
                            )}
                            
                            {index < grn.items.length - 1 && (
                                <Divider sx={{ borderColor: theme.palette.divider, my: 1 }} />
                            )}
                        </Box>
                    ))}
                    
                    {displayAmounts && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Grid container>
                                <Grid size={8}>
                                    <Typography variant="body1" fontWeight="bold">
                                        TOTAL ({currencySymbol})
                                    </Typography>
                                </Grid>
                                <Grid size={4} sx={{ textAlign: 'right' }}>
                                    <Typography variant="body1" fontWeight="bold" fontFamily="monospace">
                                        {currencySymbol} {formatNumber(totalAmount)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Additional Costs Section */}
            {displayAmounts && grn.additional_costs.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: headerColor, 
                            textAlign: 'center', 
                            fontWeight: 'bold',
                            mb: 2
                        }}
                    >
                        ADDITIONAL COSTS
                    </Typography>
                    
                    <Box 
                        sx={{ 
                            p: 2, 
                            backgroundColor: theme.palette.background.default,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1
                        }}
                    >
                        {grn.additional_costs.map((item, index) => (
                            <Box key={index}>
                                <Grid container alignItems="center" sx={{ py: 1 }}>
                                    <Grid size={7}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {item.name}
                                        </Typography>
                                    </Grid>
                                    <Grid size={5} sx={{ textAlign: 'right' }}>
                                        <Tooltip title={`Amount in ${item.currency?.symbol}`}>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {item.currency?.symbol} {formatNumber(item.amount)}
                                            </Typography>
                                        </Tooltip>
                                        <Typography variant="caption" color="text.secondary">
                                            Exchange Rate: {item.exchange_rate}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                {index < grn.additional_costs.length - 1 && (
                                    <Divider sx={{ borderColor: theme.palette.divider }} />
                                )}
                            </Box>
                        ))}
                        
                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Grid container>
                                <Grid size={8}>
                                    <Typography variant="body1" fontWeight="bold">
                                        TOTAL Additional Costs ({base_Currency})
                                    </Typography>
                                </Grid>
                                <Grid size={4} sx={{ textAlign: 'right' }}>
                                    <Tooltip title={`Total Additional Costs in ${base_Currency}`}>
                                        <Typography variant="body1" fontWeight="bold" fontFamily="monospace">
                                            {base_Currency} {formatNumber(totalAdditionalCosts)}
                                        </Typography>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Totals Section */}
            {displayAmounts && (
                <Box 
                    sx={{ 
                        p: 2, 
                        backgroundColor: theme.palette.background.default,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1
                    }}
                >
                    <Grid container>
                        <Grid size={8}>
                            <Typography variant="h6" fontWeight="bold" color={headerColor}>
                                Total Value of Goods ({base_Currency})
                            </Typography>
                        </Grid>
                        <Grid size={4} sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight="bold" color={headerColor} fontFamily="monospace">
                                {formatNumber(totalAmountBaseCurrency)}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Remarks Section */}
            {grn.remarks && (
                <Box sx={{ mt: 3 }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: headerColor, 
                            textAlign: 'center', 
                            fontWeight: 'bold',
                            mb: 2
                        }}
                    >
                        REMARKS
                    </Typography>
                    <Box 
                        sx={{ 
                            p: 2, 
                            backgroundColor: theme.palette.background.default,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                            {grn.remarks}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default GrnOnScreenPreview;