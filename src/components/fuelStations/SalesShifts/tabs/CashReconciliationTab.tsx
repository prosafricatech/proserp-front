"use client";

import React from "react";
import {
  Grid,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";

interface CashReconciliationTabProps {
  salesShift?: any;
}

interface Denomination {
  denomination: number;
  count: number;
  amount: number;
}

interface CashReconciliation {
  expected_cash: number;
  actual_cash: number;
  difference: number;
  denominations: Denomination[];
  electronic_payments: number;
  vouchers_amount: number;
  expenses: number;
  notes: string;
}

const COMMON_DENOMINATIONS = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 1];

const CashReconciliationTab: React.FC<CashReconciliationTabProps> = ({ salesShift }) => {
  const { control, setValue, watch } = useFormContext();
  
  // Watch all relevant form values
  const cashReconciliation = watch("cash_reconciliation") || {};
  const pumpReadings = watch("pump_readings") || [];
  const fuelVouchers = watch("fuel_vouchers") || [];
  const adjustments = watch("adjustments") || [];

  // Calculate expected cash from pump sales
  const calculateExpectedCash = () => {
    let totalSales = 0;

    // Calculate sales from pump readings
    pumpReadings.forEach((pump: any) => {
      const difference = (pump.closing || 0) - (pump.opening || 0);
      // You would need product prices here - this is a simplified calculation
      // In real implementation, you'd multiply by product price
      totalSales += difference * 100; // Placeholder: assuming 100 per liter
    });

    return totalSales;
  };

  // Calculate total from fuel vouchers
  const calculateVouchersAmount = () => {
    return fuelVouchers.reduce((total: number, voucher: any) => {
      if (voucher.status !== 'cancelled') {
        return total + (voucher.total_amount || 0);
      }
      return total;
    }, 0);
  };

  // Calculate total adjustments
  const calculateAdjustmentsTotal = () => {
    const additions = adjustments
      .filter((adj: any) => adj.adjustment_type === 'addition')
      .reduce((sum: number, adj: any) => sum + (adj.amount || 0), 0);
    
    const deductions = adjustments
      .filter((adj: any) => adj.adjustment_type === 'deduction')
      .reduce((sum: number, adj: any) => sum + (adj.amount || 0), 0);
    
    return additions - deductions;
  };

  // Calculate total from denominations
  const calculateDenominationsTotal = () => {
    const denominations = cashReconciliation.denominations || [];
    return denominations.reduce((total: number, denom: Denomination) => {
      return total + (denom.amount || 0);
    }, 0);
  };

  // Initialize denominations if not exists
  React.useEffect(() => {
    if (!cashReconciliation.denominations || cashReconciliation.denominations.length === 0) {
      const initialDenominations = COMMON_DENOMINATIONS.map(denom => ({
        denomination: denom,
        count: 0,
        amount: 0
      }));
      
      setValue("cash_reconciliation.denominations", initialDenominations);
    }

    // Set initial calculated values
    const expectedCash = calculateExpectedCash();
    const vouchersAmount = calculateVouchersAmount();
    const adjustmentsTotal = calculateAdjustmentsTotal();
    
    setValue("cash_reconciliation.expected_cash", expectedCash);
    setValue("cash_reconciliation.vouchers_amount", vouchersAmount);
    setValue("cash_reconciliation.adjustments_total", adjustmentsTotal);

  }, [cashReconciliation.denominations, setValue]);

  // Update denomination amount when count changes
  const updateDenominationAmount = (index: number, count: number) => {
    const denominations = [...(cashReconciliation.denominations || [])];
    const denomination = denominations[index];
    
    if (denomination) {
      denomination.count = count;
      denomination.amount = denomination.denomination * count;
      
      setValue(`cash_reconciliation.denominations.${index}`, denomination);
      
      // Update actual cash total
      const actualCash = calculateDenominationsTotal();
      setValue("cash_reconciliation.actual_cash", actualCash);
      
      // Update difference
      const expectedCash = cashReconciliation.expected_cash || 0;
      const electronicPayments = cashReconciliation.electronic_payments || 0;
      const totalExpected = expectedCash + electronicPayments;
      const difference = actualCash - totalExpected;
      
      setValue("cash_reconciliation.difference", difference);
    }
  };

  // Update electronic payments and recalculate difference
  const updateElectronicPayments = (value: number) => {
    setValue("cash_reconciliation.electronic_payments", value);
    
    const expectedCash = cashReconciliation.expected_cash || 0;
    const actualCash = cashReconciliation.actual_cash || 0;
    const totalExpected = expectedCash + value;
    const difference = actualCash - totalExpected;
    
    setValue("cash_reconciliation.difference", difference);
  };

  const expectedCash = cashReconciliation.expected_cash || 0;
  const actualCash = cashReconciliation.actual_cash || 0;
  const electronicPayments = cashReconciliation.electronic_payments || 0;
  const vouchersAmount = cashReconciliation.vouchers_amount || 0;
  const adjustmentsTotal = cashReconciliation.adjustments_total || 0;
  const difference = cashReconciliation.difference || 0;
  const denominations = cashReconciliation.denominations || [];

  const totalExpected = expectedCash + electronicPayments;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Summary Alert */}
      <Alert 
        severity={difference === 0 ? "success" : difference > 0 ? "warning" : "error"}
        sx={{ mb: 3 }}
      >
        <Typography variant="body1" fontWeight="bold">
          Reconciliation Status: {difference === 0 ? "Balanced" : difference > 0 ? "Overage" : "Shortage"}
        </Typography>
        <Typography variant="body2">
          Difference: {difference >= 0 ? '+' : ''}{difference.toLocaleString()} | 
          Expected: {totalExpected.toLocaleString()} | 
          Actual: {actualCash.toLocaleString()}
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: 'primary.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" gutterBottom>
                Expected Cash
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {expectedCash.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'success.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Actual Cash
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {actualCash.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'info.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main" gutterBottom>
                Electronic Payments
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {electronicPayments.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ 
            backgroundColor: difference === 0 ? 'success.50' : difference > 0 ? 'warning.50' : 'error.50' 
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h6" 
                color={difference === 0 ? 'success.main' : difference > 0 ? 'warning.main' : 'error.main'} 
                gutterBottom
              >
                Difference
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {difference >= 0 ? '+' : ''}{difference.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Cash Denomination Table */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                💵 Cash Denomination Count
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell><strong>Denomination</strong></TableCell>
                      <TableCell align="center"><strong>Count</strong></TableCell>
                      <TableCell align="right"><strong>Amount</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {denominations.map((denom: Denomination, index: number) => (
                      <TableRow key={denom.denomination} hover>
                        <TableCell>
                          <Typography fontWeight="medium">
                            {denom.denomination.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={denom.count || 0}
                            onChange={(e) => updateDenominationAmount(index, parseInt(e.target.value) || 0)}
                            inputProps={{ 
                              min: 0,
                              style: { textAlign: 'center', width: 80 }
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="primary.main">
                            {(denom.amount || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total Cash
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                          {actualCash.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Other Payments and Summary */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                💳 Other Payments & Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {/* Electronic Payments */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Electronic Payments (MPesa, Card, etc.)"
                    type="number"
                    value={electronicPayments}
                    onChange={(e) => updateElectronicPayments(parseFloat(e.target.value) || 0)}
                    size="small"
                    inputProps={{ min: 0 }}
                    helperText="Total payments received via electronic methods"
                  />
                </Grid>

                {/* Vouchers Amount (Read-only) */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Fuel Vouchers Amount"
                    type="number"
                    value={vouchersAmount}
                    size="small"
                    InputProps={{ readOnly: true }}
                    helperText="Total amount from fuel vouchers (calculated automatically)"
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        backgroundColor: 'grey.50',
                        fontWeight: 'bold'
                      } 
                    }}
                  />
                </Grid>

                {/* Adjustments Total (Read-only) */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Net Adjustments"
                    type="number"
                    value={adjustmentsTotal}
                    size="small"
                    InputProps={{ readOnly: true }}
                    helperText="Net adjustments from additions and deductions"
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        backgroundColor: 'grey.50',
                        fontWeight: 'bold',
                        color: adjustmentsTotal >= 0 ? 'success.main' : 'error.main'
                      } 
                    }}
                  />
                </Grid>

                {/* Notes */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Reconciliation Notes"
                    multiline
                    rows={3}
                    value={cashReconciliation.notes || ''}
                    onChange={(e) => setValue("cash_reconciliation.notes", e.target.value)}
                    size="small"
                    placeholder="Any notes about the cash reconciliation..."
                    helperText="Document any discrepancies, issues, or special circumstances"
                  />
                </Grid>
              </Grid>

              {/* Final Summary */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Final Reconciliation Summary
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2">Total Expected:</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" fontWeight="bold" textAlign="right">
                      {totalExpected.toLocaleString()}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2">Total Actual Cash:</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" fontWeight="bold" textAlign="right">
                      {actualCash.toLocaleString()}
                    </Typography>
                  </Grid>
                  
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2">Difference:</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold" 
                      textAlign="right"
                      color={difference === 0 ? 'success.main' : difference > 0 ? 'warning.main' : 'error.main'}
                    >
                      {difference >= 0 ? '+' : ''}{difference.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Help Information */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Cash Reconciliation Process:</strong><br />
          1. Count physical cash by denomination<br />
          2. Enter electronic payments received<br />
          3. Review calculated totals from other tabs<br />
          4. Document any discrepancies in notes<br />
          5. The system will show if you're balanced, over, or short
        </Typography>
      </Alert>
    </Box>
  );
};

export default CashReconciliationTab;