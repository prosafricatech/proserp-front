import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Divider, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React from 'react'

function PBSummary({combinedInputsConsumptions, otherExpenses, by_products, outputs}) {
    const {authOrganization} = useJumboAuth();
    const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
    const lightColor = authOrganization.organization.settings?.light_color || "#bec5da";
    const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";

    const totalCombinedInputs = combinedInputsConsumptions?.reduce((total, item) => total + ((item.unit_cost || item.rate) * item.quantity || 0), 0);
    const totalOtherExpenses = otherExpenses?.reduce((total, item) => total + (item.quantity * item.rate || 0), 0);
    const totalByProducts = by_products?.reduce((total, item) => total + (item.quantity * item.market_value || 0), 0);

    const combinedInputsOtherExpensesByProduct = (totalCombinedInputs + totalOtherExpenses) - totalByProducts;

  return (
    <Grid container spacing={1}>
        <Grid size={12}>
            <Divider />
        </Grid>

        {combinedInputsConsumptions.length > 0 &&
            <Grid size={12}>
                <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                    Inventory Consumptions
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>S/N</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Date</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Consumption No</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Product</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Quantity</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Average Cost</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Amount</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                combinedInputsConsumptions?.map((item, index) => (
                                    <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{readableDate(item.consumption_date)}</TableCell>
                                        <TableCell>{item.consumptionNo}</TableCell>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product?.unit_symbol)}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{(item.unit_cost || item.rate)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2}) || 0}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{((item.unit_cost || item.rate) * item.quantity || 0)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</TableCell>
                                        <TableCell>{item.description || item.remarks}</TableCell>
                                    </TableRow>
                                ))
                            }
                            {/* Total Amount Row */}
                            <TableRow sx={{ backgroundColor: mainColor }}>
                                <TableCell colSpan={6} align="center" sx={{ fontWeight: 'bold', color: contrastText }}>Total Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                    {combinedInputsConsumptions?.reduce((total, item) => total + ((item.unit_cost || item.rate) * item.quantity || 0), 0)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        }

        {otherExpenses.length > 0 &&
            <Grid size={12}>
                <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                    Other Expenses
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>S/N</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Expense Name</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Quantity</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Rate</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                otherExpenses?.map((item, index) => (
                                    <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{item.ledger?.name}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{item.quantity?.toLocaleString()}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{item.rate?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{(item.quantity * item.rate)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</TableCell>
                                    </TableRow>
                                ))
                            }
                            {/* Total Amount Row */}
                            <TableRow sx={{ backgroundColor: mainColor }}>
                                <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', color: contrastText }}>Total Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                    {otherExpenses?.reduce((total, item) => total + (item.quantity * item.rate || 0), 0)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        }

        {by_products.length > 0 &&
            <Grid size={12}>
                <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                    By Products
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>S/N</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Product</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Store</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Quantity</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Market Value</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText, textAlign: 'right'}}>Amount</TableCell>
                                <TableCell sx={{backgroundColor: mainColor, color: contrastText}}>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                by_products?.map((item, index) => (
                                    <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                        <TableCell>{index + 1}.</TableCell>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell>{item.store?.name}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product?.unit_symbol)}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{item.market_value?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</TableCell>
                                        <TableCell sx={{textAlign: 'right'}}>{(item.quantity * item.market_value)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</TableCell>
                                        <TableCell>{item.description || item.remarks}</TableCell>
                                    </TableRow>
                                ))
                            }
                            {/* Total Amount Row */}
                            <TableRow sx={{ backgroundColor: mainColor }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', color: contrastText }}>Total Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                    {by_products?.reduce((total, item) => total + (item.quantity * item.market_value || 0), 0)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        }

        {outputs.length > 0 &&
            <Grid size={12}>
                <Typography variant="h3" color={mainColor} align="center" marginTop={5}>
                    Outputs
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Product</TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right' }}>Quantity</TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right'  }}>Unit Cost</TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right'  }}>Amount</TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, textAlign: 'right'  }}>Value%</TableCell>
                                <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {outputs?.map((item, index) => (
                                <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor }}>
                                    <TableCell>{index + 1}.</TableCell>
                                    <TableCell>{item.product.name}</TableCell>
                                    <TableCell sx={{textAlign: 'right'}}>
                                        {item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product?.unit_symbol)}
                                    </TableCell>
                                    <TableCell sx={{textAlign: 'right'}}>
                                        {(((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct) / item.quantity)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                                    </TableCell>
                                    <TableCell sx={{textAlign: 'right'}}>
                                        {((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                                    </TableCell>
                                    <TableCell sx={{textAlign: 'right'}}>{item.value_percentage}%</TableCell>
                                    <TableCell>{item.description || item.remarks}</TableCell>
                                </TableRow>
                            ))}

                            {/* Total Row for Amount */}
                            <TableRow sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold' }}>
                                <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', color: contrastText }}>Total Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: contrastText, textAlign: 'right' }}>
                                    {outputs?.reduce((sum, item) => sum + ((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct), 0)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                                </TableCell>
                                <TableCell sx={{ color: contrastText }}></TableCell>
                                <TableCell sx={{ color: contrastText }}></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        }

    </Grid>
  )
}

export default PBSummary