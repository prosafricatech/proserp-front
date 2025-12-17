import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { Card, CardContent, Grid, TextField, Tooltip, Typography } from '@mui/material';
import React from 'react'
import { useFormContext } from 'react-hook-form';

function PumpReadings() {
    const { setValue, errors, watch, fuel_pumps, tanks, products} = useFormContext();  

  return (
    <>

        {/* Pumps Reading */}
        <Grid container spacing={2}>
            {fuel_pumps?.map((pump) => (
               <Grid size={{xs: 12, md: 4, lg: 3}} key={pump.id}>
                    <Card variant="outlined">
                        <CardContent>
                            <Grid container columnSpacing={2} rowSpacing={2}>
                                <Grid size={{xs: 6, md: 6}}>
                                    <Tooltip title='Pump'>
                                        <Typography variant="caption" sx={{fontWeight: 'bold'}}>
                                            {pump.name}
                                        </Typography>
                                    </Tooltip>
                                </Grid>
                                <Grid size={{xs: 6, md: 6}}>
                                    <Tooltip title='Tank'>
                                        <Typography variant="caption">
                                            {tanks.find(t => t.id === pump.tank_id).name}
                                        </Typography>
                                    </Tooltip>
                                </Grid>
                                <Grid size={12} borderTop={0.1}>
                                    <Tooltip title='Fuel Name'>
                                        <Typography variant="caption">
                                            Fuel: {products.find(p => p.id === pump.product_id).name}
                                        </Typography>
                                    </Tooltip>
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        label={`Closing`}
                                        fullWidth
                                        size='small'
                                        defaultValue={watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id)?.closing || 0}
                                        error={errors.pump_readings && !!errors?.pump_readings[pump.id]?.closing}
                                        helperText={errors.pump_readings && errors.pump_readings[pump.id]?.closing?.message}
                                        onChange={(e) => {
                                            setValue(`pump_readings.${pump.id}.opening`, (watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id)?.opening || 0) || 0, {
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                            setValue(`pump_readings.${pump.id}.closing`, e.target.value ? sanitizedNumber(e.target.value) : 0,{
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                            setValue(`pump_readings.${pump.id}.fuel_pump_id`, pump.id);
                                            setValue(`pump_readings.${pump.id}.product_id`, pump.product_id);
                                            setValue(`pump_readings.${pump.id}.tank_id`, pump.tank_id);
                                        }}
                                        InputProps={{
                                            inputComponent: CommaSeparatedField,
                                        }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        label={`Opening`}
                                        fullWidth
                                        size='small'
                                        defaultValue={watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id)?.opening || 0}
                                        error={errors.pump_readings && !!errors?.pump_readings[pump.id]?.opening}
                                        helperText={errors.pump_readings && errors.pump_readings[pump.id]?.opening?.message}
                                        InputProps={{
                                            inputComponent: CommaSeparatedField,
                                        }}
                                        onChange={(e) => {
                                            setValue(`pump_readings.${pump.id}.closing`, (watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id)?.closing || 0) || 0, {
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                            setValue(`pump_readings.${pump.id}.opening`, e.target.value ? sanitizedNumber(e.target.value) : 0 || 0,{
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                            setValue(`pump_readings.${pump.id}.fuel_pump_id`, pump.id);
                                            setValue(`pump_readings.${pump.id}.product_id`, pump.product_id);
                                            setValue(`pump_readings.${pump.id}.tank_id`, pump.tank_id);
            
                                        }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    {(
                                        <Typography variant="caption">
                                            Pump Difference: {
                                                (() => {
                                                    const reading = watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id);
                                                    
                                                    if (reading) {
                                                        const closing = parseFloat(reading.closing) || 0;
                                                        const opening = parseFloat(reading.opening) || 0;
                                                        return (closing - opening).toLocaleString();
                                                    }
                                                    return 0;
                                                })()
                                            }
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>

        {/* Fuels Price */}
        <Grid container columnSpacing={2} rowSpacing={1} marginTop={2}>
            <Grid size={{xs: 12, md: 12}}>
                <Typography variant="h3">
                    Fuel Prices
                </Typography>
            </Grid>
            {products.map((product) => (
                 <Grid size={{xs: 12, md: 4, lg: 3}} key={product.id}>
                    <Card variant="outlined">
                        <CardContent>
                            <TextField
                                label={product.name}
                                fullWidth
                                size='small'
                                defaultValue={watch(`product_prices`).find(price => price?.product_id === product.id)?.price || 0}
                                InputProps={{
                                    inputComponent: CommaSeparatedField,
                                }}
                                onChange={(e) => {
                                    const price = e.target.value ? sanitizedNumber(e.target.value) : 0;
                                    setValue(`product_prices.${product.id}.product_id`, product.id);
                                    setValue(`product_prices.${product.id}.price`, price);
                                }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>

        {/* Tanks Difference Summary */}
        <Grid container columnSpacing={2} rowSpacing={1} marginTop={2}>
           <Grid size={{xs: 12, md: 12}}>
                <Typography variant="h3">
                    Tank Difference Summary
                </Typography>
            </Grid>
            {Object.values(fuel_pumps.reduce((acc, pump) => {
                if (!acc[pump.tank_id]) {
                    acc[pump.tank_id] = {
                        name: tanks.find(t => t.id === pump.tank_id).name,
                        difference: 0,
                        price: 0, 
                    };
                }

                const pump_reading = watch(`pump_readings`).find(reading => reading?.fuel_pump_id === pump.id);

                if (pump_reading?.closing || pump_reading?.opening) {
                    acc[pump.tank_id].difference += (pump_reading.closing - pump_reading.opening);

                    // Set the price of the product for this tank
                    acc[pump.tank_id].price = watch('product_prices').find(price => price?.product_id === pump.product_id)?.price || 0
                    
                }

                return acc;
            }, {})).map((tankInfo, tankId) => (
               <Grid size={{xs: 12, md: 4, lg: 3}} key={tankId}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle1" align="center">
                                {tankInfo.name}
                            </Typography>
                            <Grid container columnSpacing={1} borderTop={0.1}>
                                <Grid size={6}>
                                    <Typography>
                                        Quantity
                                    </Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography variant="subtitle2" align="right">
                                        {tankInfo.difference?.toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography>
                                        Amount
                                    </Typography>
                                </Grid>
                                <Grid size={6}>
                                    <Typography variant="subtitle2" align="right">
                                        {(tankInfo.difference * tankInfo.price).toLocaleString()} {/* total tank amount */}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>

    </>
  )
}

export default PumpReadings