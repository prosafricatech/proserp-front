import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Divider, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React from 'react'
import { useFormContext } from 'react-hook-form';

function SummaryTab() {
    const {authOrganization,order,getReceivedItemsSummary,getTotalAmount,getTotalCostAmount,getTotalAdditionalCostsAmount,getAdditionalCostsSummary} = useFormContext();
    const {currencies} = useCurrencySelect();
    const currency = order.currency;
    const {checkOrganizationPermission} = useJumboAuth(); 
    const baseCurrency = currencies.find((currency) => !!currency?.is_base).symbol;
    const withPrices = checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS,PERMISSIONS.PURCHASES_CREATE]);

    const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
    const lightColor = authOrganization.organization.settings?.light_color || "#bec5da";
    const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
    
  return (
    <Grid container spacing={1}>
        <Grid size={12}>
        <Divider />
        </Grid>
        <Grid size={12}>
            <Typography variant="h3" color={mainColor} align="center">
                Received Items
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>S/N</TableCell>
                            <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Product/Service</TableCell>
                            <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Unit</TableCell>
                            <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align={'right'}>Quantity</TableCell>
                            {
                                withPrices &&
                                <>
                                    <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align={'right'}>Unit Price</TableCell>
                                    <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align={'right'}>Amount</TableCell>
                                    <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align={'right'}>Cost P.U ({baseCurrency})</TableCell>
                                    <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align={'right'}>Amount ({baseCurrency})</TableCell>
                                </>
                            }
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {getReceivedItemsSummary().filter(item => item.receivedQuantity > 0).map((item, index) => (
                            <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                <TableCell>{index + 1}.</TableCell>
                                <TableCell>{item.product}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell align={'right'}>{item.receivedQuantity}</TableCell>
                                {
                                    withPrices &&
                                    <>
                                        <TableCell align={'right'}>{item.rate.toLocaleString()}</TableCell>
                                        <TableCell align={'right'}>
                                        <Typography noWrap>{(item.receivedQuantity * item.rate).toLocaleString("en-US", {style:"currency", currency:currency.code})}</Typography>
                                        </TableCell>
                                        <TableCell align={'right'}>{(item.exchangeRate * item.rate * item.costfactor).toLocaleString()}</TableCell>
                                        <TableCell align={'right'}>{(item.exchangeRate * item.rate * item.costfactor * item.receivedQuantity).toLocaleString()}</TableCell>
                                    </>
                                }
                            </TableRow>
                        ))}
                    </TableBody>
                    {
                        withPrices &&
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}} colSpan={4} align="right">TOTAL</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}} colSpan={2} align={'right'}>
                                    <Typography noWrap>{currency.symbol} {getTotalAmount().toLocaleString()}</Typography>
                                </TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}} colSpan={1}></TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align={'right'}>{getTotalCostAmount().toLocaleString()}</TableCell>
                            </TableRow>
                        </TableHead>
                    }
                </Table>
            </TableContainer>
        </Grid>
        {
            getAdditionalCostsSummary().length > 0 && 
            <Grid size={12} mt={3}>
                <Typography variant="h3" color={mainColor} align="center">
                    Additional Costs
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>S/N</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Additional Costs</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align='right'>Exchange Rate</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}} align='right'>Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {getAdditionalCostsSummary().map((item, index) => (
                            <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                <TableCell>{index + 1}.</TableCell>
                                <TableCell>{item.costName}</TableCell>
                                <TableCell align='right'>{item.exchangeRate.toLocaleString()}</TableCell>
                                <TableCell align='right'>{item.itemCurrency} {(item.amount).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                        <TableHead>
                            <TableRow>
                                <TableCell colSpan={3} align="right">
                                    <Typography variant="body2" style={{ color: mainColor }}>
                                        TOTAL Additional Costs ({baseCurrency})
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" style={{ color: mainColor }}>
                                        {getTotalAdditionalCostsAmount().toLocaleString()}
                                    </Typography>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={3} align="right">
                                    <Typography variant="body2" style={{ color: mainColor }}>
                                        TOTAL Value of Goods ({baseCurrency})
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" style={{ color: mainColor }}>
                                        {getTotalCostAmount().toLocaleString()}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>
                </TableContainer>
            </Grid>
        }
    </Grid>
  )
}

export default SummaryTab