'use client';

import React, { useState } from 'react';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { FuelVoucherData, ProductPrice } from '../../SalesShiftType';

interface FuelVouchersItemRowProps {
  fuelVoucher: FuelVoucherData;
  index: number;
  productPrices: ProductPrice[];
}

function FuelVouchersItemRow({
  fuelVoucher,
  index,
  productPrices,
}: FuelVouchersItemRowProps) {
  const { productOptions } = useProductsSelect();
  const product = productOptions.find(product => product.id === fuelVoucher.product_id);
  const client = fuelVoucher.stakeholder;
  const expense_ledger = fuelVoucher.expense_ledger;
  const product_price = productPrices?.find(price => price?.product_id === product?.id)?.price || 0;
  const [showForm, setShowForm] = useState(false);
  
  const { setValue, watch } = useFormContext<any>();
  const fuelVouchers: FuelVoucherData[] = watch('fuelVouchers') || [];
  
  const setFuelVouchers = (newVouchers: FuelVoucherData[] | ((prev: FuelVoucherData[]) => FuelVoucherData[])) => {
    if (typeof newVouchers === 'function') {
      setValue('fuelVouchers', newVouchers(fuelVouchers));
    } else {
      setValue('fuelVouchers', newVouchers);
    }
  };

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
        <Grid size={{ xs: 5, md: expense_ledger ? 4.5 : 4, lg: expense_ledger ? 2 : 3 }}>
          <Tooltip title="Client">
            <Typography variant="body2" noWrap>
              {client?.name || 'Internal use'}
            </Typography>
          </Tooltip>
        </Grid>

        {expense_ledger && (
          <Grid size={{ xs: 6, md: 2.5, lg: 1.5 }}>
            <Tooltip title="Expense Ledger">
              <Typography variant="body2" noWrap>
                {expense_ledger?.name}
              </Typography>
            </Tooltip>
          </Grid>
        )}

        {/* Product */}
        <Grid size={{ xs: 6, md: expense_ledger ? 3.5 : 5, lg: expense_ledger ? 2 : 2.5 }}>
          <Tooltip title="Product">
            <Typography variant="body2" noWrap>
              {product?.name}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Quantity */}
        <Grid size={{ xs: 6, md: 1, lg: 1 }} textAlign="right">
          <Tooltip title="Quantity">
            <Typography variant="body2">
              {(fuelVoucher.quantity ?? 0).toLocaleString()}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Amount */}
        <Grid size={{ xs: 6, md: 3, lg: 1 }} textAlign="right">
          <Tooltip title="Amount">
            <Typography variant="body2">
              {(product_price * (fuelVoucher.quantity ?? 0)).toLocaleString()}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Reference */}
        <Grid size={{ xs: 6, md: 5, lg: 1.5 }}>
          <Tooltip title="Reference">
            <Typography variant="body2" noWrap>
              {fuelVoucher.reference}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Narration */}
        <Grid size={{ xs: 6, md: 4, lg: 1.5 }}>
          <Tooltip title="Narration">
            <Typography variant="body2" noWrap>
              {fuelVoucher.narration}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12, md: 12, lg: 1 }} textAlign="end">
          <Tooltip title="Edit Fuel Voucher">
            <IconButton
              size="small"
              onClick={() => setShowForm(true)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Remove Fuel Voucher">
            <IconButton 
              size='small' 
              onClick={() => setFuelVouchers(prev => {
                const newItems = [...prev];
                newItems.splice(index, 1);
                return newItems;
              })}
            >
              <DisabledByDefault fontSize='small' color='error'/>
            </IconButton>
          </Tooltip>
        </Grid> 
      </Grid>
    </>
  );
}

export default FuelVouchersItemRow;