"use client";

import { Grid, TextField, Typography, Card, CardContent } from '@mui/material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useFormContext } from 'react-hook-form';
import { StationFormContext } from '../SalesShifts';
import { useContext } from 'react';

function FuelPrices() {
  const { setValue, watch } = useFormContext();
  const {activeStation} = useContext(StationFormContext);
  const { products } = activeStation;

  return (
    <>
      <Typography variant="h6" gutterBottom padding={1}>
        Fuel Prices
      </Typography>
      
      <Grid container spacing={2}>
        {products?.map((product) => (
          <Grid size={{ xs: 12, md: 4, lg: 4 }} key={product.id}>
            <TextField
              label={product.name}
              fullWidth
              size="small"
              defaultValue={watch(`product_prices`)?.find(p => p.product_id === product.id)?.price || 0}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e) => {
                const price = e.target.value ? sanitizedNumber(e.target.value) : 0;
                const productPrices = watch(`product_prices`) || [];
                const existingIndex = productPrices.findIndex(p => p.product_id === product.id);
                
                if (existingIndex !== -1) {
                  setValue(`product_prices.${existingIndex}.price`, price);
                } else {
                  setValue(`product_prices`, [
                    ...productPrices,
                    { product_id: product.id, price }
                  ]);
                }
              }}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default FuelPrices;