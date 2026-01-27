"use client";

import React, { useMemo } from 'react';
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
import { TrendingUp, TrendingDown, AttachMoney, LocalGasStation } from '@mui/icons-material';
import { useFormContext, useWatch } from 'react-hook-form';

function ShiftSummary() {
  const { 
    products, 
    fuel_pumps, 
  } = useFormContext();

  // Watch all cashiers data
  const allCashiers = useWatch({
    name: 'cashiers',
  }) || [];

  const productPrices = useWatch({
    name: 'product_prices',
  }) || [];

  // ──────────────────────────────────────────────────────────────
  // CALCULATE TOTALS FOR ALL CASHIERS
  // ──────────────────────────────────────────────────────────────

  // 1. Total Pump Readings for all cashiers
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
          const sold = ((reading.closing || 0) - (reading.opening || 0)) || 0;
          totals[productId] = (totals[productId] || 0) + sold;
        }
      });
    });
    
    return totals;
  }, [allCashiers, fuel_pumps]);

  // 2. Total Adjustments for all cashiers
  const totalAdjustments = useMemo(() => {
    const totals = {};
    const adjustmentsByOperator = { '+': 0, '-': 0 };
    
    allCashiers.forEach(cashier => {
      const adjustments = cashier.adjustments || [];
      
      adjustments.forEach(adj => {
        const productId = adj.product_id;
        const qty = adj.quantity || 0;
        
        if (adj.operator === '+') {
          adjustmentsByOperator['+'] += qty;
          totals[productId] = (totals[productId] || 0) - qty; // Subtract (increase cash)
        } else if (adj.operator === '-') {
          adjustmentsByOperator['-'] += qty;
          totals[productId] = (totals[productId] || 0) + qty; // Add (reduce cash)
        }
      });
    });
    
    return { totals, adjustmentsByOperator };
  }, [allCashiers]);

  // 3. Total Fuel Vouchers for all cashiers
  const totalFuelVouchers = useMemo(() => {
    const totals = {};
    let totalAmount = 0;
    
    allCashiers.forEach(cashier => {
      const vouchers = cashier.fuel_vouchers || [];
      
      vouchers.forEach(voucher => {
        const productId = voucher.product_id;
        if (!productId) return;
        
        const qty = voucher.quantity || 0;
        const price = productPrices.find(p => p?.product_id === productId)?.price || 0;
        const amount = qty * price;
        
        totals[productId] = (totals[productId] || 0) + qty;
        totalAmount += amount;
      });
    });
    
    return { totals, totalAmount };
  }, [allCashiers, productPrices]);

  // 4. Total Other Ledgers for all cashiers
  const totalOtherLedgers = useMemo(() => {
    const ledgerTotals = {};
    let totalAmount = 0;
    
    allCashiers.forEach(cashier => {
      const otherLedgers = cashier.other_ledgers || [];
      
      otherLedgers.forEach(ledger => {
        const amount = ledger.amount || 0;
        totalAmount += amount;
        
        // Group by ledger
        if (ledger.id) {
          ledgerTotals[ledger.id] = (ledgerTotals[ledger.id] || 0) + amount;
        }
      });
    });
    
    return { ledgerTotals, totalAmount };
  }, [allCashiers]);

  // 5. Combined product totals (Pump readings + Adjustments)
  const combinedProductTotals = useMemo(() => {
    const totals = {};
    
    // Start with pump readings
    Object.keys(totalPumpReadings).forEach(productId => {
      totals[productId] = totalPumpReadings[productId] || 0;
    });
    
    // Add adjustments
    Object.keys(totalAdjustments.totals).forEach(productId => {
      totals[productId] = (totals[productId] || 0) + totalAdjustments.totals[productId];
    });
    
    return totals;
  }, [totalPumpReadings, totalAdjustments.totals]);

  // 6. Financial Summary
  const financialSummary = useMemo(() => {
    let totalProductsAmount = 0;
    let totalVouchersAmount = totalFuelVouchers.totalAmount;
    let totalOtherLedgersAmount = totalOtherLedgers.totalAmount;
    
    // Calculate total products amount
    products?.forEach(product => {
      const qty = combinedProductTotals[product.id] || 0;
      const price = productPrices.find(p => p?.product_id === product.id)?.price || 0;
      totalProductsAmount += qty * price;
    });
    
    // Calculate cash remaining (total sales - vouchers)
    const cashRemaining = totalProductsAmount - totalVouchersAmount;
    
    // Calculate main ledger amount (should be)
    const mainLedgerAmount = cashRemaining - totalOtherLedgersAmount;
    
    // Count cashiers and pumps
    const totalCashiers = allCashiers.length;
    const totalPumpsAssigned = allCashiers.reduce(
      (sum, cashier) => sum + (cashier.selected_pumps?.length || 0), 
      0
    );
    
    // Count fuel vouchers
    const totalFuelVoucherItems = allCashiers.reduce(
      (sum, cashier) => sum + (cashier.fuel_vouchers?.length || 0), 
      0
    );
    
    // Count adjustments
    const totalAdjustmentItems = allCashiers.reduce(
      (sum, cashier) => sum + (cashier.adjustments?.length || 0), 
      0
    );
    
    return {
      totalProductsAmount,
      totalVouchersAmount,
      totalOtherLedgersAmount,
      cashRemaining,
      mainLedgerAmount,
      totalCashiers,
      totalPumpsAssigned,
      totalFuelVoucherItems,
      totalAdjustmentItems,
    };
  }, [combinedProductTotals, products, productPrices, allCashiers, totalFuelVouchers.totalAmount, totalOtherLedgers.totalAmount]);

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
                <TableCell align="right">Price (TZS)</TableCell>
                <TableCell align="right">Amount (TZS)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products?.map(product => {
                const pumpQty = totalPumpReadings[product.id] || 0;
                const adjQty = totalAdjustments.totals[product.id] || 0;
                const totalQty = combinedProductTotals[product.id] || 0;
                const price = productPrices.find(p => p?.product_id === product.id)?.price || 0;
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
              
              {/* Totals row */}
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
        
        {/* Adjustments summary */}
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
          <AttachMoney color="secondary" />
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
                    
                    const price = productPrices.find(p => p?.product_id === product.id)?.price || 0;
                    const amount = qty * price;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">{qty.toLocaleString()}</TableCell>
                        <TableCell align="right">{price.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Typography color="secondary.main" fontWeight="medium">
                            {amount.toLocaleString()}
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
                      {financialSummary.totalVouchersAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={`${financialSummary.totalFuelVoucherItems} items`}
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

  const renderFinancialSummary = () => (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="success" />
          Financial Summary
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          {/* Income Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.dark" gutterBottom>
                INCOME
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Total Sales</Typography>
                <Typography variant="h6" color="success.dark">
                  {financialSummary.totalProductsAmount.toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Deductions Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondary.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="secondary.dark" gutterBottom>
                DEDUCTIONS
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Fuel Vouchers</Typography>
                <Typography color="secondary.dark">
                  {financialSummary.totalVouchersAmount.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Other Ledgers</Typography>
                <Typography color="secondary.dark">
                  {financialSummary.totalOtherLedgersAmount.toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Net Cash Section */}
          <Grid size={{ xs: 12 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                bgcolor: financialSummary.cashRemaining >= 0 ? 'primary.50' : 'error.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: financialSummary.cashRemaining >= 0 ? 'primary.100' : 'error.100'
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                NET CASH AVAILABLE
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="bold">
                  {financialSummary.cashRemaining >= 0 ? 'Remaining Cash' : 'Shortage'}
                </Typography>
                <Typography 
                  variant="h4" 
                  fontWeight="bold"
                  color={financialSummary.cashRemaining >= 0 ? "primary.main" : "error.main"}
                >
                  {Math.abs(financialSummary.cashRemaining).toLocaleString()}
                  {financialSummary.cashRemaining >= 0 ? (
                    <TrendingUp sx={{ ml: 1, verticalAlign: 'middle' }} />
                  ) : (
                    <TrendingDown sx={{ ml: 1, verticalAlign: 'middle' }} />
                  )}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              {/* Distribution */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                  Cash Distribution:
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2">Main Ledger (Expected)</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {financialSummary.mainLedgerAmount.toLocaleString()}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2">Other Ledgers</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">
                      {financialSummary.totalOtherLedgersAmount.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
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
            Balance Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%',
                  bgcolor: financialSummary.cashRemaining >= 0 ? 'success.main' : 'error.main'
                }} 
              />
              <Typography>
                {financialSummary.cashRemaining >= 0 ? 'Shift is Balanced' : 'Shift has Shortage'}
              </Typography>
            </Box>
            
            <Chip 
              label={financialSummary.cashRemaining >= 0 ? "BALANCED" : "UNBALANCED"}
              color={financialSummary.cashRemaining >= 0 ? "success" : "error"}
              size="small"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderOtherLedgersSummary = () => {
    if (financialSummary.totalOtherLedgersAmount === 0) return null;
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Other Ledgers Distribution
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ledger</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell>Allocation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(totalOtherLedgers.ledgerTotals).map(ledgerId => {
                  const amount = totalOtherLedgers.ledgerTotals[ledgerId];
                  const percentage = (amount / financialSummary.totalOtherLedgersAmount * 100).toFixed(1);
                  
                  return (
                    <TableRow key={ledgerId}>
                      <TableCell>Ledger #{ledgerId}</TableCell>
                      <TableCell align="right">{amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box 
                              sx={{ 
                                height: 8, 
                                width: `${percentage}%`,
                                bgcolor: 'primary.main',
                                borderRadius: 4
                              }} 
                            />
                          </Box>
                          <Typography variant="caption">{percentage}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {renderShiftOverview()}
      
      {renderProductSummary()}
      
      {renderFinancialSummary()}
      
      {renderFuelVouchersSummary()}
      
      {renderOtherLedgersSummary()}
      
      {allCashiers.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No cashiers added yet. Please add cashiers in the "Cashiers Records" tab.
        </Alert>
      )}
    </div>
  );
}

export default ShiftSummary;