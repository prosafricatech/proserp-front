"use client";
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Autocomplete,
  Box,
} from '@mui/material';
import { 
  AddOutlined, 
  DisabledByDefault,
} from '@mui/icons-material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useFormContext, useWatch } from 'react-hook-form';

function CashReconciliation({
  cashierIndex,
  localFuelVouchers = [],
  localAdjustments = [],
  localPumpReadings = [],
}) {
  const {
    setValue,
    setCheckShiftBalanced,
    products,
    fuel_pumps,
    errors,
    watch,
    getCashierLedgers, // Get ledgers specific to this cashier
  } = useFormContext();

  const productPrices = useWatch({
    name: 'product_prices',
  }) || [];

  // CASH TRANSACTIONS for this cashier
  const cashTransactions = useWatch({
    name: `cashiers.${cashierIndex}.cash_transactions`,
  }) || [];

  // MAIN LEDGER PER CASHIER
  const mainLedgerId = useWatch({
    name: `cashiers.${cashierIndex}.main_ledger_id`,
  });

  // Get cashier-specific ledgers
  const cashierLedgers = getCashierLedgers ? getCashierLedgers(cashierIndex) : [];

  // State for loading existing cash_transactions data
  const [initialized, setInitialized] = useState(false);

  // Load existing cash_transactions data on component mount
  useEffect(() => {
    if (!initialized) {
      const existingCashTransactions = watch(`cashiers.${cashierIndex}.cash_transactions`) || [];
      if (existingCashTransactions.length > 0) {
        setInitialized(true);
      }
    }
  }, [cashierIndex, watch, initialized]);

  // ──────────────────────────────────────────────────────────────
  // Fuel Voucher Totals per product FOR THIS CASHIER
  // ──────────────────────────────────────────────────────────────
  const fuelVoucherTotals = useMemo(() => {
    if (!localFuelVouchers?.length || !productPrices?.length) return {};

    const totals = {};
    localFuelVouchers.forEach((voucher) => {
      const productId = voucher?.product_id;
      if (!productId) return;
      const qty = voucher?.quantity || 0;
      const price = productPrices.find(p => p?.product_id === productId)?.price || 0;
      totals[productId] = (totals[productId] || 0) + qty * price;
    });
    return totals;
  }, [localFuelVouchers, productPrices]);

  // ──────────────────────────────────────────────────────────────
  // Product sales totals (pump readings + adjustments) FOR THIS CASHIER
  // ──────────────────────────────────────────────────────────────
  const productTotals = useMemo(() => {
    const totals = {};

    // Pump sales for THIS cashier
    fuel_pumps?.forEach((pump) => {
      const productId = pump?.product_id;
      if (!productId) return;
      const reading = localPumpReadings.find(r => r?.fuel_pump_id === pump.id);
      const sold = ((reading?.closing || 0) - (reading?.opening || 0)) || 0;
      totals[productId] = (totals[productId] || 0) + sold;
    });

    // Adjustments for THIS cashier
    localAdjustments?.forEach((adj) => {
      const productId = adj?.product_id;
      if (!productId) return;
      const qty = adj?.quantity || 0;
      if (adj.operator === '-') {
        totals[productId] = (totals[productId] || 0) + qty;     // add to sold (reduce cash)
      } else if (adj.operator === '+') {
        totals[productId] = (totals[productId] || 0) - qty;     // subtract from sold (increase cash)
      }
    });

    return totals;
  }, [fuel_pumps, localPumpReadings, localAdjustments]);

  // ──────────────────────────────────────────────────────────────
  // Grand totals & derived values FOR THIS CASHIER
  // ──────────────────────────────────────────────────────────────
  const { grandFuelVoucherTotal, grandProductsTotal, cashRemaining } = useMemo(() => {
    const voucherTotal = Object.values(fuelVoucherTotals).reduce((sum, v) => sum + (v || 0), 0);

    const productsTotal = products?.reduce((sum, product) => {
      const qty = productTotals[product.id] || 0;
      const price = productPrices.find(p => p?.product_id === product.id)?.price || 0;
      return sum + qty * price;
    }, 0) || 0;

    return {
      grandFuelVoucherTotal: voucherTotal,
      grandProductsTotal: productsTotal,
      cashRemaining: productsTotal - voucherTotal,
    };
  }, [fuelVoucherTotals, productTotals, products, productPrices]);

  // Total of Cash Transactions
  const totalCashTransactionsAmount = useMemo(() => {
    return cashTransactions?.reduce((sum, transaction) => 
      sum + sanitizedNumber(transaction?.amount || 0), 0) || 0;
  }, [cashTransactions]);

  // AUTOMATICALLY CALCULATED Main Ledger Amount
  const calculatedMainLedgerAmount = cashRemaining - totalCashTransactionsAmount;

  // Automatically set the main ledger amount when it changes
  useEffect(() => {
    if (mainLedgerId && calculatedMainLedgerAmount !== null && calculatedMainLedgerAmount !== undefined) {
      setValue(`cashiers.${cashierIndex}.main_ledger_amount`, calculatedMainLedgerAmount, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [calculatedMainLedgerAmount, mainLedgerId, cashierIndex, setValue]);

  // Update balance status - cashier is balanced when main ledger amount matches calculated
  const isCashierBalanced = useMemo(() => {
    if (!mainLedgerId) return false;
    
    // Get the actual value from form (which should be the calculated one)
    const actualAmount = watch(`cashiers.${cashierIndex}.main_ledger_amount`) || 0;
    
    // Compare with calculated amount (allow small rounding differences)
    return Math.abs(actualAmount - calculatedMainLedgerAmount) < 0.01;
  }, [mainLedgerId, cashierIndex, watch, calculatedMainLedgerAmount]);

  // Update balance status only when meaningful values change
  useEffect(() => {
    setCheckShiftBalanced(prev => {
      return isCashierBalanced && cashRemaining >= 0;
    });
  }, [isCashierBalanced, cashRemaining, setCheckShiftBalanced]);

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────
  const getProductPrice = useCallback(
    (productId) => productPrices.find(p => p?.product_id === productId)?.price || 0,
    [productPrices]
  );

  // All cashier ledgers are available for cash transactions
  const availableLedgers = cashierLedgers || [];

  const addCashTransaction = () => {
    const newTransactions = [...cashTransactions, { 
      id: '', 
      description: '',
      amount: ''
    }];
    setValue(`cashiers.${cashierIndex}.cash_transactions`, newTransactions, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const removeCashTransaction = (idx) => {
    const newTransactions = cashTransactions.filter((_, i) => i !== idx);
    setValue(`cashiers.${cashierIndex}.cash_transactions`, newTransactions, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const updateCashTransaction = (idx, field, value) => {
    const newTransactions = [...cashTransactions];
    newTransactions[idx] = {
      ...newTransactions[idx],
      [field]: field === 'amount' ? sanitizedNumber(value) : value,
    };
    setValue(`cashiers.${cashierIndex}.cash_transactions`, newTransactions, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Get the actual main ledger amount from form
  const actualMainLedgerAmount = watch(`cashiers.${cashierIndex}.main_ledger_amount`) || 0;

  return (
    <>
      <Grid container columnSpacing={2} rowSpacing={2}>
        {/* Total Products Amount FOR THIS CASHIER */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Total Products Amount (Cashier)
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Quantity (L)</TableCell>
                      <TableCell align="right">Price (TZS)</TableCell>
                      <TableCell align="right">Amount (TZS)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products?.map((product) => {
                      const qty = productTotals[product.id] || 0;
                      const price = getProductPrice(product.id);
                      const amount = qty * price;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{qty.toLocaleString()}</TableCell>
                          <TableCell align="right">{price.toLocaleString()}</TableCell>
                          <TableCell align="right">{amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Cashier Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {grandProductsTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Fuel Vouchers FOR THIS CASHIER */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Fuel Vouchers (Cashier)
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Quantity (L)</TableCell>
                      <TableCell align="right">Price (TZS)</TableCell>
                      <TableCell align="right">Amount (TZS)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products?.map((product) => {
                      const qty = localFuelVouchers.reduce(
                        (sum, v) => (v?.product_id === product.id ? sum + (v.quantity || 0) : sum),
                        0
                      );
                      const price = getProductPrice(product.id);
                      const amount = qty * price;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{qty.toLocaleString()}</TableCell>
                          <TableCell align="right">{price.toLocaleString()}</TableCell>
                          <TableCell align="right">{amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Cashier Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {grandFuelVoucherTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Final Summary FOR THIS CASHIER */}
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Cashier Summary
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Sales Amount</TableCell>
                      <TableCell align="right">{grandProductsTotal.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fuel Vouchers Total</TableCell>
                      <TableCell align="right">{grandFuelVoucherTotal.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cash Remaining</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: cashRemaining < 0 ? 'error.main' : 'success.main' }}>
                        {cashRemaining.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cash Transactions Total</TableCell>
                      <TableCell align="right">{totalCashTransactionsAmount.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', borderTop: '1px solid #ddd' }}>
                        Main Ledger Amount (AUTOMATIC)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', borderTop: '1px solid #ddd', color: calculatedMainLedgerAmount < 0 ? 'error.main' : 'primary.main' }}>
                        {calculatedMainLedgerAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash Distribution FOR THIS CASHIER */}
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Cash Distribution (Cashier)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    size="small"
                    options={availableLedgers}
                    getOptionLabel={(opt) => opt.name}
                    value={mainLedgerId ? availableLedgers.find(l => l.id === mainLedgerId) : null}
                    onChange={(_, newValue) => {
                      const id = newValue?.id ?? null;
                      setValue(`cashiers.${cashierIndex}.main_ledger_id`, id, { shouldValidate: true });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Main Ledger (Cashier)"
                        error={!!errors?.cashiers?.[cashierIndex]?.main_ledger_id}
                        helperText={errors?.cashiers?.[cashierIndex]?.main_ledger_id?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Main Ledger Amount"
                    value={actualMainLedgerAmount.toLocaleString()}
                    InputProps={{
                      readOnly: true,
                      inputComponent: CommaSeparatedField,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontWeight: 'bold',
                        color: calculatedMainLedgerAmount < 0 ? 'error.main' : 'success.main',
                      },
                    }}
                  />
                </Grid>

                {/* Cash Transactions (using cashier-specific ledgers) */}
                {cashTransactions.map((transaction, idx) => {
                  const ledgerObj = availableLedgers.find(l => l.id === transaction.id);
                  
                  return (
                    <React.Fragment key={idx}>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Autocomplete
                          size="small"
                          options={availableLedgers}
                          getOptionLabel={(opt) => opt.name}
                          value={ledgerObj}
                          onChange={(_, newValue) => {
                            updateCashTransaction(idx, 'id', newValue?.id ?? null);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Ledger"
                              error={!!errors?.cashiers?.[cashierIndex]?.cash_transactions?.[idx]?.id}
                              helperText={errors?.cashiers?.[cashierIndex]?.cash_transactions?.[idx]?.id?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 10, md: 2 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Amount"
                          value={transaction?.amount ?? ''}
                          error={!!errors?.cashiers?.[cashierIndex]?.cash_transactions?.[idx]?.amount}
                          helperText={errors?.cashiers?.[cashierIndex]?.cash_transactions?.[idx]?.amount?.message}
                          InputProps={{ inputComponent: CommaSeparatedField }}
                          onChange={(e) => updateCashTransaction(idx, 'amount', e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 2, md: 0 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tooltip title="Remove this transaction">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeCashTransaction(idx)}
                          >
                            <DisabledByDefault fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </React.Fragment>
                  );
                })}

                <Grid size={12} sx={{ textAlign: 'right', mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddOutlined />}
                    onClick={addCashTransaction}
                    disabled={availableLedgers.length === 0}
                  >
                    Add Cash Transaction
                  </Button>
                </Grid>
              </Grid>

              {/* Cash Transactions Summary Table */}
              {cashTransactions.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cash Transactions Summary
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ledger</TableCell>
                          <TableCell align="right">Amount (TZS)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cashTransactions.map((transaction, idx) => {
                          const ledgerObj = availableLedgers.find(l => l.id === transaction.id);
                          return (
                            <TableRow key={idx}>
                              <TableCell>{ledgerObj?.name || '-'}</TableCell>
                              <TableCell align="right">{sanitizedNumber(transaction.amount || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            Total Cash Transactions:
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {totalCashTransactionsAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default CashReconciliation;