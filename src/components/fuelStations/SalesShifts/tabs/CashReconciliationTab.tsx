"use client";

import React, { useMemo } from "react";
import { 
  Grid, Card, CardContent, Typography, Box, Divider, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, IconButton
} from "@mui/material";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { SalesShift } from "../SalesShiftType";
import { useSalesStation } from "../../Stations/StationProvider";
import { useProductsSelect } from "@/components/productAndServices/products/ProductsSelectProvider";

interface CashReconciliationTabProps {
  salesShift?: SalesShift;
  isClosing?: boolean;
}

interface ProductSummary {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
}

interface FuelVoucherSummary {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
}

interface CashDistribution {
  ledgerName: string;
  amount: number;
}

const CashReconciliationTab: React.FC<CashReconciliationTabProps> = ({ salesShift, isClosing = false }) => {
  const { watch, setValue, control } = useFormContext();
  const { activeStation } = useSalesStation();
  const { productOptions } = useProductsSelect();

  const fuelPumps = activeStation?.fuel_pumps || [];
  const pumpReadings = watch("pump_readings") || [];
  const fuelPrices = watch("product_prices") || [];
  const fuelVouchers = watch("fuel_vouchers") || [];
  const cashDistributions = watch("cash_distributions") || [];

  // Use field array for cash distributions
  const { fields, append, remove } = useFieldArray({
    control,
    name: "cash_distributions"
  });

  // Get all products from productOptions
  const allProducts = useMemo(() => {
    return productOptions || [];
  }, [productOptions]);

  // Find product by product_id
  const findProductById = (productId?: string | number | null) => {
    if (productId == null) return undefined;
    return allProducts.find(product => product.id === productId);
  };

  // Calculate pump difference
  const calculatePumpDifference = (opening: number, closing: number) => {
    return closing - opening;
  };

  // Calculate Product Summary (First Card) - Total Products Amount
  const productSummary = useMemo((): ProductSummary[] => {
    const productMap = new Map<number, ProductSummary>();

    // Initialize all products from fuel pumps
    fuelPumps.forEach(pump => {
      const product = findProductById(pump.product_id);
      if (product && !productMap.has(product.id)) {
        productMap.set(product.id, {
          productId: product.id,
          productName: product.name,
          quantity: 0,
          price: 0,
          amount: 0
        });
      }
    });

    // Calculate total quantity for each product from pump readings
    fuelPumps.forEach(pump => {
      const product = findProductById(pump.product_id);
      if (!product) return;

      const reading = pumpReadings.find((r: any) => r.pump_id === pump.id) || {
        opening: 0,
        closing: 0
      };

      const pumpDifference = calculatePumpDifference(reading.opening || 0, reading.closing || 0);
      const productSummary = productMap.get(product.id);
      
      if (productSummary) {
        productSummary.quantity += pumpDifference;
      }
    });

    // Calculate price and amount for each product
    const summaries = Array.from(productMap.values());
    summaries.forEach(summary => {
      const fuelPrice = fuelPrices.find((fp: any) => fp.product_id === summary.productId);
      summary.price = fuelPrice?.price ? parseFloat(fuelPrice.price) : 0;
      summary.amount = summary.quantity * summary.price;
    });

    return summaries;
  }, [pumpReadings, fuelPrices, fuelPumps, allProducts]);

  // Calculate total amount for products (Grand Total for first card)
  const productsGrandTotal = useMemo(() => {
    return productSummary.reduce((total, product) => total + product.amount, 0);
  }, [productSummary]);

  // Calculate Fuel Vouchers Summary (Second Card)
  const fuelVoucherSummary = useMemo((): FuelVoucherSummary[] => {
    if (!fuelVouchers || fuelVouchers.length === 0) {
      // If no vouchers, return empty summary for all products
      return productSummary.map(product => ({
        productId: product.productId,
        productName: product.productName,
        quantity: 0,
        price: product.price,
        amount: 0
      }));
    }

    const voucherMap = new Map<number, FuelVoucherSummary>();

    // Process fuel vouchers
    fuelVouchers.forEach((voucher: any) => {
      const product = findProductById(voucher.product_id);
      if (!product) return;

      if (!voucherMap.has(product.id)) {
        voucherMap.set(product.id, {
          productId: product.id,
          productName: product.name,
          quantity: 0,
          price: voucher.price || 0,
          amount: 0
        });
      }

      const voucherSummary = voucherMap.get(product.id)!;
      voucherSummary.quantity += voucher.quantity || 0;
      voucherSummary.amount += voucher.amount || 0;
    });

    // Add products that don't have vouchers but exist in product summary
    productSummary.forEach(product => {
      if (!voucherMap.has(product.productId)) {
        voucherMap.set(product.productId, {
          productId: product.productId,
          productName: product.productName,
          quantity: 0,
          price: product.price,
          amount: 0
        });
      }
    });

    return Array.from(voucherMap.values());
  }, [fuelVouchers, productSummary, allProducts]);

  // Calculate total amount for fuel vouchers (Grand Total for second card)
  const fuelVouchersGrandTotal = useMemo(() => {
    return fuelVoucherSummary.reduce((total, voucher) => total + voucher.amount, 0);
  }, [fuelVoucherSummary]);

  // Calculate Final Summary (Third Card)
  const cashRemaining = productsGrandTotal - fuelVouchersGrandTotal;

  // Calculate Cash Distribution Summary
  const cashDistributionSummary = useMemo(() => {
    const additionalDistributions = cashDistributions.slice(1) || [];
    const totalDistributed = additionalDistributions.reduce((total: number, dist: CashDistribution) => 
      total + (dist.amount || 0), 0);
    const mainLedgerRemaining = cashRemaining - totalDistributed;

    return {
      totalDistributed,
      mainLedgerRemaining
    };
  }, [cashDistributions, cashRemaining]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Update cash distribution
  const updateCashDistribution = (index: number, field: 'ledgerName' | 'amount', value: string | number) => {
    const updatedDistributions = [...cashDistributions];
    if (!updatedDistributions[index]) {
      updatedDistributions[index] = { ledgerName: '', amount: 0 };
    }
    updatedDistributions[index] = {
      ...updatedDistributions[index],
      [field]: value
    };
    setValue("cash_distributions", updatedDistributions);
  };

  // Add new cash distribution
  const addCashDistribution = () => {
    append({
      ledgerName: "",
      amount: 0
    });
  };

  // Remove cash distribution (cannot remove main ledger)
  const removeCashDistribution = (index: number) => {
    if (index > 0) {
      remove(index);
    }
  };

  // Initialize main ledger if not exists
  React.useEffect(() => {
    if (cashDistributions.length === 0 && cashRemaining !== 0) {
      setValue("cash_distributions", [{
        ledgerName: "Main Ledger",
        amount: cashRemaining
      }]);
    }
  }, [cashDistributions.length, cashRemaining, setValue]);

  // Update main ledger amount when cash remaining changes
  React.useEffect(() => {
    if (cashDistributions.length > 0) {
      const updatedDistributions = [...cashDistributions];
      if (!updatedDistributions[0]) {
        updatedDistributions[0] = { ledgerName: "Main Ledger", amount: 0 };
      }
      updatedDistributions[0] = {
        ...updatedDistributions[0],
        amount: cashDistributionSummary.mainLedgerRemaining
      };
      setValue("cash_distributions", updatedDistributions);
    }
  }, [cashDistributionSummary.mainLedgerRemaining, setValue]);

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        
        {/* First Card: Total Products Amount */}
        <Grid size={{ xs: 6 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Total Products Amount
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productSummary.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell align="right">{product.quantity.toLocaleString()}</TableCell>
                        <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(product.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Grand Total Row */}
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Grand Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(productsGrandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Second Card: Fuel Vouchers */}
        <Grid size={{ xs: 6 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Fuel Vouchers
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fuelVoucherSummary.map((voucher) => (
                      <TableRow key={voucher.productId}>
                        <TableCell>{voucher.productName}</TableCell>
                        <TableCell align="right">{voucher.quantity.toLocaleString()}</TableCell>
                        <TableCell align="right">{formatCurrency(voucher.price)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(voucher.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Grand Total Row */}
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Grand Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(fuelVouchersGrandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Third Card: Final Summary */}
        <Grid size={{ xs: 6 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Final Summary
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '60%' }}>Total Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(productsGrandTotal)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Fuel Vouchers Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                        {formatCurrency(fuelVouchersGrandTotal)}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cash Remaining</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: cashRemaining >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(cashRemaining)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Fourth Card: Cash Distribution */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Cash Distribution
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <Box sx={{ mb: 1 }}>
                {/* Main Ledger Row */}
                <Grid container spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value="Main Ledger"
                      disabled
                      variant="outlined"
                      sx={{
                        '& .MuiInputBase-input': {
                          fontWeight: 'bold',
                          backgroundColor: 'grey.50'
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 'bold', color: 'text.secondary', minWidth: '20px', textAlign: 'center' }}>
                        =
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={cashDistributionSummary.mainLedgerRemaining}
                        disabled
                        variant="outlined"
                        inputProps={{ 
                          style: { 
                            textAlign: 'right', 
                            fontWeight: 'bold',
                            backgroundColor: 'grey.50'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    {/* Empty space for alignment with delete buttons */}
                  </Grid>
                </Grid>

                {/* Additional Ledgers */}
                {fields.slice(1).map((field, index) => {
                  const actualIndex = index + 1;
                  return (
                    <Grid key={field.id} container spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={cashDistributions[actualIndex]?.ledgerName || ""}
                          onChange={(e) => updateCashDistribution(actualIndex, 'ledgerName', e.target.value)}
                          placeholder="Enter ledger name"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 'bold', color: 'text.secondary', minWidth: '20px', textAlign: 'center' }}>
                            =
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={cashDistributions[actualIndex]?.amount || 0}
                            onChange={(e) => updateCashDistribution(actualIndex, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            variant="outlined"
                            inputProps={{ 
                              min: 0,
                              step: "0.01",
                              style: { textAlign: 'right' }
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => removeCashDistribution(actualIndex)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  );
                })}

                {/* Add Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addCashDistribution}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Add Ledger
                  </Button>
                </Box>
              </Box>

              {/* Validation Message */}
              {cashDistributionSummary.mainLedgerRemaining < 0 && (
                <Typography 
                  variant="body2" 
                  color="error" 
                  sx={{ mt: 1, fontStyle: 'italic', fontSize: '0.75rem' }}
                >
                  Warning: Total distributed amount exceeds cash remaining!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CashReconciliationTab;