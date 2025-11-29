import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Button, Card, CardContent, Divider, Grid, IconButton, TextField, Tooltip, Typography, Autocomplete } from '@mui/material';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

function CashReconciliation() {
  const [fuelVoucherTotals, setFuelVoucherTotals] = useState({});
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { adjustments, setCheckShiftBalanced, products, fuel_pumps, fuelVouchers, shiftLedgers, setValue, errors, watch, cashReconciliationFields, cashReconciliationAppend, cashReconciliationRemove } = useFormContext();

  // Calculate fuel voucher totals
  useEffect(() => {
    const fuelVouchertotal = {};
    fuelVouchers.forEach((fuelVoucher) => {
      const productId = fuelVoucher?.product_id;
      const quantity = fuelVoucher?.quantity;
      const productPrice = watch('product_prices').find(price => price?.product_id === fuelVoucher?.product_id)?.price || 0;
      fuelVouchertotal[productId] = (fuelVouchertotal[productId] || 0) + (quantity * productPrice);
    });
    setFuelVoucherTotals(fuelVouchertotal);
  }, [fuelVouchers]); // Removed 'watch' dependency

  // Calculate product totals
  const productTotals = {};
  fuel_pumps.forEach((pump) => {
    const productId = pump?.product_id;
    const pump_reading = watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id);
    const difference = (pump_reading?.closing - pump_reading?.opening) || 0;
    productTotals[productId] = (productTotals[productId] || 0) + difference;
  });

  // Apply adjustments
  adjustments.forEach((adjustment) => {
    const productId = adjustment?.product_id;
    const quantity = adjustment?.quantity;
    if (adjustment.operator === '-') {
      productTotals[productId] = (productTotals[productId] || 0) + quantity;
    } else if (adjustment.operator === '+') {
      productTotals[productId] = (productTotals[productId] || 0) - quantity;
    }
  });

  // Calculate grand totals
  const grandFuelVoucherTotal = Object.values(fuelVoucherTotals).reduce((acc, curr) => acc + curr, 0);
  const grandProductsTotal = products.reduce((acc, product) => {
    const totalPrice = (productTotals[product.id] || 0) * (watch('product_prices').find(price => price?.product_id === product.id)?.price || 0);
    return acc + totalPrice;
  }, 0);
  const cashRemaining = grandProductsTotal - grandFuelVoucherTotal;

  const totalOtherLedgersAmount = watch('other_ledgers')?.reduce((total, field) => {
    const amount = parseFloat(field.amount || 0);
    return total + amount;
  }, 0);

  const TableCellInfo = ({ label, value, colSpan, align = 'left', fontWeight }) => (
    <Tooltip title={label}>
      <TableCell colSpan={colSpan} size="small" align={align}>
        <Typography variant="body2" fontWeight={fontWeight} sx={{ fontWeight }}>
          {value}
        </Typography>
      </TableCell>
    </Tooltip>
  );

  const mainLedgerId = watch('main_ledger_id');
  const otherLedgers = watch('other_ledgers');
  const main_ledger_amount = cashRemaining - totalOtherLedgersAmount;
  
  // SINGLE useEffect for all form updates - FIXED VERSION
  useEffect(() => {
    // Only run if we have valid values
    if (cashRemaining === undefined || totalOtherLedgersAmount === undefined) return;

    const calculatedMainLedgerAmount = sanitizedNumber(cashRemaining - totalOtherLedgersAmount);
    
    // Update main_ledger with validation disabled for automatic calculations
    const currentMainLedgerAmount = watch('main_ledger')?.amount || 0;
    if (currentMainLedgerAmount !== calculatedMainLedgerAmount) {
      setValue('main_ledger', {
        id: mainLedgerId,
        amount: calculatedMainLedgerAmount,
      }, { shouldValidate: false, shouldDirty: true }); // Disabled validation
    }

    // Update main_ledger_amount field without validation
    setValue('main_ledger_amount', calculatedMainLedgerAmount, {
      shouldValidate: false, // Disabled validation for automatic calculations
      shouldDirty: true
    });

    // Update other_ledgers amounts without validation
    otherLedgers.forEach((field, index) => {
      if (field.amount !== undefined && field.amount !== null) {
        setValue(`other_ledgers.${index}.amount`, sanitizedNumber(field.amount), {
          shouldValidate: false, // Disabled validation
          shouldDirty: true
        });
      }
    });

    // Check if shift is balanced
    const isBalanced = Math.abs(cashRemaining - (calculatedMainLedgerAmount + totalOtherLedgersAmount)) < 0.01;
    setCheckShiftBalanced(isBalanced);

  }, [cashRemaining, totalOtherLedgersAmount, mainLedgerId, otherLedgers]); 

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
                  {products.map((product) => {
                    let productDifference = 0;
                    fuel_pumps.forEach((pump) => {
                      if (pump?.product_id === product.id) {
                        const pump_reading = watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id)
                        productDifference += (pump_reading?.closing || 0) - (pump_reading?.opening || 0);
                      }
                    });
                    adjustments.forEach((adjustment) => {
                      if (adjustment?.product_id === product.id) {
                        if (adjustment.operator === '-') {
                          productDifference += adjustment.quantity;
                        } else if (adjustment.operator === '+') {
                          productDifference -= adjustment.quantity;
                        }
                      }
                    });
                    const price = watch('product_prices').find(price => price?.product_id === product.id)?.price || 0;
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
                  {products.map((product) => {
                    const price = watch('product_prices').slice().reverse().find(price => price?.product_id === product.id)?.price || 0;
                    const productVoucherTotal = fuelVouchers.reduce((totalQuantity, fuelVoucher) => {
                      const productId = fuelVoucher?.product_id;
                      const quantity = fuelVoucher.quantity || 0;
                      return productId === product.id ? totalQuantity + quantity : totalQuantity;
                    }, 0);

                    return (
                      <TableRow key={product.id}>
                        <TableCellInfo value={product.name} />
                        <TableCellInfo
                          align="right"
                          value={productVoucherTotal.toLocaleString()}
                        />
                        <TableCellInfo align="right" value={price.toLocaleString()} />
                        <TableCellInfo align="right" value={(price*productVoucherTotal).toLocaleString()} />
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

      {/* Cash Distribution Section */}
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
                  <Grid size={{xs: 11, md: 6.4, lg:6.4}}>
                    <Div sx={{ mt: 2 }}>
                      <Autocomplete
                        size="small"
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        options={shiftLedgers.filter(shift => 
                          !watch('other_ledgers').some(otherLedger => otherLedger.id === shift.id)
                        )}
                        getOptionLabel={(option) => option.name}
                        value={!!watch('main_ledger_id') ? ungroupedLedgerOptions.find(ledger => ledger.id === watch('main_ledger_id')) : null}
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
                          setValue('main_ledger', {
                              id: newValue ? newValue.id : null,
                              amount: sanitizedNumber(main_ledger_amount),
                            },{
                              shouldValidate: false, // Disabled validation for automatic calculation
                              shouldDirty: true,
                            }
                          );
                        }}
                      />
                    </Div>
                  </Grid>
                 <Grid size={{xs: 11, md: 4.5}}>
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
                    <Grid key={index} container columnSpacing={1} paddingLeft={1}>
                      <Grid size={11} marginBottom={0.5}>
                        <Divider />
                        <Grid container columnSpacing={1}>
                          <Grid size={{xs: 12, md: 7}}>
                            <Div sx={{ mt: 1 }}>
                              <Autocomplete
                                size="small"
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                options={shiftLedgers
                                  .filter(shift => shift.id !== watch('main_ledger_id'))
                                  .filter((shift, idx) => {
                                    const isSelectedIndex = idx === index;
                                    const isLedgerSelected = !!watch(`other_ledgers.${idx}`) && watch(`other_ledgers.${idx}`).id === shift.id;
                                    return isSelectedIndex || !isLedgerSelected;
                                  })}
                                getOptionLabel={(option) => option.name}
                                value={!!watch(`other_ledgers.${index}.id`) ? ungroupedLedgerOptions.find(ledger => ledger.id === watch(`other_ledgers.${index}.id`)) : null}
                                renderInput={(params) => (
                                  <TextField 
                                    {...params} 
                                    label="Other Ledger"
                                    error={!!errors?.other_ledgers?.[index]?.id}
                                    helperText={errors?.other_ledgers?.[index]?.id.message}
                                  />
                                )}
                                onChange={(e, newValue) => {
                                  setValue(`other_ledgers.${index}.id`, newValue ? newValue.id : null, {
                                    shouldValidate: true,
                                    shouldDirty: true
                                  })
                                }}
                              />
                            </Div>
                          </Grid>
                          <Grid size={{xs: 12, md: 5}}>
                            <Div sx={{ mt: 1 }}>
                              <TextField
                                id={`other_ledgers-${index}-amount`}
                                size="small"
                                fullWidth
                                error={errors.other_ledgers && !!errors?.other_ledgers[index]?.amount}
                                defaultValue={watch(`other_ledgers.${index}.amount`)}
                                helperText={errors.other_ledgers && errors.other_ledgers[index]?.amount?.message}
                                label="Amount"
                                InputProps={{
                                  inputComponent: CommaSeparatedField,
                                }}
                                onChange={(e) => {
                                  setValue(`other_ledgers.${index}.amount`, e.target.value ? sanitizedNumber(e.target.value) : 0, {
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
                        <Button size="small" variant="outlined" onClick={() => cashReconciliationAppend({ id: '', amount: '' })}>
                          <AddOutlined fontSize="10" /> Add
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