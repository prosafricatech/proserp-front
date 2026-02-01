"use client";

import React, { useContext, useMemo } from 'react';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  Box,
  Chip,
  Paper,
  Alert,
} from '@mui/material';
import { TrendingUp, TrendingDown, LocalGasStation, ReceiptOutlined, AttachMoney, AccountBalance, Payment } from '@mui/icons-material';
import { useWatch } from 'react-hook-form';
import { StationFormContext } from '../SalesShifts';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

function ShiftSummary({ paymentItems = [] }) {
  const {activeStation} = useContext(StationFormContext);
  const {fuel_pumps, products} = activeStation;
  const {ungroupedLedgerOptions} = useLedgerSelect();
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies?.find(c => c.is_base === 1);
  const currencyCode = baseCurrency?.code;
  
  const formatMoney = (amount) => {
    if (currencyCode) {
      try {
        return amount.toLocaleString('en-US', { style: 'currency', currency: currencyCode });
      } catch {
        // fallback to plain number if currencyCode is invalid
        return amount.toLocaleString();
      }
    }
    return amount.toLocaleString();
  };

  const allCashiers = useWatch({
    name: 'cashiers',
  }) || [];

  const productPrices = useWatch({
    name: 'product_prices',
  }) || [];

  const sanitizedNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const getProductPrice = (productId) => {
    return productPrices.find(p => p?.product_id === productId)?.price || 0;
  };

  const calculateCashierMainLedgerAmount = (cashier) => {
    if (cashier.main_ledger_amount !== undefined && cashier.main_ledger_amount !== null) {
      return cashier.main_ledger_amount;
    }
    
    const pumpReadings = cashier.pump_readings || [];
    const fuelVouchers = cashier.fuel_vouchers || [];
    const adjustments = cashier.adjustments || [];
    const cashTransactions = cashier.other_transactions || [];
    const selectedPumps = cashier.selected_pumps || [];
    const mainLedgerId = cashier.main_ledger?.id || cashier.main_ledger_id;
    
    let productsTotal = 0;
    
    selectedPumps.forEach(pumpId => {
      const pump = fuel_pumps?.find(p => p.id === pumpId);
      if (!pump) return;

      const productId = pump.product_id;
      const reading = pumpReadings.find(r => r?.fuel_pump_id === pumpId);

      if (reading) {
        const sold = (sanitizedNumber(reading.closing) - sanitizedNumber(reading.opening)) || 0;
        const price = getProductPrice(productId);
        productsTotal += sold * price;
      }
    });
    
    adjustments.forEach(adj => {
      const productId = adj.product_id;
      const qty = sanitizedNumber(adj.quantity);
      const price = getProductPrice(productId);

      if (adj.operator === '+') {
        productsTotal -= qty * price;
      } else if (adj.operator === '-') {
        productsTotal += qty * price;
      }
    });
    
    let voucherTotal = 0;
    fuelVouchers.forEach(voucher => {
      const productId = voucher.product_id;
      if (!productId) return;

      const qty = sanitizedNumber(voucher.quantity);
      const price = getProductPrice(productId);
      voucherTotal += qty * price;
    });
    
    const cashRemaining = productsTotal - voucherTotal;
    
    const filteredCashTransactions = cashTransactions.filter(transaction => {
      const transactionLedgerId = transaction.ledger_id || transaction.id;
      return mainLedgerId ? transactionLedgerId !== mainLedgerId : true;
    });
    
    const filteredTransactionsSum = filteredCashTransactions.reduce((sum, transaction) => 
      sum + sanitizedNumber(transaction?.amount), 0);
    
    return cashRemaining - filteredTransactionsSum;
  };

  const totalCollectedAmount = useMemo(() => {
    return allCashiers.reduce((sum, cashier) => sum + sanitizedNumber(cashier.collected_amount), 0);
  }, [allCashiers]);

  const mainLedgersSummary = useMemo(() => {
    const summary = [];
    let totalMainLedgerAmount = 0;

    allCashiers.forEach((cashier) => {
      const mainLedger = cashier.main_ledger;
      
      if (mainLedger) {
        const mainLedgerAmount = calculateCashierMainLedgerAmount(cashier);
        
        totalMainLedgerAmount += mainLedgerAmount || 0;
        
        summary.push({
          cashierName: cashier.name,
          ledgerName: ungroupedLedgerOptions.find(ledger => ledger.id === mainLedger.id)?.name || mainLedger.name,
          ledgerId: mainLedger.id,
          amount: mainLedgerAmount || 0,
        });
      }
    });

    return { summary, totalMainLedgerAmount };
  }, [allCashiers, ungroupedLedgerOptions]);

  const otherLedgersSummary = useMemo(() => {
    const ledgerMap = new Map();
    
    allCashiers.forEach((cashier) => {
      const cashTransactions = cashier.other_transactions || [];
      const mainLedgerId = cashier.main_ledger?.id || cashier.main_ledger_id;
      
      cashTransactions.forEach(transaction => {
        const transactionLedgerId = transaction.ledger_id || transaction.id;
        const ledgerName = ungroupedLedgerOptions.find(ledger => ledger.id === transactionLedgerId)?.name;
        
        if (transactionLedgerId !== mainLedgerId) {
          const amount = sanitizedNumber(transaction.amount);
          
          if (ledgerMap.has(transactionLedgerId)) {
            const existing = ledgerMap.get(transactionLedgerId);
            ledgerMap.set(transactionLedgerId, {
              ...existing,
              amount: existing.amount + amount,
              cashierCount: existing.cashierCount + 1,
            });
          } else {
            ledgerMap.set(transactionLedgerId, {
              ledgerId: transactionLedgerId,
              ledgerName: ledgerName,
              amount: amount,
              cashierCount: 1,
            });
          }
        }
      });
    });

    const summary = Array.from(ledgerMap.values());
    const totalOtherLedgerAmount = summary.reduce((sum, ledger) => sum + ledger.amount, 0);

    return { summary, totalOtherLedgerAmount };
  }, [allCashiers, ungroupedLedgerOptions]);

  const fuelVouchersAggregated = useMemo(() => {
    const voucherMap = new Map();
    
    allCashiers.forEach((cashier) => {
      const vouchers = cashier.fuel_vouchers || [];
      
      vouchers.forEach(voucher => {
        const key = voucher.expense_ledger_id || voucher.stakeholder_id;
        const name = voucher.expense_ledger?.name || voucher.stakeholder?.name || `Voucher ${key}`;
        const quantity = sanitizedNumber(voucher.quantity);
        const productId = voucher.product_id;
        const product = products?.find(p => p.id === productId);
        const productName = product?.name;
        const price = getProductPrice(productId);
        const amount = quantity * price;
        
        if (voucherMap.has(key)) {
          const existing = voucherMap.get(key);
          voucherMap.set(key, {
            ...existing,
            quantity: existing.quantity + quantity,
            amount: existing.amount + amount,
            cashierCount: existing.cashierCount + 1,
          });
        } else {
          voucherMap.set(key, {
            key,
            name,
            productName,
            quantity,
            amount,
            cashierCount: 1,
          });
        }
      });
    });

    const summary = Array.from(voucherMap.values());
    const totalVoucherAmount = summary.reduce((sum, voucher) => sum + voucher.amount, 0);
    const totalVoucherQuantity = summary.reduce((sum, voucher) => sum + voucher.quantity, 0);

    return { summary, totalVoucherAmount, totalVoucherQuantity };
  }, [allCashiers, products]);

  // Calculate expected cash per cashier using main_ledger_amount or fallback
  const cashierExpectedCash = (cashier) => {
    if (cashier.main_ledger_amount !== undefined && cashier.main_ledger_amount !== null) {
      return sanitizedNumber(cashier.main_ledger_amount);
    }
    // fallback to calculation if not present
    const pumpReadings = cashier.pump_readings || [];
    const selectedPumps = cashier.selected_pumps || [];
    let cashierProductsTotal = 0;
    selectedPumps.forEach(pumpId => {
      const pump = fuel_pumps?.find(p => p.id === pumpId);
      if (!pump) return;
      const productId = pump.product_id;
      const reading = pumpReadings.find(r => r?.fuel_pump_id === pumpId);
      if (reading) {
        const sold = (sanitizedNumber(reading.closing) - sanitizedNumber(reading.opening)) || 0;
        const price = getProductPrice(productId);
        cashierProductsTotal += sold * price;
      }
    });
    const adjustments = cashier.adjustments || [];
    adjustments.forEach(adj => {
      const productId = adj.product_id;
      const qty = sanitizedNumber(adj.quantity);
      const price = getProductPrice(productId);
      if (adj.operator === '+') {
        cashierProductsTotal -= qty * price;
      } else if (adj.operator === '-') {
        cashierProductsTotal += qty * price;
      }
    });
    let cashierVouchersTotal = 0;
    const vouchers = cashier.fuel_vouchers || [];
    vouchers.forEach(voucher => {
      const productId = voucher.product_id;
      if (!productId) return;
      const qty = sanitizedNumber(voucher.quantity);
      const price = getProductPrice(productId);
      cashierVouchersTotal += qty * price;
    });
    return cashierProductsTotal - cashierVouchersTotal;
  };

  // Sum of all expected cash for all cashiers
  const totalExpectedCash = useMemo(() => {
    return allCashiers.reduce((sum, cashier) => sum + cashierExpectedCash(cashier), 0);
  }, [allCashiers, fuel_pumps, productPrices]);

  // Profit/Loss summary using new expected cash
  const profitLossSummary = useMemo(() => {
    let totalProfit = 0;
    let totalLoss = 0;
    const cashierResults = [];
    allCashiers.forEach((cashier) => {
      const expectedCash = cashierExpectedCash(cashier);
      const collectedAmount = sanitizedNumber(cashier.collected_amount);
      const profitLoss = collectedAmount - expectedCash;
      if (profitLoss >= 0) {
        totalProfit += profitLoss;
      } else {
        totalLoss += Math.abs(profitLoss);
      }
      cashierResults.push({
        name: cashier.name,
        expectedCash,
        collectedAmount,
        profitLoss,
        isBalanced: Math.abs(profitLoss) < 0.01,
      });
    });
    const netProfitLoss = totalProfit - totalLoss;
    return {
      totalProfit,
      totalLoss,
      netProfitLoss,
      cashierResults,
    };
  }, [allCashiers, fuel_pumps, productPrices]);

  const totalPumpReadings = useMemo(() => {
    const totals = {};

    allCashiers.forEach(cashier => {
      const pumpReadings = cashier.pump_readings || [];
      const selectedPumps = cashier.selected_pumps || [];

      selectedPumps.forEach(pumpId => {
        const pump = fuel_pumps?.find(p => p.id === pumpId);
        if (!pump) return;

        const productId = pump.product_id;
        const reading = pumpReadings.find(r => r?.fuel_pump_id === pumpId);

        if (reading) {
          const sold = (sanitizedNumber(reading.closing) - sanitizedNumber(reading.opening)) || 0;
          totals[productId] = (totals[productId] || 0) + sold;
        }
      });
    });

    return totals;
  }, [allCashiers, fuel_pumps]);

  const totalAdjustments = useMemo(() => {
    const totals = {};
    const adjustmentsByOperator = { '+': 0, '-': 0 };

    allCashiers.forEach(cashier => {
      const adjustments = cashier.adjustments || [];

      adjustments.forEach(adj => {
        const productId = adj.product_id;
        const qty = sanitizedNumber(adj.quantity);

        if (adj.operator === '+') {
          adjustmentsByOperator['+'] += qty;
          totals[productId] = (totals[productId] || 0) - qty;
        } else if (adj.operator === '-') {
          adjustmentsByOperator['-'] += qty;
          totals[productId] = (totals[productId] || 0) + qty;
        }
      });
    });

    return { totals, adjustmentsByOperator };
  }, [allCashiers]);

  const totalFuelVouchers = useMemo(() => {
    const totals = {};
    let totalAmount = 0;

    allCashiers.forEach(cashier => {
      const vouchers = cashier.fuel_vouchers || [];

      vouchers.forEach(voucher => {
        const productId = voucher.product_id;
        if (!productId) return;

        const qty = sanitizedNumber(voucher.quantity);
        const price = getProductPrice(productId);
        const amount = qty * price;

        totals[productId] = (totals[productId] || 0) + qty;
        totalAmount += amount;
      });
    });

    return { totals, totalAmount };
  }, [allCashiers]);

  const combinedProductTotals = useMemo(() => {
    const totals = {};

    Object.keys(totalPumpReadings).forEach(productId => {
      totals[productId] = totalPumpReadings[productId] || 0;
    });

    Object.keys(totalAdjustments.totals).forEach(productId => {
      totals[productId] = (totals[productId] || 0) + totalAdjustments.totals[productId];
    });

    return totals;
  }, [totalPumpReadings, totalAdjustments.totals]);

  const financialSummary = useMemo(() => {
    let totalProductsAmount = 0;
    let totalVouchersAmount = fuelVouchersAggregated.totalVoucherAmount || totalFuelVouchers.totalAmount;
    let totalOtherLedgersAmount = otherLedgersSummary.totalOtherLedgerAmount;

    products?.forEach(product => {
      const qty = combinedProductTotals[product.id] || 0;
      const price = getProductPrice(product.id);
      totalProductsAmount += qty * price;
    });

    const cashRemaining = totalProductsAmount - totalVouchersAmount;

    const totalCashiers = allCashiers.length;
    const totalPumpsAssigned = allCashiers.reduce(
      (sum, cashier) => sum + (cashier.selected_pumps?.length || 0),
      0
    );

    const totalFuelVoucherItems = allCashiers.reduce(
      (sum, cashier) => sum + (cashier.fuel_vouchers?.length || 0),
      0
    );

    const totalAdjustmentItems = allCashiers.reduce(
      (sum, cashier) => sum + (cashier.adjustments?.length || 0),
      0
    );

    return {
      totalProductsAmount,
      totalVouchersAmount,
      totalOtherLedgersAmount,
      totalMainLedgersAmount: mainLedgersSummary.totalMainLedgerAmount,
      cashRemaining,
      totalCashiers,
      totalPumpsAssigned,
      totalFuelVoucherItems,
      totalAdjustmentItems,
    };
  }, [combinedProductTotals, products, allCashiers, fuelVouchersAggregated, otherLedgersSummary, mainLedgersSummary]);

    // Payments summary card
  // Enhanced Payments summary: show 'paid to' and 'paid by' breakdowns
  const renderPaymentsSummary = () => {
    if (!paymentItems || paymentItems.length === 0) return null;

    // Group by 'paid to' (debit_ledger)
    const paidToMap = new Map();
    // Group by 'paid by' (credit_ledger)
    const paidByMap = new Map();

    paymentItems.forEach(item => {
      const debitLedger = ungroupedLedgerOptions.find(l => l.id === item.debit_ledger_id);
      const creditLedger = ungroupedLedgerOptions.find(l => l.id === item.credit_ledger_id);
      // Paid To
      if (debitLedger) {
        if (!paidToMap.has(debitLedger.id)) {
          paidToMap.set(debitLedger.id, { name: debitLedger.name, total: 0, payers: new Set() });
        }
        paidToMap.get(debitLedger.id).total += Number(item.amount) || 0;
        if (creditLedger) {
          paidToMap.get(debitLedger.id).payers.add(creditLedger.id);
        }
      }
      // Paid By
      if (creditLedger) {
        if (!paidByMap.has(creditLedger.id)) {
          paidByMap.set(creditLedger.id, { name: creditLedger.name, count: 0, total: 0 });
        }
        paidByMap.get(creditLedger.id).count += 1;
        paidByMap.get(creditLedger.id).total += Number(item.amount) || 0;
      }
    });

    const totalPayments = paymentItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="primary" />
            Payments Received Summary
            {currencyCode && (
              <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                (Amounts in {currencyCode})
              </Typography>
            )}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>Paid To:</Typography>
          <TableContainer sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ledger</TableCell>
                  <TableCell align="center">Payers Count</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...paidToMap.values()].map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.payers.size} size="small" />
                    </TableCell>
                    <TableCell align="right">{formatMoney(row.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider', fontWeight: 'bold' } }}>
                  <TableCell colSpan={2}>TOTAL PAYMENTS</TableCell>
                  <TableCell align="right">{formatMoney(totalPayments)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderFinancialLedgersSummary = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance color="primary" />
          Financial Ledgers Summary
          {currencyCode && (
            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
              (Amounts in {currencyCode})
            </Typography>
          )}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney fontSize="small" />
                MAIN LEDGERS (PER CASHIER)
                {currencyCode && (
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    ({currencyCode})
                  </Typography>
                )}
              </Typography>
              
              {mainLedgersSummary.summary.length === 0 ? (
                <Alert severity="info" sx={{ mt: 1 }}>No main ledgers defined</Alert>
              ) : (
                <>
                  <TableContainer sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Cashier</TableCell>
                          <TableCell>Ledger</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mainLedgersSummary.summary.map((ledger, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">{ledger.cashierName}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{ledger.ledgerName}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="medium">{formatMoney(ledger.amount)}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">Total Main Ledgers:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary.dark">
                        {formatMoney(mainLedgersSummary.totalMainLedgerAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondary.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="secondary.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Payment fontSize="small" />
                OTHER TRANSACTIONS
                {currencyCode && (
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    ({currencyCode})
                  </Typography>
                )}
              </Typography>
              
              {otherLedgersSummary.summary.length === 0 ? (
                <Alert severity="info" sx={{ mt: 1 }}>No other ledger transactions</Alert>
              ) : (
                <>
                  <TableContainer sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ledger</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {otherLedgersSummary.summary.map((ledger, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">{ledger.ledgerName}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="medium">{formatMoney(ledger.amount)}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">Total Other Transactions:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="secondary.dark">
                        {formatMoney(otherLedgersSummary.totalOtherLedgerAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, mt: 2 }}>
              <Typography variant="subtitle2" color="info.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptOutlined fontSize="small" />
                FUEL VOUCHERS SUMMARY
                {currencyCode && (
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    ({currencyCode})
                  </Typography>
                )}
              </Typography>
              
              {fuelVouchersAggregated.summary.length === 0 ? (
                <Alert severity="info" sx={{ mt: 1 }}>No fuel vouchers recorded</Alert>
                ) : (
                  <>
                    <TableContainer sx={{ maxHeight: 200 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Stakeholder/Ledger</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell align="right">Quantity (L)</TableCell>
                            <TableCell align="center">Counts</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fuelVouchersAggregated.summary.map((voucher, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2">{voucher.name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{voucher.productName}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography>{voucher.quantity.toLocaleString()}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={`${voucher.cashierCount}`}
                                  color="info"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontWeight="medium" color="info.dark">
                                  {voucher.amount.toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Total Quantity:</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {fuelVouchersAggregated.totalVoucherQuantity.toLocaleString()} L
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight="bold">Total Vouchers Amount:</Typography>
                            <Typography variant="body1" fontWeight="bold" color="info.dark">
                              {fuelVouchersAggregated.totalVoucherAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </>
                )
              }
            </Paper>
          </Grid>

          {/* Grand Totals */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '2px solid',
                borderColor: 'primary.main',
                mt: 2
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.dark">
                GRAND TOTALS
                {currencyCode && (
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    (Amounts in {currencyCode})
                  </Typography>
                )}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Total Main Ledgers
                    </Typography>
                    <Typography variant="h6" color="primary.dark">
                      {formatMoney(mainLedgersSummary.totalMainLedgerAmount)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'secondary.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Total Other Ledgers
                    </Typography>
                    <Typography variant="h6" color="secondary.dark">
                      {formatMoney(otherLedgersSummary.totalOtherLedgerAmount)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Total Vouchers
                    </Typography>
                    <Typography variant="h6" color="info.dark">
                      {formatMoney(fuelVouchersAggregated.totalVoucherAmount)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      TOTAL DISTRIBUTED CASH:
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary.dark">
                      {formatMoney(
                        mainLedgersSummary.totalMainLedgerAmount + 
                        otherLedgersSummary.totalOtherLedgerAmount + 
                        fuelVouchersAggregated.totalVoucherAmount
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderProductSummary = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalGasStation color="primary" />
          Product Sales Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Pump Sales (L)</TableCell>
                <TableCell align="right">Adjustments (+/-)</TableCell>
                <TableCell align="right">Total Sold (L)</TableCell>
                <TableCell align="right">Price{currencyCode ? ` (${currencyCode})` : ''}</TableCell>
                <TableCell align="right">Amount{currencyCode ? ` (${currencyCode})` : ''}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products?.map(product => {
                const pumpQty = totalPumpReadings[product.id] || 0;
                const adjQty = totalAdjustments.totals[product.id] || 0;
                const totalQty = combinedProductTotals[product.id] || 0;
                const price = getProductPrice(product.id);
                const amount = totalQty * price;

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight="medium">{product.name}</Typography>
                        {adjQty !== 0 && (
                          <Chip
                            size="small"
                            label={`${adjQty > 0 ? '+' : ''}${adjQty}`}
                            color={adjQty > 0 ? "error" : "success"}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{pumpQty.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Typography color={adjQty > 0 ? "error.main" : "success.main"}>
                        {adjQty > 0 ? `+${adjQty.toLocaleString()}` : adjQty.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">
                        {totalQty.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{price.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        {amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider', fontWeight: 'bold' } }}>
                <TableCell>TOTAL</TableCell>
                <TableCell align="right">
                  {Object.values(totalPumpReadings).reduce((sum, qty) => sum + (qty || 0), 0).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Typography color={totalAdjustments.adjustmentsByOperator['-'] > totalAdjustments.adjustmentsByOperator['+'] ? "error.main" : "success.main"}>
                    {Object.values(totalAdjustments.totals).reduce((sum, qty) => sum + (qty || 0), 0).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {Object.values(combinedProductTotals).reduce((sum, qty) => sum + (qty || 0), 0).toLocaleString()}
                </TableCell>
                <TableCell align="right">-</TableCell>
                <TableCell align="right" sx={{ color: 'primary.main' }}>
                  {financialSummary.totalProductsAmount.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {Object.keys(totalAdjustments.totals).length > 0 && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              Adjustments: Gain (+){totalAdjustments.adjustmentsByOperator['+'].toLocaleString()}L /
              Loss (-){totalAdjustments.adjustmentsByOperator['-'].toLocaleString()}L
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderFuelVouchersSummary = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptOutlined color="default" />
          Fuel Vouchers Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {financialSummary.totalFuelVoucherItems === 0 ? (
          <Alert severity="info">No fuel vouchers recorded</Alert>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity (L)</TableCell>
                    <TableCell align="right">Price (TZS)</TableCell>
                    <TableCell align="right">Amount (TZS)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products?.map(product => {
                    const qty = totalFuelVouchers.totals[product.id] || 0;
                    if (qty === 0) return null;

                    const price = getProductPrice(product.id);
                    const amount = qty * price;

                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">{qty.toLocaleString()}</TableCell>
                        <TableCell align="right">{formatMoney(price)}</TableCell>
                        <TableCell align="right">
                          <Typography color="secondary.main" fontWeight="medium">
                            {formatMoney(amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider', fontWeight: 'bold' } }}>
                    <TableCell>TOTAL VOUCHERS</TableCell>
                    <TableCell align="right">
                      {Object.values(totalFuelVouchers.totals).reduce((sum, qty) => sum + (qty || 0), 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right" sx={{ color: 'secondary.main' }}>
                      {formatMoney(financialSummary.totalVouchersAmount)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${financialSummary.totalFuelVoucherItems} Vouchers`}
                size="small"
                color="secondary"
                variant="outlined"
              />
              <Typography variant="caption" color="textSecondary">
                Across {allCashiers.length} cashier{allCashiers.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderProfitLossSummary = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {profitLossSummary.netProfitLoss === 0 ? (
            <TrendingUp color="success" />
          ) : profitLossSummary.netProfitLoss > 0 ? (
            <TrendingUp color="info" />
          ) : (
            <TrendingDown color="error" />
          )}
          Cash Collection & Over/Short Summary
          {currencyCode && (
            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
              (Amounts in {currencyCode})
            </Typography>
          )}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {/* Expected vs Collected Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                CASH FLOW COMPARISON
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Expected Cash{currencyCode ? ` (${currencyCode})` : ''}:</Typography>
                <Typography variant="h6" color="primary.main">
                  {formatMoney(totalExpectedCash)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Actual Collected{currencyCode ? ` (${currencyCode})` : ''}:</Typography>
                <Typography variant="h6" color="info.main">
                  {formatMoney(totalCollectedAmount)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography fontWeight="bold">Difference{currencyCode ? ` (${currencyCode})` : ''}:</Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={profitLossSummary.netProfitLoss === 0 ? "success.main" : profitLossSummary.netProfitLoss > 0 ? "info.main" : "error.main"}
                >
                  {profitLossSummary.netProfitLoss === 0 ? '' : profitLossSummary.netProfitLoss > 0 ? '+' : '-'}{formatMoney(Math.abs(profitLossSummary.netProfitLoss))}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Over/Short Breakdown */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                OVER/SHORT BREAKDOWN
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.50', borderRadius: 1 }}>
                    <Typography variant="h5" color="success.dark">
                      {formatMoney(profitLossSummary.totalProfit)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total Over
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: 'error.50', borderRadius: 1 }}>
                    <Typography variant="h5" color="error">
                      {formatMoney(profitLossSummary.totalLoss)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Total Short
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  textAlign: 'center',
                  bgcolor: profitLossSummary.netProfitLoss === 0 ? 'success.100' : profitLossSummary.netProfitLoss > 0 ? 'info.100' : 'error.100',
                  borderRadius: 1,
                  borderColor: profitLossSummary.netProfitLoss === 0 ? 'success.200' : profitLossSummary.netProfitLoss > 0 ? 'info.200' : 'error.200'
                }}
              >
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  NET RESULT
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight="bold"
                  color={profitLossSummary.netProfitLoss === 0 ? "success.dark" : profitLossSummary.netProfitLoss > 0 ? "info.dark" : "error"}
                >
                  {profitLossSummary.netProfitLoss === 0 ? '' : profitLossSummary.netProfitLoss > 0 ? '+' : '-'}{formatMoney(Math.abs(profitLossSummary.netProfitLoss))}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {profitLossSummary.netProfitLoss === 0 ? 'Balanced' : profitLossSummary.netProfitLoss > 0 ? 'Overall Over' : 'Overall Short'}
                </Typography>
              </Paper>
            </Paper>
          </Grid>

          {/* Per Cashier Breakdown */}
          {profitLossSummary.cashierResults.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mt: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  PER CASHIER BREAKDOWN
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cashier</TableCell>
                        <TableCell align="right">Expected Cash</TableCell>
                        <TableCell align="right">Collected Cash</TableCell>
                        <TableCell align="right">Over/Short</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profitLossSummary.cashierResults.map((cashier, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography fontWeight="medium">{cashier.name}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography>{formatMoney(cashier.expectedCash)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="info.main">{formatMoney(cashier.collectedAmount)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              fontWeight="bold"
                              color={cashier.profitLoss === 0 ? "success.main" : cashier.profitLoss > 0 ? "info.main" : "error.main"}
                            >
                              {cashier.profitLoss === 0 ? '' : cashier.profitLoss > 0 ? '+' : '-'}{formatMoney(Math.abs(cashier.profitLoss))}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={cashier.isBalanced ? "BALANCED" : (cashier.profitLoss > 0 ? "OVER" : "SHORT")}
                              color={cashier.isBalanced ? "success" : (cashier.profitLoss > 0 ? "info" : "error")}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderShiftOverview = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Shift Overview
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h4" color="primary">
                {financialSummary.totalCashiers}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Cashiers
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h4" color="primary">
                {financialSummary.totalPumpsAssigned}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Pumps Assigned
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h4" color="secondary">
                {financialSummary.totalFuelVoucherItems}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Fuel Vouchers
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h4" color="warning.dark">
                {financialSummary.totalAdjustmentItems}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Adjustments
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Balance Status */}
        <Box sx={{ mt: 3, p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" gutterBottom>
            Shift Balance Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: profitLossSummary.netProfitLoss === 0 ? 'success.main' :
                          profitLossSummary.netProfitLoss > 0 ? 'info.main' : 'error.main'
                }}
              />
              <Typography>
                {profitLossSummary.netProfitLoss === 0 ? 'Perfectly Balanced' :
                profitLossSummary.netProfitLoss > 0 ? `Over: +${profitLossSummary.netProfitLoss.toLocaleString()}` :
                `Short: -${Math.abs(profitLossSummary.netProfitLoss).toLocaleString()}`}
              </Typography>
            </Box>

            <Chip
              label={profitLossSummary.netProfitLoss === 0 ? "BALANCED" :
                    profitLossSummary.netProfitLoss > 0 ? "OVER" : "SHORT"}
              color={profitLossSummary.netProfitLoss === 0 ? "success" :
                    profitLossSummary.netProfitLoss > 0 ? "info" : "error"}
              size="small"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {renderShiftOverview()}

      {renderProductSummary()}

      {renderFinancialLedgersSummary()}

      {renderPaymentsSummary()}

      {renderFuelVouchersSummary()}

      {renderProfitLossSummary()}

      {allCashiers.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No cashiers added yet. Please add cashiers in the "Cashiers Records" tab.
        </Alert>
      )}
    </div>
  );
}

export default ShiftSummary;