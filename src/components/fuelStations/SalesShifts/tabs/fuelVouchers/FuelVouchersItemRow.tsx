'use client';

import React, { useState } from 'react';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import FuelVouchers from './FuelVouchers';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

import { FuelVoucherData, ProductPrice } from '../../SalesShiftType';
import { Product } from '@/components/productAndServices/products/ProductType';

interface FuelVouchersItemRowProps {
  fuelVoucher: FuelVoucherData;
  index: number;
  productPrices: ProductPrice[];
}

export default function FuelVouchersItemRow({
  fuelVoucher,
  index,
  productPrices,
}: FuelVouchersItemRowProps) {
  const [showForm, setShowForm] = useState(false);

  const { productOptions = [] } = useProductsSelect();
  const { setValue, watch } = useFormContext<any>();
  const fuelVouchers: FuelVoucherData[] = watch('fuelVouchers') || [];

  // Safe lookups
  const product = fuelVoucher.product_id
    ? productOptions.find((p: Product) => p.id === fuelVoucher.product_id) ?? null
    : null;

  const client = fuelVoucher.stakeholder;
  const expenseLedger = fuelVoucher.expense_ledger;

  const price = productPrices.find(p => p.product_id === product?.id)?.price || 0;
  const amount = price * (fuelVoucher.quantity ?? 0);

  const hasExpenseLedger = !!expenseLedger;

  const handleRemove = () => {
    setValue(
      'fuelVouchers',
      fuelVouchers.filter((_: any, i: number) => i !== index)
    );
  };

  if (showForm) {
    return (
      <FuelVouchers
        productPrices={productPrices}
        fuelVoucher={fuelVoucher}
        index={index}
        setShowForm={setShowForm}
        showList={false}
        onUpdateSuccess={() => setShowForm(false)}
      />
    );
  }

  return (
    <>
      <Divider />

      <Grid
        container
        alignItems="center"
        sx={{
          py: 1.5,
          px: 1.5,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {/* Serial Number */}
        <Grid size={{ xs: 1, md: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {index + 1}.
          </Typography>
        </Grid>

        {/* Client */}
        <Grid size={{ xs: 5, md: hasExpenseLedger ? 4.5 : 4, lg: hasExpenseLedger ? 2 : 3 }}>
          <Tooltip title="Client">
            <Typography variant="body2" noWrap>
              {client?.name || 'Internal use'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Expense Ledger (only if no client) */}
        {hasExpenseLedger && (
          <Grid size={{ xs: 6, md: 2.5, lg: 1.5 }}>
            <Tooltip title="Expense Ledger">
              <Typography variant="body2" color="text.secondary" noWrap>
                {expenseLedger?.name}
              </Typography>
            </Tooltip>
          </Grid>
        )}

        {/* Product */}
        <Grid size={{ xs: 6, md: hasExpenseLedger ? 3.5 : 5, lg: hasExpenseLedger ? 2 : 2.5 }}>
          <Tooltip title="Product">
            <Typography variant="body2" noWrap>
              {product?.name || 'N/A'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Quantity */}
        <Grid size={{ xs: 6, md: 1, lg: 1 }} textAlign="right">
          <Tooltip title="Quantity (Liters)">
            <Typography variant="body2">
              {(fuelVoucher.quantity ?? 0).toLocaleString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Amount */}
        <Grid size={{ xs: 6, md: 3, lg: 1 }} textAlign="right">
          <Tooltip title="Amount">
            <Typography variant="body2" fontWeight="600" color="primary">
              {amount.toLocaleString()}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Reference */}
        <Grid size={{ xs: 6, md: 5, lg: 1.5 }}>
          <Tooltip title={fuelVoucher.reference || 'No reference'}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {fuelVoucher.reference || '—'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Narration */}
        <Grid size={{ xs: 6, md: 4, lg: 1.5 }}>
          <Tooltip title={fuelVoucher.narration || 'No narration'}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {fuelVoucher.narration || '—'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 12, lg: 1 }} textAlign="right">
          <Tooltip title="Edit Voucher">
            <IconButton
              size="small"
              onClick={() => setShowForm(true)}
              sx={{ mr: 0.5 }}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Remove Voucher">
            <IconButton size="small" color="error" onClick={handleRemove}>
              <DisabledByDefault fontSize="small" />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
    </>
  );
}