"use client";

import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Tooltip,
  Typography,
  Skeleton,
} from '@mui/material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { FuelPump } from '../../Stations/StationType';
import { Tank } from '../SalesShiftTypes';
import { Product } from '../../dippings/DippingsTypes';


interface PumpReadingItem {
  fuel_pump_id: number;
  opening: number | string;
  closing: number | string;
}

interface ProductPriceItem {
  product_id: number;
  price: number | string;
}

interface PumpReadingsProps {
  fuel_pumps?: FuelPump[];
  tanks?: Tank[];
  products?: Product[];
  pumpReadings?: Array<PumpReadingItem | null>;
  productPrices?: Array<ProductPriceItem | null>;
  errors?: any;
  setValue: (path: string, value: any, options?: any) => void;
  watch: (path: string) => any;
}

const PumpReadings: React.FC<PumpReadingsProps> = ({
  fuel_pumps = [],
  tanks = [],
  products = [],
  pumpReadings = [],
  productPrices = [],
  errors = {},
  setValue,
  watch,
}) => {
  // Safe loading check - THIS FIXES IT
if (!fuel_pumps || !Array.isArray(fuel_pumps) || fuel_pumps.length === 0 ||
    !tanks || !Array.isArray(tanks) || tanks.length === 0 ||
    !products || !Array.isArray(products) || products.length === 0) {
  return (
    <Grid container spacing={2}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
          <Card variant="outlined" sx={{ opacity: 0.6 }}>
            <CardContent>
              <Skeleton variant="text" height={40} />
              <Skeleton variant="rectangular" height={56} sx={{ mt: 2, borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={56} sx={{ mt: 2, borderRadius: 1 }} />
              <Skeleton variant="text" height={30} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

  return (
    <>
      {/* Pump Readings */}
      <Grid container spacing={2}>
        {fuel_pumps.map((pump) => {
          const reading = pumpReadings.find(r => r?.fuel_pump_id === pump.id);
          const opening = Number(reading?.opening ?? 0);
          const closing = Number(reading?.closing ?? 0);
          const difference = closing - opening;

          return (
            <Grid size={{ xs: 12, md: 4, lg: 3 }} key={pump.id}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container columnSpacing={2} rowSpacing={2}>
                    {/* Pump Name */}
                    <Grid size={{ xs: 6 }}>
                      <Tooltip title="Pump">
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {pump.name}
                        </Typography>
                      </Tooltip>
                    </Grid>

                    {/* Tank Name */}
                    <Grid size={{ xs: 6 }}>
                      <Tooltip title="Tank">
                        <Typography variant="caption">
                          {tanks.find(t => t.id === pump.tank_id)?.name ?? '—'}
                        </Typography>
                      </Tooltip>
                    </Grid>

                    {/* Fuel Name */}
                    <Grid size={12} sx={{ borderTop: '1px solid #eee', pt: 1 }}>
                      <Tooltip title="Fuel">
                        <Typography variant="caption">
                          Fuel: {products.find(p => p.id === pump.product_id)?.name ?? '—'}
                        </Typography>
                      </Tooltip>
                    </Grid>

                    {/* Closing Reading */}
                    <Grid size={12}>
                      <TextField
                        label="Closing"
                        fullWidth
                        size="small"
                        value={closing || ''}
                        error={!!errors?.pump_readings?.[pump.id]?.closing}
                        helperText={errors?.pump_readings?.[pump.id]?.closing?.message || ' '}
                        InputProps={{
                          inputComponent: CommaSeparatedField as any,
                        }}
                        onChange={(e) => {
                          const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
                          setValue(`pump_readings.${pump.id}`, {
                            fuel_pump_id: pump.id,
                            opening,
                            closing: value,
                            product_id: pump.product_id,
                            tank_id: pump.tank_id,
                          }, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </Grid>

                    {/* Opening Reading */}
                    <Grid size={12}>
                      <TextField
                        label="Opening"
                        fullWidth
                        size="small"
                        value={opening || ''}
                        error={!!errors?.pump_readings?.[pump.id]?.opening}
                        helperText={errors?.pump_readings?.[pump.id]?.opening?.message || ' '}
                        InputProps={{
                          inputComponent: CommaSeparatedField as any,
                        }}
                        onChange={(e) => {
                          const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
                          setValue(`pump_readings.${pump.id}`, {
                            fuel_pump_id: pump.id,
                            opening: value,
                            closing,
                            product_id: pump.product_id,
                            tank_id: pump.tank_id,
                          }, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </Grid>

                    {/* Difference */}
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary">
                        Pump Difference:{' '}
                        <strong>{difference.toLocaleString(undefined, { minimumFractionDigits: 3 })}</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Fuel Prices */}
      <Grid container columnSpacing={2} rowSpacing={2} marginTop={4}>
        <Grid size={12}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Fuel Prices
          </Typography>
        </Grid>
        {products.map((product) => {
          const currentPrice = Number(
            productPrices.find(p => p?.product_id === product.id)?.price ?? 0
          );

          return (
            <Grid size={{ xs: 12, md: 4, lg: 3 }} key={product.id}>
              <Card variant="outlined">
                <CardContent>
                  <TextField
                    label={product.name}
                    fullWidth
                    size="small"
                    value={currentPrice || ''}
                    InputProps={{
                      inputComponent: CommaSeparatedField as any,
                    }}
                    onChange={(e) => {
                      const price = e.target.value ? sanitizedNumber(e.target.value) : 0;
                      setValue(`product_prices.${product.id}`, {
                        product_id: product.id,
                        price,
                      }, { shouldValidate: true });
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Tank Summary */}
      <Grid container columnSpacing={2} rowSpacing={2} marginTop={4}>
        <Grid size={12}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Tank Difference Summary
          </Typography>
        </Grid>

        {Object.values(
          fuel_pumps.reduce((acc, pump) => {
            const tank = tanks.find(t => t.id === pump.tank_id);
            if (!tank || !pump.tank_id) return acc;

            if (!acc[pump.tank_id]) {
              acc[pump.tank_id] = { name: tank.name, difference: 0, price: 0 };
            }

            const reading = pumpReadings.find(r => r?.fuel_pump_id === pump.id);
            if (reading) {
              const sold = Number(reading.closing ?? 0) - Number(reading.opening ?? 0);
              acc[pump.tank_id].difference += sold;

              const price = Number(
                productPrices.find(p => p?.product_id === pump.product_id)?.price ?? 0
              );
              acc[pump.tank_id].price = price;
            }

            return acc;
          }, {} as Record<number, { name: string; difference: number; price: number }>)
        ).map((tank) => (
          <Grid size={{ xs: 12, md: 4, lg: 3 }} key={tank.name}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold' }}>
                  {tank.name}
                </Typography>
                <Grid container columnSpacing={1} sx={{ borderTop: '1px solid #eee', pt: 1 }}>
                  <Grid size={6}><Typography variant="body2">Quantity</Typography></Grid>
                  <Grid size={6}><Typography variant="body2" align="right">
                    {tank.difference.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                  </Typography></Grid>
                  <Grid size={6}><Typography variant="body2">Amount</Typography></Grid>
                  <Grid size={6}><Typography variant="body2" align="right" sx={{ fontWeight: 'bold' }}>
                    {(tank.difference * tank.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default PumpReadings;