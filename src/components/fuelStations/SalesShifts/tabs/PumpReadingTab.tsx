"use client";

import React from "react";
import { Grid, Card, CardContent, TextField, Typography, Box } from "@mui/material";
import { useFormContext, useFieldArray } from "react-hook-form";
import { SalesShift } from "../SalesShiftType";
import { useSalesStation } from "../../Stations/StationProvider";

interface PumpReadingTabProps {
  salesShift?: SalesShift;
  isClosing?: boolean;
}

const PumpReadingTab: React.FC<PumpReadingTabProps> = ({ salesShift, isClosing = false }) => {
  const { control, watch } = useFormContext();
  const { activeStation } = useSalesStation();
  
  const fuelPumps = activeStation?.fuel_pumps || [];
  
  // Use field array for pump readings
  const { fields, update } = useFieldArray({
    control,
    name: "pump_readings"
  });

  // Watch all pump readings
  const pumpReadings = watch("pump_readings") || [];

  // Calculate pump difference
  const calculatePumpDifference = (opening: number, closing: number) => {
    return closing - opening;
  };

  // Update pump reading
  const updatePumpReading = (pumpIndex: number, field: 'opening' | 'closing', value: number) => {
    update(pumpIndex, {
      ...pumpReadings[pumpIndex],
      [field]: value
    });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2}>
        {fuelPumps.map((pump, index) => {
          const reading = pumpReadings.find((r: any) => r.pump_id === pump.id) || {
            opening: 0,
            closing: 0
          };
          const difference = calculatePumpDifference(reading.opening, reading.closing);

          return (
            <Grid key={pump.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 3,
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  {/* Pump Name and Tank Name in same row */}
                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ fontWeight: 'bold' }}
                      >
                        {pump.name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ textAlign: 'right' }}
                      >
                        {pump.tank?.name || 'No Tank'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Product/Fuel Name */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2,
                      fontStyle: 'italic',
                    }}
                  >
                    {pump.product?.name || 'No Product'}
                  </Typography>

                  {/* Opening and Closing Readings */}
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Opening Reading"
                        type="number"
                        value={reading.opening}
                        onChange={(e) => updatePumpReading(index, 'opening', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ 
                          min: 0,
                          style: { textAlign: 'center' }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Closing Reading"
                        type="number"
                        value={reading.closing}
                        onChange={(e) => updatePumpReading(index, 'closing', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ 
                          min: 0,
                          style: { textAlign: 'center' }
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Pump Difference */}
                  <Box 
                    sx={{ 
                      mt: 2,
                      p: 1,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      textAlign: 'center'
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold'
                      }}
                    >
                      Pump Difference: {difference}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default PumpReadingTab;