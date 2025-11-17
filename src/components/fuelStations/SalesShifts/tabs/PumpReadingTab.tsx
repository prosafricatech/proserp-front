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
import CommaSeparatedField from "@/shared/Inputs/CommaSeparatedField"; 
import { sanitizedNumber } from "@/app/helpers/input-sanitization-helpers"; 

interface PumpReadingTabProps {
  salesShift?: SalesShift;
  isClosing?: boolean;
}

interface StoreSummary {
  storeId: number;
  storeName: string;
  quantity: number;
  amount: number;
  productIds: number[];
}

const PumpReadingTab: React.FC<PumpReadingTabProps> = ({ salesShift, isClosing = false }) => {
  const { control, watch, setValue } = useFormContext();
  const { activeStation } = useSalesStation();
  const { productOptions } = useProductsSelect();
  
  // Fetch store options - SAME PATTERN AS PRODUCT FETCHING
  const { data: storeOptions, isLoading: isFetchingStores } = useQuery<StoreOption[], Error>({
    queryKey: ["storeOptions"],
    queryFn: () => storeServices.getStoreOptions(true),
  });

  const fuelPumps = activeStation?.fuel_pumps || [];

  // PRODUCT PATTERN: Get all products
  const allProducts = useMemo(() => {
    return productOptions || [];
  }, [productOptions]);

  // STORE PATTERN: Get all stores (same as products)
  const allStores = useMemo(() => {
    if (!storeOptions) return [];
    return storeOptions.filter((store) => {
      return store.id != null && typeof store.id === "number";
    });
  }, [storeOptions]);

  // PRODUCT PATTERN: Find product by ID
  const findProductById = (productId?: string | number | null): Product | undefined => {
    if (productId == null) return undefined;
    return allProducts.find(product => product.id === Number(productId));
  };
  
  // STORE PATTERN: Find store by ID (same as product)
  const findStoreById = (storeId?: string | number | null): StoreOption | undefined => {
    if (storeId == null) return undefined;
    return allStores.find(store => store.id === Number(storeId));
  };

  const { fields, update } = useFieldArray({
    control,
    name: "pump_readings"
  });

  const pumpReadings = watch("pump_readings") || [];
  const fuelPrices = watch("product_prices") || [];

  // Format number with commas
  const formatNumberWithCommas = (value: number): string => {
    return value.toLocaleString();
  };

  // Parse comma-separated number
  const parseCommaNumber = (value: string): number => {
    return sanitizedNumber(value) || 0;
  };

  const calculatePumpDifference = (opening: number, closing: number) => {
    return closing - opening;
  };

  // Handle comma-formatted input
  const updatePumpReading = (pumpIndex: number, field: 'opening' | 'closing', value: string) => {
    const numericValue = parseCommaNumber(value);
    update(pumpIndex, {
      ...pumpReadings[pumpIndex],
      [field]: numericValue
    });
  };

  // Handle comma-formatted input for prices
  const updateFuelPrice = (productId: string | number, value: string) => {
    const numericValue = parseCommaNumber(value);
    const existingPriceIndex = fuelPrices.findIndex((fp: any) => fp.product_id === productId);
    
    if (existingPriceIndex >= 0) {
      const updatedPrices = [...fuelPrices];
      updatedPrices[existingPriceIndex] = {
        ...updatedPrices[existingPriceIndex],
        price: numericValue
      };
      setValue("product_prices", updatedPrices);
    } else {
      setValue("product_prices", [
        ...fuelPrices,
        {
          product_id: productId,
          price: numericValue
        }
      ]);
    }
  };

  // PRODUCT PATTERN: Get unique products from fuel pumps
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

  // STORE PATTERN: Get unique stores from fuel pumps (same as products)
  const uniqueStores = useMemo(() => {
    const storeMap = new Map();
    fuelPumps.forEach(pump => {
      const store = findStoreById(pump.tank_id);
      if (store && !storeMap.has(store.id)) {
        storeMap.set(store.id, store);
      }
    });
    return Array.from(storeMap.values());
  }, [fuelPumps, allStores]);

  // STORE PATTERN: Calculate store summary (consistent with product logic)
  const storeSummary = useMemo((): StoreSummary[] => {
    const storeMap = new Map<number, StoreSummary>();

    // Initialize store summaries
    uniqueStores.forEach(store => {
      storeMap.set(store.id, {
        storeId: store.id,
        storeName: store.name,
        quantity: 0,
        amount: 0,
        productIds: []
      });
    });

    // Calculate quantities and amounts
    fuelPumps.forEach((pump) => {
      if (!pump.tank_id) return;

      const storeId = pump.tank_id;
      const reading = pumpReadings.find((r: any) => r.pump_id === pump.id) || {
        opening: 0,
        closing: 0
      };

      const pumpDifference = calculatePumpDifference(reading.opening || 0, reading.closing || 0);
      
      const storeSummary = storeMap.get(storeId);
      if (storeSummary) {
        storeSummary.quantity += pumpDifference;

        // Track associated products
        if (pump.product_id && !storeSummary.productIds.includes(pump.product_id)) {
          storeSummary.productIds.push(pump.product_id);
        }
      }
    });

    // Calculate amounts based on fuel prices
    const summaries = Array.from(storeMap.values());
    summaries.forEach(summary => {
      if (summary.productIds.length > 0) {
        // Use the first product's price for calculation
        const firstProductId = summary.productIds[0];
        const fuelPrice = fuelPrices.find((fp: any) => fp.product_id === firstProductId);
        const price = fuelPrice?.price ? parseFloat(String(fuelPrice.price)) : 0;
        summary.amount = summary.quantity * price;
      }
    });

    return summaries;
  }, [pumpReadings, fuelPrices, fuelPumps, uniqueStores]);

  const validateOpeningReading = (opening: number, closing: number) => {
    return opening <= closing;
  };

  const validateClosingReading = (opening: number, closing: number) => {
    return closing >= opening;
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
          
          const openingError = !validateOpeningReading(reading.opening, reading.closing);
          const closingError = !validateClosingReading(reading.opening, reading.closing);

          // PRODUCT PATTERN: Find product
          const product = findProductById(pump.product_id);
          // STORE PATTERN: Find store (same as product)
          const store = findStoreById(pump.tank_id);

          const productName = product?.name || 'Unknown Product';
          const tankName = store?.name || 'Unknown Tank';

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
                  {/* Header with Pump Name and Tank Name */}
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
                        sx={{ 
                          textAlign: 'right',
                          color: 'text.secondary'
                        }}
                      >
                        {tankName}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1 }} />
                
                  {/* Product Name - CONSISTENT STYLING */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2,
                      fontStyle: 'italic',
                      color: 'text.secondary'
                    }}
                  >
                    {productName}
                  </Typography>

                  {/* Readings Inputs */}
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Closing Reading"
                        value={formatNumberWithCommas(reading.closing)} 
                        onChange={(e) => updatePumpReading(index, 'closing', e.target.value)} 
                        size="small"
                        error={closingError}
                        helperText={closingError ? "Closing reading should exceed opening reading" : ""}
                        InputProps={{ inputComponent: CommaSeparatedField as any }}
                        sx={{
                          '& input': {
                            textAlign: 'left',
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Opening Reading"
                        value={formatNumberWithCommas(reading.opening)}
                        onChange={(e) => updatePumpReading(index, 'opening', e.target.value)}
                        size="small"
                        error={openingError}
                        helperText={openingError ? "Opening reading should not exceed closing reading" : ""}
                        InputProps={{ inputComponent: CommaSeparatedField as any }}
                        sx={{
                          '& input': {
                            textAlign: 'left',
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Pump Difference Display */}
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
                      Pump Difference: {formatNumberWithCommas(difference)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Fuel Prices Section - PRODUCT FOCUSED */}
      {uniqueProducts.length > 0 && (
        <Box sx={{ mt: 4 }}>
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
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 1,
                          textAlign: 'center',
                          color: 'text.secondary'
                        }}
                      >
                        {product.name}
                      </Typography>
                      <TextField
                        fullWidth
                        label="Price"
                        value={formatNumberWithCommas(Number(currentPrice))}
                        onChange={(e) => updateFuelPrice(product.id, e.target.value)}
                        size="small"
                        InputProps={{ inputComponent: CommaSeparatedField as any }}
                        sx={{
                          '& input': {
                            textAlign: 'center',
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

      {/* Tank Summary Section - STORE FOCUSED (SAME PATTERN AS PRODUCTS) */}
      {storeSummary.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Tank Summary
          </Typography>
          <Grid container spacing={2}>
            {storeSummary.map((store) => (
              <Grid key={store.storeId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
                    {/* Store/Tank Name Header */}
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        mb: 2
                      }}
                    >
                      {store.storeName}
                    </Typography>
                    <Divider/>

                    {/* Quantity Display - CONSISTENT WITH PRODUCT STYLING */}
                    <Grid container alignItems="center" spacing={1} sx={{ mb: 2, mt: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'normal',
                            color: 'text.primary'
                          }}
                        >
                          Quantity
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box 
                          sx={{ 
                            p: 1,
                            backgroundColor: 'grey.50',
                            borderRadius: 1,
                            textAlign: 'center'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 'normal',
                              color: 'text.primary'
                            }}
                          >
                            {formatNumberWithCommas(store.quantity)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Amount Display - CONSISTENT WITH PRODUCT STYLING */}
                    <Grid container alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Grid size={{ xs: 6 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'normal',
                            color: 'text.primary'
                          }}
                        >
                          Amount
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box 
                          sx={{ 
                            p: 1,
                            backgroundColor: 'grey.50',
                            borderRadius: 1,
                            textAlign: 'center'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 'normal',
                              color: 'text.primary'
                            }}
                          >
                            {formatNumberWithCommas(store.amount)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default PumpReadingTab;