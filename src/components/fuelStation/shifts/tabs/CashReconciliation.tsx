import React, { useEffect, useMemo, useCallback } from 'react';
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
} from '@mui/material';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';

import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import { useFormContext, useFieldArray } from 'react-hook-form';

import { Product } from '@/components/productAndServices/products/ProductType';
import { FuelPump } from '@/components/fuelStation/Stations/StationType';
import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import { Adjustment, FuelVoucher, ProductPrice } from '../SalesShiftTypes';

interface PumpReading {
  fuel_pump_id?: number;
  opening?: number;
  closing?: number;
}

const CashReconciliation: React.FC = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<{
    product_prices: ProductPrice[];
    pump_readings: PumpReading[];
    main_ledger_id?: number | null;
    main_ledger?: { id?: number; amount?: number };
    main_ledger_amount?: number;
    other_ledgers: Array<{ id?: number; amount?: number | string }>;
    adjustments?: Adjustment[];
    fuelVouchers?: FuelVoucher[];
    products?: Product[];
    fuel_pumps?: FuelPump[];
    shiftLedgers?: Ledger[];
  }>();

  const { fields: otherLedgerFields, append, remove } = useFieldArray({
    name: 'other_ledgers',
  });

  const { ungroupedLedgerOptions = [] } = useLedgerSelect();

  // Watched values
  const productPrices = watch('product_prices') ?? [];
  const pumpReadings = watch('pump_readings') ?? [];
  const fuelVouchers = watch('fuelVouchers') ?? [];
  const adjustments = watch('adjustments') ?? [];
  const products = watch('products') ?? [];
  const fuel_pumps = watch('fuel_pumps') ?? [];
  const shiftLedgers = watch('shiftLedgers') ?? [];
  const mainLedgerId = watch('main_ledger_id');
  const otherLedgers = watch('other_ledgers') ?? [];

  // Fuel Voucher Totals per Product
  const fuelVoucherTotals = useMemo<Record<number, number>>(() => {
    const totals: Record<number, number> = {};

    fuelVouchers.forEach((voucher) => {
      if (!voucher?.product_id) return;
      const price = productPrices.find((p) => p.product_id === voucher.product_id)?.price ?? 0;
      const qty = voucher.quantity ?? 0;
      totals[voucher.product_id] = (totals[voucher.product_id] || 0) + qty * price;
    });

    return totals;
  }, [fuelVouchers, productPrices]);

  // Product Totals (Pumps + Adjustments)
  const productTotals = useMemo<Record<number, number>>(() => {
    const totals: Record<number, number> = {};

    // Pump differences
    fuel_pumps.forEach((pump) => {
      if (!pump?.product_id) return;
      const reading = pumpReadings.find((r) => r.fuel_pump_id === pump.id);
      const diff = (reading?.closing ?? 0) - (reading?.opening ?? 0);
      totals[pump.product_id] = (totals[pump.product_id] || 0) + diff;
    });

    // Adjustments
    adjustments?.forEach((adj) => {
      if (!adj?.product_id) return;
      const qty = adj.quantity ?? 0;
      if (adj.operator === '+') {
        totals[adj.product_id] = (totals[adj.product_id] || 0) - qty;
      } else if (adj.operator === '-') {
        totals[adj.product_id] = (totals[adj.product_id] || 0) + qty;
      }
    });

    return totals;
  }, [fuel_pumps, pumpReadings, adjustments]);

  // Grand Totals
  const { grandProductsTotal, grandFuelVoucherTotal, cashRemaining } = useMemo(() => {
    const fuelTotal = Object.values(fuelVoucherTotals).reduce((sum, val) => sum + val, 0);

    const productsTotal = products.reduce((sum, product) => {
      const qty = productTotals[product.id] ?? 0;
      const price = productPrices.find((p) => p.product_id === product.id)?.price ?? 0;
      return sum + qty * price;
    }, 0);

    return {
      grandProductsTotal: productsTotal,
      grandFuelVoucherTotal: fuelTotal,
      cashRemaining: productsTotal - fuelTotal,
    };
  }, [fuelVoucherTotals, productTotals, products, productPrices]);

  // Other Ledgers Total
  const totalOtherLedgersAmount = useMemo(() => {
    return otherLedgers.reduce((sum, item) => sum + sanitizedNumber(item.amount ?? 0), 0);
  }, [otherLedgers]);

  // Calculated Main Ledger Amount
  const mainLedgerAmount = useMemo(() => {
    return Math.max(0, cashRemaining - totalOtherLedgersAmount); // Prevent negative
  }, [cashRemaining, totalOtherLedgersAmount]);

  // Sync calculated amount to form
  useEffect(() => {
    const sanitized = sanitizedNumber(mainLedgerAmount);
    setValue('main_ledger_amount', sanitized, { shouldValidate: true, shouldDirty: true });

    if (mainLedgerId) {
      setValue('main_ledger', { id: mainLedgerId, amount: sanitized }, { shouldValidate: true });
    }
  }, [mainLedgerAmount, mainLedgerId, setValue]);

  // Available ledgers (excluding used ones)
  const availableLedgers = useMemo(() => {
    const used = new Set([mainLedgerId, ...otherLedgers.map((l) => l.id)].filter(Boolean));
    return shiftLedgers?.filter((l) => !used.has(l.id)) ?? [];
  }, [shiftLedgers, mainLedgerId, otherLedgers]);

  const getProductPrice = useCallback(
    (productId: number) => productPrices.find((p) => p.product_id === productId)?.price ?? 0,
    [productPrices]
  );

  const TableCellInfo: React.FC<{
    label?: string;
    value: React.ReactNode;
    colSpan?: number;
    align?: 'left' | 'right';
    fontWeight?: string | number;
  }> = ({ label, value, colSpan, align = 'left', fontWeight }) => (
    <Tooltip title={label ?? ''}>
      <TableCell colSpan={colSpan} align={align} size="small">
        <Typography variant="body2" sx={{ fontWeight }}>
          {value}
        </Typography>
      </TableCell>
    </Tooltip>
  );

  return (
    <Grid container columnSpacing={2} rowSpacing={3}>
      {/* Products Total */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Total Products Amount
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCellInfo fontWeight="bold" value="Product" />
                    <TableCellInfo fontWeight="bold" align="right" value="Qty" />
                    <TableCellInfo fontWeight="bold" align="right" value="Price" />
                    <TableCellInfo fontWeight="bold" align="right" value="Amount" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => {
                    const qty = productTotals[product.id] ?? 0;
                    const price = getProductPrice(product.id);
                    return (
                      <TableRow key={product.id}>
                        <TableCellInfo value={product.name} />
                        <TableCellInfo align="right" value={qty.toLocaleString()} />
                        <TableCellInfo align="right" value={price.toLocaleString()} />
                        <TableCellInfo align="right" value={(qty * price).toLocaleString()} />
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCellInfo fontWeight="bold" value="Grand Total" />
                    <TableCellInfo fontWeight="bold" align="right" colSpan={3} value={grandProductsTotal.toLocaleString()} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Fuel Vouchers */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Fuel Vouchers
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCellInfo fontWeight="bold" value="Product" />
                    <TableCellInfo fontWeight="bold" align="right" value="Qty" />
                    <TableCellInfo fontWeight="bold" align="right" value="Price" />
                    <TableCellInfo fontWeight="bold" align="right" value="Amount" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => {
                    const qty = fuelVouchers.reduce((sum, v) => (v.product_id === product.id ? sum + (v.quantity ?? 0) : sum), 0);
                    const price = getProductPrice(product.id);
                    return (
                      <TableRow key={product.id}>
                        <TableCellInfo value={product.name} />
                        <TableCellInfo align="right" value={qty.toLocaleString()} />
                        <TableCellInfo align="right" value={price.toLocaleString()} />
                        <TableCellInfo align="right" value={(qty * price).toLocaleString()} />
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCellInfo fontWeight="bold" value="Grand Total" />
                    <TableCellInfo fontWeight="bold" align="right" colSpan={3} value={grandFuelVoucherTotal.toLocaleString()} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary */}
      <Grid size={{ xs: 12, lg: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Final Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCellInfo value="Total Sales" />
                    <TableCellInfo align="right" value={grandProductsTotal.toLocaleString()} />
                  </TableRow>
                  <TableRow>
                    <TableCellInfo value="Fuel Vouchers" />
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

      {/* Cash Distribution */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
              Cash Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Main Ledger */}
            <Grid container spacing={2} alignItems="flex-end" mb={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Autocomplete
                  size="small"
                  options={availableLedgers}
                  getOptionLabel={(opt) => opt?.name ?? ''}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  value={ungroupedLedgerOptions.find((l) => l.id === mainLedgerId) ?? null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Main Ledger"
                      error={!!errors.main_ledger_id}
                      helperText={errors.main_ledger_id?.message}
                    />
                  )}
                  onChange={(_, newValue) => {
                  const id = newValue?.id ?? undefined;

                  setValue('main_ledger_id', id, { shouldValidate: true, shouldDirty: true });
                  setValue('main_ledger', { id }, { shouldValidate: true, shouldDirty: true });
                }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Amount"
                  value={mainLedgerAmount.toLocaleString()}
                  InputProps={{ inputComponent: CommaSeparatedField as any, readOnly: true }}
                />
              </Grid>
            </Grid>

            {/* Other Ledgers */}
            {otherLedgerFields.map((field, index) => (
              <Grid container spacing={2} key={field.id} alignItems="flex-end" mb={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Autocomplete
                    size="small"
                    options={availableLedgers}
                    getOptionLabel={(opt) => opt?.name ?? ''}
                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                    value={ungroupedLedgerOptions.find((l) => l.id === otherLedgers[index]?.id) ?? null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Other Ledger"
                        error={!!errors.other_ledgers?.[index]?.id}
                        helperText={errors.other_ledgers?.[index]?.id?.message}
                      />
                    )}
                   onChange={(_, val) => {
                    const id = val?.id ?? undefined; // ← Change null → undefined

                    setValue(`other_ledgers.${index}.id`, id, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                                    />
                </Grid>
                <Grid size={{ xs: 10, md: 4 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Amount"
                    value={otherLedgers[index]?.amount ?? ''}
                    InputProps={{ inputComponent: CommaSeparatedField}}
                    onChange={(e) => {
                      const val = sanitizedNumber(e.target.value);
                      setValue(`other_ledgers.${index}.amount`, val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    error={!!errors.other_ledgers?.[index]?.amount}
                    helperText={errors.other_ledgers?.[index]?.amount?.message}
                  />
                </Grid>
                <Grid size={2}>
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => remove(index)}>
                      <DisabledByDefault fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            ))}

            <Grid container justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddOutlined />}
                onClick={() => append({ id: null, amount: 0 })}
                disabled={availableLedgers.length === 0}
              >
                Add Ledger
              </Button>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CashReconciliation;