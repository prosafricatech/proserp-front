"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { 
  Grid, Card, CardContent, Typography, Box, Divider, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, IconButton
} from "@mui/material";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { SalesShift } from "../SalesShiftType";
import { useSalesStation } from "../../Stations/StationProvider";
import { useProductsSelect } from "@/components/productAndServices/products/ProductsSelectProvider";
import LedgerSelect from "@/components/accounts/ledgers/forms/LedgerSelect";
import { useLedgerSelect } from "@/components/accounts/ledgers/forms/LedgerSelectProvider";
import CommaSeparatedField from "@/shared/Inputs/CommaSeparatedField";

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
  ledger: {
    id: number;
    name: string;
    code?: string | null;
    ledger_group_id?: number;
    alias?: string | null;
    nature_id?: number;
  } | null;
  amount: number;
}

const CashReconciliationTab: React.FC<CashReconciliationTabProps> = ({ salesShift, isClosing = false }) => {
  const { watch, setValue, control } = useFormContext();
  const { activeStation } = useSalesStation();
  const { productOptions } = useProductsSelect();
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const fuelPumps = activeStation?.fuel_pumps || [];
  const pumpReadings = watch("pump_readings") || [];
  const fuelPrices = watch("product_prices") || [];
  const fuelVouchers = watch("fuel_vouchers") || [];
  const cashDistributions = watch("cash_distributions") || [];

  // Refs for maintaining focus
  const amountInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const focusedFieldRef = useRef<string | null>(null);

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

  // Get used ledger IDs to prevent duplicates
  const usedLedgerIds = useMemo(() => {
    return cashDistributions
      .filter((dist: CashDistribution, index: number) => index >= 0 && dist.ledger)
      .map((dist: CashDistribution) => dist.ledger!.id);
  }, [cashDistributions]);

  // Filter available ledgers (exclude already selected ones)
  const availableLedgers = useMemo(() => {
    return ungroupedLedgerOptions.filter(ledger => 
      !usedLedgerIds.includes(ledger.id)
    );
  }, [ungroupedLedgerOptions, usedLedgerIds]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Update cash distribution with focus management
  const updateCashDistribution = (index: number, field: 'ledger' | 'amount', value: any) => {
    // Store which field is currently focused
    if (field === 'amount') {
      focusedFieldRef.current = `amount-${index}`;
    }

    const updatedDistributions = [...cashDistributions];
    if (!updatedDistributions[index]) {
      updatedDistributions[index] = { ledger: null, amount: 0 };
    }
    updatedDistributions[index] = {
      ...updatedDistributions[index],
      [field]: value
    };
    setValue("cash_distributions", updatedDistributions);
  };

  // Add new cash distribution
  const addCashDistribution = () => {
    if (availableLedgers.length > 0) {
      append({
        ledger: null,
        amount: 0
      });
    }
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
        ledger: null,
        amount: cashRemaining
      }]);
    }
  }, [cashDistributions.length, cashRemaining, setValue]);

  // Update main ledger amount when cash remaining changes - WITHOUT losing focus
  React.useEffect(() => {
    if (cashDistributions.length > 0) {
      const updatedDistributions = [...cashDistributions];
      if (!updatedDistributions[0]) {
        updatedDistributions[0] = { 
          ledger: null, 
          amount: 0 
        };
      }
      
      // Only update if the value actually changed to prevent unnecessary re-renders
      if (updatedDistributions[0].amount !== cashDistributionSummary.mainLedgerRemaining) {
        updatedDistributions[0] = {
          ...updatedDistributions[0],
          amount: cashDistributionSummary.mainLedgerRemaining
        };
        setValue("cash_distributions", updatedDistributions);
      }
    }
  }, [cashDistributionSummary.mainLedgerRemaining, setValue]);

  // Effect to restore focus after re-render
  useEffect(() => {
    if (focusedFieldRef.current) {
      const inputElement = amountInputRefs.current[focusedFieldRef.current];
      if (inputElement) {
        // Small timeout to ensure the DOM has updated
        setTimeout(() => {
          inputElement.focus();
          // Move cursor to end of input
          const length = inputElement.value.length;
          inputElement.setSelectionRange(length, length);
        }, 10);
      }
    }
  }, [cashDistributions]); // Run when cashDistributions change

  // Clear focused field ref when component unmounts or when user clicks elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      focusedFieldRef.current = null;
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        
        {/* First Card: Total Products Amount */}
        <Grid size={{ xs: 6 }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}align="center">
                Total Products Amount
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'white' }}>
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
                    <TableRow sx={{ backgroundColor: 'white' }}>
                      <TableCell colSpan={3} align="left" sx={{ fontWeight: 'bold' }}>
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
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}align="center">
                Fuel Vouchers
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'white' }}>
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
                      <TableCell colSpan={3} align="left" sx={{ fontWeight: 'bold' }}>
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
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}align="center">
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
                    <TableRow sx={{ backgroundColor: 'white' }}>
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
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}align="center">
                Cash Distribution
              </Typography>
              <Divider sx={{ mb: 1 }} />
              
              <Box sx={{ mb: 1 }}>
                {/* Main Ledger Row - Now editable */}
                <Grid container spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                  <Grid size={{ xs: 6 }}>
                    <Controller
                      name={`cash_distributions.0.ledger`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <LedgerSelect
                          {...controllerField}
                          label="Main Ledger"
                          value={controllerField.value || null}
                          onChange={(newValue) => {
                            controllerField.onChange(newValue);
                            // Auto-focus amount field after selecting ledger
                            if (newValue) {
                              setTimeout(() => {
                                const amountInput = document.getElementById(`amount-0`);
                                if (amountInput) amountInput.focus();
                              }, 100);
                            }
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <TextField
                      id={`amount-0`}
                      fullWidth
                      size="small"
                      type="number"
                      label="Amount"
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
                  </Grid>
                  <Grid size={{ xs: 2 }}>
                    {/* Empty space for alignment - Main ledger cannot be deleted */}
                  </Grid>
                </Grid>

                {/* Additional Ledgers */}
                {fields.slice(1).map((field, index) => {
                  const actualIndex = index + 1;
                  const distribution = cashDistributions[actualIndex];
                  
                  return (
                    <Grid key={field.id} container spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name={`cash_distributions.${actualIndex}.ledger`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <LedgerSelect
                              {...controllerField}
                              label="Distribution Ledger"
                              value={controllerField.value || null}
                              onChange={(newValue) => {
                                controllerField.onChange(newValue);
                                if (newValue) {
                                  setTimeout(() => {
                                    const amountInput = document.getElementById(`amount-${actualIndex}`);
                                    if (amountInput) amountInput.focus();
                                  }, 100);
                                }
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <TextField
                          id={`amount-${actualIndex}`}
                          fullWidth
                          size="small"
                          label="Amount"
                          value={distribution?.amount || 0}
                          InputProps={{ 
                            inputComponent: CommaSeparatedField,
                            style: { textAlign: 'left' }
                          }}
                          inputRef={el => amountInputRefs.current[`amount-${actualIndex}`] = el}
                          onFocus={() => {
                            focusedFieldRef.current = `amount-${actualIndex}`;
                          }}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value;
                            // Convert comma separated string back to number
                            const numericValue = parseFloat(value.replace(/,/g, '')) || 0;
                            updateCashDistribution(actualIndex, 'amount', numericValue);
                          }}
                          placeholder="0.00"
                          disabled={!distribution?.ledger}
                        />
                      </Grid>
                      <Grid size={{ xs: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => removeCashDistribution(actualIndex)}
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  );
                })}

                {/* Add Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addCashDistribution}
                    size="small"
                    variant="outlined"
                    disabled={availableLedgers.length === 0}
                  >
                    Add 
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