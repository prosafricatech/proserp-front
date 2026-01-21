"use client";

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Tooltip, 
  Typography,
  Autocomplete,
  Checkbox,
  Divider
} from '@mui/material';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { useEffect, useState } from 'react';

function PumpReadings({ 
  name, 
  control, 
  cashierIndex, 
  selectedPumps, 
  localPumpReadings, 
  setLocalPumpReadings 
}) {
  // Remove setValue from parameters and get it from useFormContext
  const { 
    setValue: formSetValue, 
    errors, 
    watch, 
    fuel_pumps, 
    tanks, 
    products, 
    getAvailablePumpsForCashier 
  } = useFormContext();  
  
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const [initializedPumps, setInitializedPumps] = useState([]);

  const handlePumpReadingChange = (pumpId, field, value) => {
    const updatedReadings = [...localPumpReadings];
    const existingIndex = updatedReadings.findIndex(r => r.fuel_pump_id === pumpId);
    
    if (existingIndex >= 0) {
      updatedReadings[existingIndex] = { 
        ...updatedReadings[existingIndex], 
        [field]: value 
      };
    } else {
      updatedReadings.push({ 
        fuel_pump_id: pumpId, 
        [field]: value,
        opening: field === 'opening' ? value : 0,
        closing: field === 'closing' ? value : 0
      });
    }
    
    setLocalPumpReadings(updatedReadings);
    // Also update form value
    formSetValue(name, updatedReadings, { shouldValidate: true, shouldDirty: true });
  };

  // Initialize pump readings when selected pumps change
  useEffect(() => {
    if (!selectedPumps || selectedPumps.length === 0) {
      setLocalPumpReadings([]);
      formSetValue(name, [], { shouldValidate: true, shouldDirty: true });
      return;
    }

    // Check which pumps need initialization
    const pumpsToInitialize = selectedPumps.filter(pumpId => 
      !localPumpReadings.some(reading => reading.fuel_pump_id === pumpId)
    );

    if (pumpsToInitialize.length > 0) {
      const updatedReadings = [...localPumpReadings];
      
      pumpsToInitialize.forEach(pumpId => {
        const pump = fuel_pumps?.find(p => p.id === pumpId);
        if (pump) {
          updatedReadings.push({
            fuel_pump_id: pumpId,
            product_id: pump.product_id,
            tank_id: pump.tank_id,
            opening: 0,
            closing: 0,
          });
        }
      });

      setLocalPumpReadings(updatedReadings);
      formSetValue(name, updatedReadings, { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedPumps]);

  // Get available pumps for this cashier
  const availablePumps = getAvailablePumpsForCashier ? 
    getAvailablePumpsForCashier(cashierIndex) : fuel_pumps || [];

  // Handle pump selection
  const handlePumpSelection = (selectedPumpIds) => {
    // Update selected pumps for this cashier
    formSetValue(`cashiers.${cashierIndex}.selected_pumps`, selectedPumpIds, {
      shouldValidate: true,
      shouldDirty: true
    });

    // Remove readings for deselected pumps
    const updatedReadings = localPumpReadings.filter(reading => 
      selectedPumpIds.includes(reading.fuel_pump_id)
    );

    // Update local state and form
    setLocalPumpReadings(updatedReadings);
    formSetValue(name, updatedReadings, { shouldValidate: true, shouldDirty: true });
  };

  // Get selected pumps with details
  const selectedPumpsWithDetails = selectedPumps.map(pumpId => {
    const pump = fuel_pumps?.find(p => p.id === pumpId);
    if (!pump) return null;
    
    const tank = tanks?.find(t => t.id === pump.tank_id);
    const product = products?.find(p => p.id === pump.product_id);
    
    return {
      id: pumpId,
      name: pump.name,
      tankName: tank?.name || 'Unknown Tank',
      productName: product?.name || 'Unknown Product',
    };
  }).filter(Boolean);

  return (
    <>
      {/* Pump Selection for this Cashier */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, md: 6}}>
          <Typography variant="h6" gutterBottom>
            Select Pumps for this Cashier
          </Typography>
          <Autocomplete
            multiple
            size="small"
            options={availablePumps || []}
            disableCloseOnSelect
            getOptionLabel={(option) => {
              const product = products?.find(p => p.id === option.product_id);
              return `${option.name}${product ? ` (${product.name})` : ''}`;
            }}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.name} - {products?.find(p => p.id === option.product_id)?.name || 'Unknown'}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Pumps"
                placeholder="Choose pumps..."
              />
            )}
            onChange={(e, selectedValues) => {
              const selectedIds = selectedValues.map(v => v.id);
              handlePumpSelection(selectedIds);
            }}
            value={availablePumps.filter(pump => 
              selectedPumps.includes(pump.id)
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Pump Readings for Selected Pumps */}
      {selectedPumpsWithDetails.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {selectedPumpsWithDetails.map((pump) => {
              const readingIndex = localPumpReadings.findIndex(r => r.fuel_pump_id === pump.id);
              const currentReading = readingIndex !== -1 ? localPumpReadings[readingIndex] : null;

              return (
                <Grid size={{xs: 12, md: 4, lg: 3}} key={pump.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container columnSpacing={2} rowSpacing={2}>
                        <Grid size={{xs: 12}}>
                          <Tooltip title={`Pump: ${pump.name} | Tank: ${pump.tankName}`}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {pump.name}
                            </Typography>
                          </Tooltip>
                          <Typography variant="caption" color="textSecondary">
                            Fuel: {pump.productName}
                          </Typography>
                        </Grid>
                        
                        <Grid size={12}>
                          <TextField
                            label="Opening Reading"
                            fullWidth
                            size="small"
                            value={currentReading?.opening || 0}
                            error={errors.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.opening}
                            helperText={errors.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.opening?.message}
                            onChange={(e) => {
                              const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
                              handlePumpReadingChange(pump.id, 'opening', value);
                            }}
                            InputProps={{
                              inputComponent: CommaSeparatedField,
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12}>
                          <TextField
                            label="Closing Reading"
                            fullWidth
                            size="small"
                            value={currentReading?.closing || 0}
                            error={errors.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.closing}
                            helperText={errors.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.closing?.message}
                            onChange={(e) => {
                              const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
                              handlePumpReadingChange(pump.id, 'closing', value);
                            }}
                            InputProps={{
                              inputComponent: CommaSeparatedField,
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12}>
                          <Typography variant="caption">
                            Difference: {((currentReading?.closing || 0) - (currentReading?.opening || 0)).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Product Prices for this Cashier */}
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid size={{xs: 12}}>
              <Typography variant="h6">
                Fuel Prices for this Cashier
              </Typography>
            </Grid>
            
            {Array.from(new Set(selectedPumpsWithDetails.map(pump => {
              const pumpDetail = fuel_pumps?.find(p => p.id === pump.id);
              return pumpDetail?.product_id;
            }))).filter(Boolean).map(productId => {
              const product = products?.find(p => p.id === productId);
              if (!product) return null;

              return (
                <Grid size={{xs: 12, md: 4, lg: 3}} key={productId}>
                  <Card variant="outlined">
                    <CardContent>
                      <TextField
                        label={product.name}
                        fullWidth
                        size="small"
                        defaultValue={watch(`cashiers.${cashierIndex}.product_prices`)?.find(p => p.product_id === productId)?.price || 0}
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                        }}
                        onChange={(e) => {
                          const price = e.target.value ? sanitizedNumber(e.target.value) : 0;
                          const productPrices = watch(`cashiers.${cashierIndex}.product_prices`) || [];
                          const existingIndex = productPrices.findIndex(p => p.product_id === productId);
                          
                          if (existingIndex !== -1) {
                            formSetValue(`cashiers.${cashierIndex}.product_prices.${existingIndex}.price`, price);
                          } else {
                            formSetValue(`cashiers.${cashierIndex}.product_prices`, [
                              ...productPrices,
                              { product_id: productId, price }
                            ]);
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      ) : (
        <Typography color="textSecondary" textAlign="center" py={4}>
          Please select pumps for this cashier using the selector above
        </Typography>
      )}
    </>
  );
}

export default PumpReadings;