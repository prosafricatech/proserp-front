"use client";
import React, { useMemo, useCallback, useState, useEffect, useContext } from 'react';
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
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useFormContext, useWatch } from 'react-hook-form';
import { StationFormContext } from '../../SalesShifts';

function CashReconciliation({
  cashierIndex,
  localFuelVouchers = [],
  localAdjustments = [],
  localPumpReadings = [],
  getCashierLedgers,
}) {
  const {
    setValue,
    errors,
    watch,
    trigger
  } = useFormContext();
  const {activeStation} = useContext(StationFormContext);
  const {fuel_pumps, products, collection_ledgers} = activeStation;

  const productPrices = useWatch({
    name: 'product_prices',
  }) || [];

  const cashTransactions = useWatch({
    name: `cashiers.${cashierIndex}.other_transactions`,
  }) || [];

  const mainLedgerId = useWatch({
    name: `cashiers.${cashierIndex}.main_ledger_id`,
  });

  const collectedAmount = useWatch({
    name: `cashiers.${cashierIndex}.collected_amount`,
  }) || 0;

  const cashierLedgers = getCashierLedgers ? getCashierLedgers(cashierIndex) : [];
  const actualMainLedgerAmount = watch(`cashiers.${cashierIndex}.main_ledger_amount`) || 0;

  const [initialized, setInitialized] = useState(false);
  const [hasLoadedSavedTransactions, setHasLoadedSavedTransactions] = useState(false);

  const cashierData = useWatch({
    name: `cashiers.${cashierIndex}`,
  }) || {};

  const cashierMainLedger = cashierData?.main_ledger;

  useEffect(() => {
    if (cashierData?.other_transactions?.length > 0 && !hasLoadedSavedTransactions && !initialized) {
      const otherTransactions = cashierData.other_transactions.filter(transaction => {
        const transactionLedgerId = transaction.ledger_id || transaction.debit_ledger?.id || transaction.id;
        return transactionLedgerId !== mainLedgerId;
      });
      
      if (otherTransactions.length > 0) {
        const formattedTransactions = otherTransactions.map(transaction => ({
          ledger_id: transaction.ledger_id || transaction.debit_ledger?.id || transaction.id,
          amount: transaction.amount || 0,
          narration: transaction.narration || '',
        }));
        
        setValue(`cashiers.${cashierIndex}.other_transactions`, formattedTransactions, {
          shouldValidate: true,
          shouldDirty: true,
        });
        
        setHasLoadedSavedTransactions(true);
        setInitialized(true);
      }
    }
  }, [cashierData, cashierIndex, mainLedgerId, setValue, hasLoadedSavedTransactions, initialized]);

  useEffect(() => {
    if (!initialized) {
      const existingOtherTransactions = watch(`cashiers.${cashierIndex}.other_transactions`) || [];
      const currentMainLedger = cashierData?.main_ledger;
      if (mainLedgerId) {
        const ledgerObj = cashierLedgers.find(l => l.id === mainLedgerId);
        if (
          ledgerObj && (
            !currentMainLedger ||
            currentMainLedger.id !== ledgerObj.id ||
            currentMainLedger.amount !== actualMainLedgerAmount
          )
        ) {
          setValue(`cashiers.${cashierIndex}.main_ledger`, {
            id: ledgerObj.id,
            name: ledgerObj.name,
            amount: actualMainLedgerAmount,
          }, { shouldValidate: true, shouldDirty: true });
        }
      } else if (cashierMainLedger?.id && !mainLedgerId) {
        setValue(`cashiers.${cashierIndex}.main_ledger_id`, cashierMainLedger.id, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (existingOtherTransactions.length > 0) {
        setInitialized(true);
      }
    }
  }, [cashierIndex, watch, initialized, cashierMainLedger, mainLedgerId, setValue, cashierLedgers, actualMainLedgerAmount, cashierData]);

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

  const productTotals = useMemo(() => {
    const totals = {};

    fuel_pumps?.forEach((pump) => {
      const productId = pump?.product_id;
      if (!productId) return;
      const reading = localPumpReadings.find(r => r?.fuel_pump_id === pump.id);
      const sold = ((reading?.closing || 0) - (reading?.opening || 0)) || 0;
      totals[productId] = (totals[productId] || 0) + sold;
    });

    localAdjustments?.forEach((adj) => {
      const productId = adj?.product_id;
      if (!productId) return;
      const qty = adj?.quantity || 0;
      if (adj.operator === '-') {
        totals[productId] = (totals[productId] || 0) + qty;
      } else if (adj.operator === '+') {
        totals[productId] = (totals[productId] || 0) - qty;
      }
    });

    return totals;
  }, [fuel_pumps, localPumpReadings, localAdjustments]);

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

  // No longer filter out transactions matching main ledger; show all as 'other transactions'
  const filteredCashTransactions = useMemo(() => cashTransactions, [cashTransactions]);

  const filteredTransactionsSum = useMemo(() => {
    return filteredCashTransactions.reduce((sum, transaction) => 
      sum + sanitizedNumber(transaction?.amount || 0), 0) || 0;
  }, [filteredCashTransactions]);

  const calculatedMainLedgerAmount = cashRemaining - filteredTransactionsSum;

  useEffect(() => {
    if (mainLedgerId && calculatedMainLedgerAmount !== null && calculatedMainLedgerAmount !== undefined) {
      setValue(`cashiers.${cashierIndex}.main_ledger_amount`, calculatedMainLedgerAmount, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [calculatedMainLedgerAmount, mainLedgerId, cashierIndex, setValue]);

  // Calculate profit/loss for this cashier
  const profitLoss = useMemo(() => {
    const actualCollected = sanitizedNumber(collectedAmount) || 0;
    return actualCollected - calculatedMainLedgerAmount;
  }, [collectedAmount, calculatedMainLedgerAmount]);

  // Over/Short display logic for UI
  const isZeroCollected = sanitizedNumber(collectedAmount) === 0;
  const expectedCash = calculatedMainLedgerAmount;
  const isShort = (isZeroCollected && expectedCash < 0) || isZeroCollected || profitLoss < 0;
  const profitLossLabel = isShort ? 'Short' : 'Over';
  const profitLossIcon = isShort ? <TrendingDown color="error" fontSize="small" /> : <TrendingUp color="success" fontSize="small" />;
  const profitLossColor = isShort ? 'error.main' : 'success.main';

  const getProductPrice = useCallback(
    (productId) => productPrices.find(p => p?.product_id === productId)?.price || 0,
    [productPrices]
  );

  const availableLedgers = useMemo(() => {
    return (cashierLedgers || []).filter(ledger => ledger.id !== mainLedgerId);
  }, [cashierLedgers, mainLedgerId]);

  const addCashTransaction = () => {
    const newTransactions = Array.isArray(cashTransactions)
      ? [...cashTransactions, { ledger_id: '', amount: '', narration: '' }]
      : [{ ledger_id: '', amount: '', narration: '' }];
    setValue(`cashiers.${cashierIndex}.other_transactions`, newTransactions, {
      shouldValidate: true,
      shouldDirty: true,
    });
    trigger(`cashiers.${cashierIndex}.other_transactions`);
  };

  const removeCashTransaction = (idx) => {
    const newTransactions = Array.isArray(cashTransactions)
      ? cashTransactions.filter((_, i) => i !== idx)
      : [];
    setValue(`cashiers.${cashierIndex}.other_transactions`, newTransactions, {
      shouldValidate: true,
      shouldDirty: true,
    });
    trigger(`cashiers.${cashierIndex}.other_transactions`);
  };

  const updateCashTransaction = (idx, field, value) => {
    const newTransactions = [...cashTransactions];
    newTransactions[idx] = {
      ...newTransactions[idx],
      [field]: field === 'amount' ? sanitizedNumber(value) : value,
    };
    setValue(`cashiers.${cashierIndex}.other_transactions`, newTransactions, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCollectedAmountChange = (value) => {
    const sanitizedValue = sanitizedNumber(value);
    setValue(`cashiers.${cashierIndex}.collected_amount`, sanitizedValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
    
    trigger(`cashiers.${cashierIndex}.collected_amount`);
  };

  // Always call useWatch for collection_ledger_id at the top level
  const collectedLedgerId = useWatch({ name: `cashiers.${cashierIndex}.collection_ledger_id` });

  return (
    <>
      <Grid container columnSpacing={2} rowSpacing={2}>
        {/* Product Summary Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Products Summary
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty (L)</TableCell>
                      <TableCell align="right">Amount</TableCell>
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
                          <TableCell align="right">{amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                        Total Sales:
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

        {/* Fuel Vouchers Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Fuel Vouchers
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty (L)</TableCell>
                      <TableCell align="right">Amount</TableCell>
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
                          <TableCell align="right">{amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                        Total Vouchers:
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

        {/* Cash Distribution Section */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Cash Distribution
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    size="small"
                    options={cashierLedgers || []}
                    getOptionLabel={(opt) => opt.name}
                    value={mainLedgerId ? cashierLedgers.find(l => l.id === mainLedgerId) || null : null}
                    onChange={(_, newValue) => {
                      const id = newValue?.id ?? null;
                      setValue(`cashiers.${cashierIndex}.main_ledger_id`, id, { shouldValidate: true });
                      if (newValue) {
                        setValue(`cashiers.${cashierIndex}.main_ledger`, {
                          id: newValue.id,
                          name: newValue.name,
                          amount: actualMainLedgerAmount,
                        }, { shouldValidate: true, shouldDirty: true });
                      } else {
                        setValue(`cashiers.${cashierIndex}.main_ledger`, null, { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Main Ledger"
                        error={!!errors?.cashiers?.[cashierIndex]?.main_ledger_id}
                        helperText={errors?.cashiers?.[cashierIndex]?.main_ledger_id?.message}
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
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

                {filteredCashTransactions.map((transaction, idx) => {
                  const ledgerId = transaction.ledger_id;
                  const ledgerObj = availableLedgers.find(l => l.id === ledgerId);
                  const stableKey = `other-transaction-${cashierIndex}-${idx}-${ledgerId || 'new'}`;

                  // Find the index in the original cashTransactions array
                  const originalIdx = cashTransactions.findIndex(
                    t => t === transaction
                  );

                  return (
                    <React.Fragment key={stableKey}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Autocomplete
                          size="small"
                          options={availableLedgers}
                          getOptionLabel={(opt) => opt.name}
                          value={ledgerObj || null}
                          onChange={(_, newValue) => {
                            updateCashTransaction(originalIdx, 'ledger_id', newValue?.id ?? null);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Other Ledger"
                              error={!!errors?.cashiers?.[cashierIndex]?.other_transactions?.[originalIdx]?.ledger_id}
                              helperText={errors?.cashiers?.[cashierIndex]?.other_transactions?.[originalIdx]?.ledger_id?.message}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Narration"
                          value={transaction?.narration ?? ''}
                          placeholder="Enter transaction description"
                          error={!!errors?.cashiers?.[cashierIndex]?.other_transactions?.[originalIdx]?.narration}
                          helperText={errors?.cashiers?.[cashierIndex]?.other_transactions?.[originalIdx]?.narration?.message}
                          onChange={(e) => {
                            updateCashTransaction(originalIdx, 'narration', e.target.value);
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 11, md: 2 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Amount"
                          value={transaction?.amount ?? ''}
                          error={!!errors?.cashiers?.[cashierIndex]?.other_transactions?.[originalIdx]?.amount}
                          helperText={errors?.cashiers?.[cashierIndex]?.other_transactions?.[originalIdx]?.amount?.message}
                          InputProps={{ inputComponent: CommaSeparatedField }}
                          onChange={(e) => {
                            updateCashTransaction(originalIdx, 'amount', e.target.value);
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 1 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tooltip title="Remove this transaction">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              removeCashTransaction(originalIdx);
                            }}
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
                    Add Other Transaction
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash Collected Input after Cash Distribution Section */}
        <Grid size={12}>
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Collected Amount
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      options={collection_ledgers || []}
                      getOptionLabel={(opt) => opt?.name || ''}
                      size='small'
                      value={
                        ((collection_ledgers || []).find(
                          l => l.id === collectedLedgerId
                        )) || null
                      }
                      onChange={(_, newValue) => {
                        setValue(`cashiers.${cashierIndex}.collection_ledger_id`, newValue?.id ?? null, { shouldValidate: true, shouldDirty: true });
                        trigger(`cashiers.${cashierIndex}.collection_ledger_id`);
                      }}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id || option.code || option.name}>
                          {option.name}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Collection Ledger"
                          error={!!errors?.cashiers?.[cashierIndex]?.collection_ledger_id}
                          helperText={errors?.cashiers?.[cashierIndex]?.collection_ledger_id?.message}
                        />
                      )}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      size="small"
                      fullWidth
                      value={collectedAmount || 0}
                      onChange={(e) => handleCollectedAmountChange(e.target.value)}
                      error={!!errors?.cashiers?.[cashierIndex]?.collected_amount}
                      InputProps={{
                        inputComponent: CommaSeparatedField,
                      }}
                      label="Collected Amount"
                      sx={{
                        '& .MuiInputBase-input': {
                          textAlign: 'right',
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash Summary Card (without Collected Amount) */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Cash Summary
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Sales Amount</TableCell>
                      <TableCell align="right">{grandProductsTotal.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fuel Vouchers</TableCell>
                      <TableCell align="right">{grandFuelVoucherTotal.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow sx={{ borderTop: '2px solid', borderColor: 'divider' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Expected Cash</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {actualMainLedgerAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {/* Over/Short Display */}
                    <TableRow sx={{ bgcolor: isShort ? 'error.50' : 'success.50' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {profitLossIcon}
                          <Typography color={profitLossColor}>{profitLossLabel}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: profitLossColor }}>
                        {Math.abs(profitLoss).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default CashReconciliation;