import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Button, Card, CardContent, Divider, Grid, IconButton, TextField, Tooltip, Typography, Autocomplete } from '@mui/material';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';

function CashReconciliation() {
  const [fuelVoucherTotals, setFuelVoucherTotals] = useState({});
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { adjustments, setCheckShiftBalanced, products, fuel_pumps, fuelVouchers, shiftLedgers, setValue, errors, watch, cashReconciliationFields, cashReconciliationAppend, cashReconciliationRemove } = useFormContext();
 
  // Extract all watched values at the top level to prevent unnecessary re-renders
  const productPrices = watch('product_prices') || [];
  const pumpReadings = watch('pump_readings') || [];
  const mainLedgerId = watch('main_ledger_id');
  const otherLedgers = watch('other_ledgers') || [];
  const mainLedger = watch('main_ledger') || {};

  // Calculate fuel voucher totals - simplified and stable
  useEffect(() => {
    if (!fuelVouchers?.length || !productPrices?.length) {
      setFuelVoucherTotals({});
      return;
    }

    const fuelVouchertotal = {};
    fuelVouchers.forEach((fuelVoucher) => {
      if (!fuelVoucher?.product_id) return;
      
      const productId = fuelVoucher.product_id;
      const quantity = fuelVoucher?.quantity || 0;
      const productPrice = productPrices.find(price => price?.product_id === productId)?.price || 0;
      fuelVouchertotal[productId] = (fuelVouchertotal[productId] || 0) + (quantity * productPrice);
    });
    
    setFuelVoucherTotals(fuelVouchertotal);
  }, [fuelVouchers, productPrices]);

  // Calculate product totals - stable calculation
  const productTotals = useMemo(() => {
    const totals = {};
    
    if (!fuel_pumps?.length || !pumpReadings?.length) return totals;
    
    fuel_pumps.forEach((pump) => {
      const productId = pump?.product_id;
      if (!productId) return;
      
      const pump_reading = pumpReadings.find(reading => reading?.fuel_pump_id === pump.id);
      const difference = ((pump_reading?.closing || 0) - (pump_reading?.opening || 0)) || 0;
      totals[productId] = (totals[productId] || 0) + difference;
    });

    // Apply adjustments
    adjustments?.forEach((adjustment) => {
      const productId = adjustment?.product_id;
      const quantity = adjustment?.quantity || 0;
      
      if (adjustment.operator === '-') {
        totals[productId] = (totals[productId] || 0) + quantity;
      } else if (adjustment.operator === '+') {
        totals[productId] = (totals[productId] || 0) - quantity;
      }
    });

    return totals;
  }, [fuel_pumps, pumpReadings, adjustments]);

  // Calculate grand totals - stable and independent
  const { grandFuelVoucherTotal, grandProductsTotal, cashRemaining } = useMemo(() => {
    const grandFuelVoucherTotal = Object.values(fuelVoucherTotals).reduce((acc, curr) => acc + (curr || 0), 0);
    
    const grandProductsTotal = products?.reduce((acc, product) => {
      const productTotal = productTotals[product.id] || 0;
      const productPrice = productPrices.find(price => price?.product_id === product.id)?.price || 0;
      return acc + (productTotal * productPrice);
    }, 0) || 0;

    const cashRemaining = grandProductsTotal - grandFuelVoucherTotal;

    return { 
      grandFuelVoucherTotal, 
      grandProductsTotal, 
      cashRemaining 
    };
  }, [fuelVoucherTotals, products, productTotals, productPrices]);

  // Calculate other ledgers total
  const totalOtherLedgersAmount = useMemo(() => {
    return otherLedgers.reduce((total, field) => {
      const amount = parseFloat(field?.amount || 0);
      return total + amount;
    }, 0);
  }, [otherLedgers]);

  // Calculate main ledger amount - NO useEffect for this!
  const main_ledger_amount = Math.max(0, cashRemaining - totalOtherLedgersAmount);

  // Single, stable useEffect for form synchronization
    useEffect(() => {
    // Prevent calculation if cashRemaining is invalid
    if (isNaN(cashRemaining) || cashRemaining < 0) {
      setCheckShiftBalanced(false);
      return;
    }
    // Only update if values are meaningfully different
    const currentMainLedgerAmount = parseFloat(mainLedger?.amount || 0);
    const calculatedAmount = sanitizedNumber(main_ledger_amount);
    
    // Update main ledger if significantly different (avoid floating point issues)
    if (Math.abs(currentMainLedgerAmount - calculatedAmount) > 0.01) {
      setValue('main_ledger', {
        id: mainLedgerId,
        amount: calculatedAmount,
      }, { 
        shouldValidate: true, 
        shouldDirty: true 
      });
    }

    // Update the main_ledger_amount field separately
    setValue('main_ledger_amount', calculatedAmount, {
      shouldValidate: true,
      shouldDirty: true
    });

     // Check balance (with tolerance for floating point arithmetic)
  const isBalanced = Math.abs(cashRemaining - (calculatedAmount + totalOtherLedgersAmount)) < 0.01;
  setCheckShiftBalanced(isBalanced);
 }, [main_ledger_amount, cashRemaining, totalOtherLedgersAmount, setValue, setCheckShiftBalanced]);

  // Separate effect for initial setup - runs only once
  useEffect(() => {
    // Initialize other ledgers with sanitized amounts if they exist
    if (otherLedgers.length > 0) {
      const sanitizedLedgers = otherLedgers.map(field => ({
        id: field.id,
        amount: sanitizedNumber(field.amount || 0),
      }));
      
      setValue('other_ledgers', sanitizedLedgers, { 
        shouldValidate: true, 
        shouldDirty: true 
      });
    }
  }, []); // Empty dependency array - runs only once
  
   const TableCellInfo = ({ label, value, colSpan, align = 'left', fontWeight }) => (
    <Tooltip title={label}>
      <TableCell colSpan={colSpan} size="small" align={align}>
        <Typography variant="body2" fontWeight={fontWeight} sx={{ fontWeight }}>
          {value}
        </Typography>
      </TableCell>
    </Tooltip>
  );

  // Filter available ledgers for dropdowns
  const availableLedgers = useMemo(() => {
    return shiftLedgers?.filter(shift => 
      !otherLedgers.some(otherLedger => otherLedger?.id === shift.id)
    ) || [];
  }, [shiftLedgers, otherLedgers]);

  // Safe product accessor
  const getProductPrice = useCallback((productId) => {
    return productPrices.find(price => price?.product_id === productId)?.price || 0;
  }, [productPrices]);

  return (
    <Grid container columnSpacing={1} rowSpacing={1}>
      {/* Total Products Amount Section */}
      <Grid size={{xs: 12, md: 12, lg: 6}}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold">
              Total Products Amount
            </Typography>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCellInfo fontWeight={'bold'} value="Product Name" />
                    <TableCellInfo fontWeight={'bold'} align={'right'} value="Quantity" />
                    <TableCellInfo fontWeight={'bold'} align={'right'} value="Price" />
                    <TableCellInfo fontWeight={'bold'} align={'right'} value="Amount" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products?.map((product) => {
                    const productDifference = productTotals[product.id] || 0;
                    const price = getProductPrice(product.id);
                    const totalPrice = productDifference * price;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCellInfo value={product.name} />
                        <TableCellInfo align="right" value={productDifference.toLocaleString()} />
                        <TableCellInfo align="right" value={price.toLocaleString()} />
                        <TableCellInfo align="right" value={totalPrice.toLocaleString()} />
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCellInfo fontWeight="bold" value="Grand Total:" />
                    <TableCellInfo fontWeight="bold" align="right" colSpan={3} value={grandProductsTotal.toLocaleString()} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Fuel Vouchers Section */}
      <Grid size={{xs: 12, md: 12, lg: 6}}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold">
              Fuel Vouchers
            </Typography>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCellInfo fontWeight={'bold'} value="Product Name" />
                    <TableCellInfo fontWeight={'bold'} align={'right'} value="Quantity" />
                    <TableCellInfo fontWeight={'bold'} align={'right'} value="Price" />
                    <TableCellInfo fontWeight={'bold'} align={'right'} value="Amount" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products?.map((product) => {
                    const price = getProductPrice(product.id);
                    const productVoucherTotal = fuelVouchers?.reduce((totalQuantity, fuelVoucher) => {
                      const productId = fuelVoucher?.product_id;
                      const quantity = fuelVoucher?.quantity || 0;
                      return productId === product.id ? totalQuantity + quantity : totalQuantity;
                    }, 0) || 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCellInfo value={product.name} />
                        <TableCellInfo
                          align="right"
                          value={productVoucherTotal.toLocaleString()}
                        />
                        <TableCellInfo align="right" value={price.toLocaleString()} />
                        <TableCellInfo align="right" value={(price * productVoucherTotal).toLocaleString()} />
                      </TableRow>
                    )
                  })}
                  <TableRow>
                    <TableCellInfo fontWeight="bold" value="Grand Total:" />
                    <TableCellInfo fontWeight="bold" align="right" colSpan={3} value={grandFuelVoucherTotal.toLocaleString()} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Final Summary Section */}
      <Grid size={{xs: 12, md: 12, lg: 6}}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold">
              Final Summary
            </Typography>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCellInfo value="Total Amount" />
                    <TableCellInfo align="right" value={grandProductsTotal.toLocaleString()} />
                  </TableRow>
                  <TableRow>
                    <TableCellInfo value="Fuel Vouchers total" />
                    <TableCellInfo align="right" value={grandFuelVoucherTotal.toLocaleString()} />
                  </TableRow>
                  <TableRow>
                    <TableCellInfo fontWeight="bold" value="Cash Remaining" />
                    <TableCellInfo fontWeight="bold" align="right" value={cashRemaining.toLocaleString()} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Cash Distribution Section - Simplified and stable */}
      <Grid size={{xs: 12, md: 12}}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold">
              Cash Distribution
            </Typography>
            <Divider />
            <Grid container columnSpacing={1} rowSpacing={1}>
              <Grid size={{xs: 12, md: 12}}>
                <Grid container columnSpacing={1} rowSpacing={1}>
                  <Grid size={{xs: 11, md: 6.4, lg: 6.4}}>
                    <Div sx={{ mt: 2 }}>
                      <Autocomplete
                        size="small"
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        options={availableLedgers}
                        getOptionLabel={(option) => option.name}
                        value={mainLedgerId ? ungroupedLedgerOptions.find(ledger => ledger.id === mainLedgerId) : null}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="Main Ledger"
                            error={!!errors.main_ledger_id}
                            helperText={errors.main_ledger_id?.message}
                          />
                        )}
                        onChange={(e, newValue) => {
                          setValue('main_ledger_id', newValue ? newValue.id : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                    </Div>
                  </Grid>
                  <Grid size={{xs: 11.5, md: 4.5}}>
                    <Div sx={{ mt: { sx: 1, md: 2 } }}>
                      <TextField
                        size="small"
                        fullWidth
                        label="Amount"
                        value={main_ledger_amount}
                        error={!!errors.main_ledger_amount}
                        helperText={errors.main_ledger_amount?.message}
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                          readOnly: true
                        }}
                      />  
                    </Div>
                  </Grid>
                  {cashReconciliationFields.map((field, index) => (
                    <Grid key={field.id} container columnSpacing={1} paddingLeft={1}>
                      <Grid size={11} marginBottom={0.5}>
                        <Divider />
                        <Grid container columnSpacing={1}>
                          <Grid size={{xs: 12, md: 7}}>
                            <Div sx={{ mt: 1 }}>
                              <Autocomplete
                                size="small"
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                options={availableLedgers.filter(ledger => 
                                  ledger.id !== mainLedgerId
                                )}
                                getOptionLabel={(option) => option.name}
                                value={otherLedgers[index]?.id ? 
                                  ungroupedLedgerOptions.find(ledger => ledger.id === otherLedgers[index]?.id) : 
                                  null
                                }
                                renderInput={(params) => (
                                  <TextField 
                                    {...params} 
                                    label="Other Ledger"
                                    error={!!errors?.other_ledgers?.[index]?.id}
                                    helperText={errors?.other_ledgers?.[index]?.id?.message}
                                  />
                                )}
                                onChange={(e, newValue) => {
                                  setValue(`other_ledgers.${index}.id`, newValue ? newValue.id : null, {
                                    shouldValidate: true,
                                    shouldDirty: true
                                  });
                                }}
                              />
                            </Div>
                          </Grid>
                          <Grid size={{xs: 12, md: 5}}>
                            <Div sx={{ mt: 1 }}>
                              <TextField
                                size="small"
                                fullWidth
                                error={!!errors?.other_ledgers?.[index]?.amount}
                                value={otherLedgers[index]?.amount || ''}
                                helperText={errors?.other_ledgers?.[index]?.amount?.message}
                                label="Amount"
                                InputProps={{
                                  inputComponent: CommaSeparatedField,
                                }}
                                onChange={(e) => {
                                  const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
                                  setValue(`other_ledgers.${index}.amount`, value, {
                                    shouldValidate: true,
                                    shouldDirty: true
                                  });
                                }}
                              />
                            </Div>
                          </Grid>
                        </Grid>
                      </Grid>
                      <Grid size={1}>
                        <Div sx={{ mt: 1 }}>
                          <Tooltip title="Remove Other Ledger">
                            <IconButton size="small" onClick={() => cashReconciliationRemove(index)}>
                              <DisabledByDefault fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </Div>
                      </Grid>
                    </Grid>
                  ))}
                  <Grid size={12} sx={{ display: 'flex', direction: 'row', justifyContent: 'flex-end' }}>
                    <Div sx={{ mt: 1 }}>
                      <Tooltip title="Add Other Ledger">
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => cashReconciliationAppend({ id: '', amount: '' })}
                          disabled={availableLedgers.length === 0}
                        >
                          <AddOutlined sx={{ fontSize: 10 }} /> Add
                        </Button>
                      </Tooltip>
                    </Div>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default CashReconciliation;