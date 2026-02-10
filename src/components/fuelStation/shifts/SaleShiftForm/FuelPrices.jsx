"use client";

import { Grid, TextField, Typography, Card, CardContent } from '@mui/material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useFormContext } from 'react-hook-form';
import { StationFormContext } from '../SalesShifts';
import { useContext } from 'react';

function FuelPrices() {
  const { watch } = useFormContext();
  const {activeStation} = useContext(StationFormContext);
  const { products } = activeStation;

  const productPrices = watch('product_prices') || [];
  return (
    <>
      <Typography variant="h6" gutterBottom padding={1}>
        Fuel Prices
      </Typography>
      <Grid container spacing={2}>
        {products?.map((product) => (
          <Grid size={{ xs: 12, md: 6, lg: 6 }} key={product.id}>
            <TextField
              label={product.name}
              fullWidth
              size="small"
              value={productPrices.find(p => p.product_id === product.id)?.price ?? ''}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              disabled
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default FuelPrices;