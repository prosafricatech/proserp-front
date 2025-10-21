"use client";

import React, { useMemo } from "react";
import { Grid, Card, CardContent, TextField, Typography, Box, Divider } from "@mui/material";
import { useFormContext, useFieldArray } from "react-hook-form";
import { SalesShift } from "../SalesShiftType";
import { useSalesStation } from "../../Stations/StationProvider";
import { useProductsSelect } from "@/components/productAndServices/products/ProductsSelectProvider";
import { useQuery } from "@tanstack/react-query";
import storeServices from "@/components/procurement/stores/store-services";
import { StoreOption } from "@/components/procurement/stores/storeTypes";
import { Product } from "@/components/productAndServices/products/ProductType";

interface PumpReadingTabProps {
  salesShift?: SalesShift;
  isClosing?: boolean;
}

const PumpReadingTab: React.FC<PumpReadingTabProps> = ({ salesShift, isClosing = false }) => {
  const { control, watch, setValue } = useFormContext();
  const { activeStation } = useSalesStation();
  const { productOptions } = useProductsSelect();
  
  // Fetch store options
  const { data: storeOptions, isLoading: isFetchingStores } = useQuery<StoreOption[], Error>({
    queryKey: ["storeOptions"],
    queryFn: () => storeServices.getStoreOptions(true),
  });

  const fuelPumps = activeStation?.fuel_pumps || [];

  // Get all products from productOptions
  const allProducts = useMemo(() => {
    return productOptions || [];
  }, [productOptions]);

  // Get all stores/tanks from storeOptions
  const allStores = useMemo(() => {
    if (!storeOptions) return [];
    return storeOptions.filter((store) => {
      return store.name != null && 
             typeof store.name === "string" && 
             store.name.trim() !== "";
    });
  }, [storeOptions]);

  // Find product by product_id
  const findProductById = (productId?: string | number | null): Product | undefined => {
    if (productId == null) return undefined;
    return allProducts.find(product => product.id === productId);
  };
  
  // Find store/tank by tank_id
  const findStoreById = (storeId?: string | number | null): StoreOption | undefined => {
    if (storeId == null) return undefined;
    return allStores.find(store => store.id === storeId);
  };

  // Use field array for pump readings
  const { fields, update } = useFieldArray({
    control,
    name: "pump_readings"
  });

  // Watch all pump readings and fuel prices
  const pumpReadings = watch("pump_readings") || [];
  const fuelPrices = watch("fuel_prices") || [];

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

  // Update fuel price
  const updateFuelPrice = (productId: string | number, price: number) => {
    const existingPriceIndex = fuelPrices.findIndex((fp: any) => fp.product_id === productId);
    
    if (existingPriceIndex >= 0) {
      // Update existing price
      const updatedPrices = [...fuelPrices];
      updatedPrices[existingPriceIndex] = {
        ...updatedPrices[existingPriceIndex],
        price: price
      };
      setValue("fuel_prices", updatedPrices);
    } else {
      // Add new price
      setValue("fuel_prices", [
        ...fuelPrices,
        {
          product_id: productId,
          price: price
        }
      ]);
    }
  };

  // Get unique products from fuel pumps
  const uniqueProducts = useMemo(() => {
    const productMap = new Map();
    fuelPumps.forEach(pump => {
      const product = findProductById(pump.product_id);
      if (product && !productMap.has(product.id)) {
        productMap.set(product.id, product);
      }
    });
    return Array.from(productMap.values());
  }, [fuelPumps, allProducts]);

  // Validate opening reading
  const validateOpeningReading = (opening: number, closing: number) => {
    return opening <= closing;
  };

  // Validate closing reading
  const validateClosingReading = (opening: number, closing: number) => {
    return closing >= opening;
  };

  if (isFetchingStores) {
    return <div>Loading store options...</div>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Pump Readings Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Pump Readings
      </Typography>
      <Grid container spacing={2}>
        {fuelPumps.map((pump, index) => {
          const reading = pumpReadings.find((r: any) => r.pump_id === pump.id) || {
            opening: 0,
            closing: 0
          };
          const difference = calculatePumpDifference(reading.opening, reading.closing);
          
          const openingError = !validateOpeningReading(reading.opening, reading.closing);
          const closingError = !validateClosingReading(reading.opening, reading.closing);

          // Find the actual product and store objects by comparing IDs
          const product = findProductById(pump.product_id);
          const store = findStoreById(pump.tank_id);

          // Get the names from the found objects
          const productName = product?.name || 'No Product';
          const tankName = store?.name || 'No Tank';

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
                        {tankName}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Divider after Pump Name and Tank Name row */}
                  <Divider sx={{ my: 1 }} />
                
                  {/* Product/Fuel Name */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2,
                      fontStyle: 'italic',
                    }}
                  >
                    {productName}
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
                        error={openingError}
                        helperText={openingError ? "Opening reading should not exceed closing reading" : ""}
                        inputProps={{ 
                          min: 0,
                          style: { textAlign: 'center' },
                          step: "any"
                        }}
                        sx={{
                          '& input[type=number]': {
                            MozAppearance: 'textfield',
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }
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
                        error={closingError}
                        helperText={closingError ? "Closing reading should exceed opening reading" : ""}
                        inputProps={{ 
                          min: 0,
                          style: { textAlign: 'center' },
                          step: "any"
                        }}
                        sx={{
                          '& input[type=number]': {
                            MozAppearance: 'textfield',
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }
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
                        fontWeight: 'normal'
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

      {/* Fuel Prices Section - Now below Pump Readings */}
      {uniqueProducts.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Fuel Prices
          </Typography>
          <Grid container spacing={2}>
            {uniqueProducts.map((product) => {
              const currentPrice = fuelPrices.find((fp: any) => fp.product_id === product.id)?.price || 0;
              
              return (
                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: 2,
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <TextField
                        fullWidth
                        label={product.name}
                        type="number"
                        value={currentPrice}
                        onChange={(e) => updateFuelPrice(product.id, parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ 
                          min: 0,
                          step: "0.01",
                          style: { textAlign: 'center' }
                        }}
                        sx={{
                          '& input[type=number]': {
                            MozAppearance: 'textfield',
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default PumpReadingTab;