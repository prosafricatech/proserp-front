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
  Divider,
  Box,
  Alert
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useContext, useEffect, useMemo } from 'react';
import { StationFormContext } from '../../SalesShifts';

function PumpReadings({ 
  name, 
  cashierIndex, 
  selectedPumps, 
  localPumpReadings, 
  setLocalPumpReadings,
  getAvailablePumpsForCashier,
  lastClosingReadings,
  handleCashierPumpSelection
}) {
  const { 
    setValue: formSetValue, 
    errors,
    watch
  } = useFormContext();
  
  const {activeStation} = useContext(StationFormContext);
  const {fuel_pumps, tanks, products } = activeStation;
  const cashierData = watch(`cashiers.${cashierIndex}`) || {};
  const hasLastReadings = Object.keys(lastClosingReadings || {}).length > 0;

  useEffect(() => {
    const savedReadings = cashierData.pump_readings || [];
    const savedSelectedPumps = cashierData.selected_pumps || [];
    
    if (savedReadings.length > 0 && localPumpReadings.length === 0) {
      setLocalPumpReadings(savedReadings);
    }
    
    if (savedSelectedPumps.length > 0 && selectedPumps.length === 0) {
      formSetValue(`cashiers.${cashierIndex}.selected_pumps`, savedSelectedPumps, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
  }, [cashierData, cashierIndex, formSetValue, localPumpReadings.length, selectedPumps.length]);

  const handlePumpReadingChange = (pumpId, field, value) => {
    const updatedReadings = [...localPumpReadings];
    const existingIndex = updatedReadings.findIndex(r => r.fuel_pump_id === pumpId);
    
    if (existingIndex >= 0) {
      updatedReadings[existingIndex] = { 
        ...updatedReadings[existingIndex], 
        [field]: value 
      };
    } else {
      const pump = fuel_pumps?.find(p => p.id === pumpId);
      updatedReadings.push({ 
        fuel_pump_id: pumpId,
        product_id: pump?.product_id,
        tank_id: pump?.tank_id,
        opening: field === 'opening' ? value : 0,
        closing: field === 'closing' ? value : 0
      });
    }
    
    setLocalPumpReadings(updatedReadings);
    formSetValue(name, updatedReadings, { shouldValidate: true, shouldDirty: true });
  };

  const availablePumps = useMemo(() => {
    if (!getAvailablePumpsForCashier) return fuel_pumps || [];
    return getAvailablePumpsForCashier(cashierIndex);
  }, [getAvailablePumpsForCashier, cashierIndex, fuel_pumps]);

  const handlePumpSelection = (selectedPumpIds) => {
    if (handleCashierPumpSelection) {
      handleCashierPumpSelection(cashierIndex, selectedPumpIds);
    } else {
      formSetValue(`cashiers.${cashierIndex}.selected_pumps`, selectedPumpIds, {
        shouldValidate: true,
        shouldDirty: true
      });

      const updatedReadings = localPumpReadings.filter(reading => 
        selectedPumpIds.includes(reading.fuel_pump_id)
      );

      selectedPumpIds.forEach(pumpId => {
        if (!updatedReadings.some(r => r.fuel_pump_id === pumpId)) {
          const pump = fuel_pumps?.find(p => p.id === pumpId);
          if (pump) {
            const lastClosing = lastClosingReadings?.[pumpId] || 0;
            updatedReadings.push({
              fuel_pump_id: pumpId,
              product_id: pump.product_id,
              tank_id: pump.tank_id,
              opening: lastClosing,
              closing: 0
            });
          }
        }
      });

      setLocalPumpReadings(updatedReadings);
      formSetValue(name, updatedReadings, { shouldValidate: true, shouldDirty: true });
    }
  };

  const selectedPumpsWithDetails = useMemo(() => {
    return selectedPumps.map(pumpId => {
      const pump = fuel_pumps?.find(p => p.id === pumpId);
      if (!pump) return null;
      
      const tank = tanks?.find(t => t.id === pump.tank_id);
      const product = products?.find(p => p.id === pump.product_id);
      const reading = localPumpReadings.find(r => r.fuel_pump_id === pumpId);
      const lastClosing = lastClosingReadings?.[pumpId];
      
      return {
        id: pumpId,
        name: pump.name,
        tankName: tank?.name,
        productName: product?.name,
        opening: reading?.opening || 0,
        closing: reading?.closing || 0,
        product_id: pump.product_id,
        tank_id: pump.tank_id,
        lastClosing: lastClosing
      };
    }).filter(Boolean);
  }, [selectedPumps, fuel_pumps, tanks, products, localPumpReadings, lastClosingReadings]);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12}}>
          {hasLastReadings && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Last shift readings are available. Opening readings will be auto-filled when you select pumps.
            </Alert>
          )}
          
          <Typography variant="h6" gutterBottom>
            Select Pumps for this Cashier
          </Typography>
          <Autocomplete
            multiple
            size="small"
            options={availablePumps}
            disableCloseOnSelect
            getOptionLabel={(option) => {
              const product = products?.find(p => p.id === option.product_id);
              const lastReading = lastClosingReadings?.[option.id];
              return `${option.name}${product ? ` (${product.name})` : ''}${lastReading ? ` - Last: ${lastReading.toLocaleString()}` : ''}`;
            }}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              const isAvailable = availablePumps.some(p => p.id === option.id);
              const lastReading = lastClosingReadings?.[option.id];
              
              return (
                <li 
                  key={key} 
                  {...optionProps}
                  style={{
                    opacity: isAvailable ? 1 : 0.5,
                    cursor: isAvailable ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Checkbox
                    style={{ marginRight: 8 }}
                    checked={selected}
                    disabled={!isAvailable}
                  />
                  <Box>
                    <div>{option.name} - {products?.find(p => p.id === option.product_id)?.name || 'Unknown'}</div>
                    {lastReading && (
                      <Typography variant="caption" color="textSecondary">
                        Last closing: {lastReading.toLocaleString()}
                      </Typography>
                    )}
                    {!isAvailable && (
                      <Typography variant="caption" color="error">
                        Assigned to another cashier
                      </Typography>
                    )}
                  </Box>
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
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {selectedPumpsWithDetails.length > 0 ? (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Pump Readings
          </Typography>
          <Grid container spacing={2}>
            {selectedPumpsWithDetails.map((pump) => {
              const readingIndex = localPumpReadings.findIndex(r => r.fuel_pump_id === pump.id);
              const currentReading = readingIndex !== -1 ? localPumpReadings[readingIndex] : {
                opening: 0,
                closing: 0
              };

              const difference = currentReading.closing - currentReading.opening;
              
              return (
                <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}} key={pump.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Tooltip title={`Pump: ${pump.name} | Tank: ${pump.tankName}`}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {pump.name}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="textSecondary">
                          {pump.productName}
                        </Typography>
                        {pump.lastClosing !== undefined && (
                          <Typography variant="caption" display="block" color="info.main">
                            Last closing: {pump.lastClosing.toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                      
                      <Grid container spacing={1}>
                        <Grid size={12}>
                          <TextField
                            label="Opening Reading"
                            fullWidth
                            size="small"
                            value={currentReading.opening}
                            error={!!errors?.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.opening}
                            helperText={errors?.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.opening?.message}
                            onChange={(e) => {
                              if (!hasLastReadings) {
                                const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
                                handlePumpReadingChange(pump.id, 'opening', value);
                              }
                            }}
                            InputProps={{
                              inputComponent: CommaSeparatedField,
                              readOnly: hasLastReadings
                            }}
                          />
                        </Grid>
                        
                        <Grid size={12}>
                          <TextField
                            label="Closing Reading"
                            fullWidth
                            size="small"
                            value={currentReading.closing}
                            error={!!errors?.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.closing}
                            helperText={errors?.cashiers?.[cashierIndex]?.pump_readings?.[readingIndex]?.closing?.message}
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
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 1
                          }}>
                            <Typography variant="caption" color="textSecondary">
                              Difference:
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: difference >= 0 ? 'success.main' : 'error.main'
                              }}
                            >
                              {difference.toLocaleString()} liters
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">
            Please select pumps for this cashier using the selector above
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            Available pumps: {availablePumps.length}
          </Typography>
          {hasLastReadings && (
            <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
              Last shift readings are available for auto-filling
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default PumpReadings;