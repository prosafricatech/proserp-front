"use client";

import React, { useMemo, useState } from "react";
import { Grid, TextField, Button, IconButton, Tooltip, Box } from "@mui/material";
import { Add, Delete, AddOutlined } from "@mui/icons-material";
import { useFieldArray, Controller, useFormContext } from "react-hook-form";
import * as yup from "yup";
import StoreSelector from "@/components/procurement/stores/StoreSelector";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { PERMISSIONS } from "@/utilities/constants/permissions";
import { Station } from "./StationType";
import ProductSelect from "@/components/productAndServices/products/ProductSelect";
import { useProductsSelect } from "@/components/productAndServices/products/ProductsSelectProvider";
import { Product } from "@/components/productAndServices/products/ProductType";
import { useQuery } from "@tanstack/react-query";
import storeServices from "@/components/procurement/stores/store-services";
import { StoreOption } from "@/components/procurement/stores/storeTypes";

interface FuelPumpTabProps {
  station?: Station;
}

// Validation schema for fuel pumps
export const fuelPumpSchema = yup.object({
  fuel_pumps: yup
    .array()
    .of(
      yup.object({
        product_id: yup.number().nullable().required("Fuel name is required"),
        name: yup.string().required("Pump name is required"),
        tank_id: yup.number().nullable().required("Tank name is required"),
      })
    )
    .min(1, "At least one fuel pump is required"),
});

const FuelPumpTab: React.FC<FuelPumpTabProps> = ({ station }) => {
  const { setValue, control, formState: { errors }, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fuel_pumps",
  });
  const { checkOrganizationPermission } = useJumboAuth();
  const { productOptions } = useProductsSelect();
  const canCreateProduct = checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE]);
  const [openProductQuickAdd, setOpenProductQuickAdd] = useState<boolean[]>([]);

  // Fetch store options with proper typing
  const { data: storeOptions, isLoading: isFetchingStores } = useQuery<StoreOption[], Error>({
    queryKey: ["storeOptions"],
    queryFn: () => storeServices.getStoreOptions(true), // Pass mainOnly: true
  });

  // Filter out invalid store options
  const validStoreOptions = useMemo(() => {
    if (!storeOptions) return [];
    return storeOptions.filter((store) => {
      if (
        store.name == null ||
        typeof store.name !== "string" ||
        store.name.trim() === ""
      ) {
        return false;
      }
      return true;
    });
  }, [storeOptions]);

  // Compute nonInventoryIds safely
  const nonInventoryIds = useMemo(() => {
    if (!productOptions) return [];
    return productOptions
      .filter((product) => product.type !== "Inventory")
      .map((product) => product.id);
  }, [productOptions]);

  // Type-safe error access
  const getFieldError = (index: number, fieldName: string) => {
    return (errors as any)?.fuel_pumps?.[index]?.[fieldName];
  };

  if (isFetchingStores) {
    return <div>Loading store options...</div>;
  }

  if (!productOptions) {
    return <div>Loading product options...</div>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      {fields.map((field, index) => (
        <Grid container spacing={1} key={field.id} sx={{ mb: 2 }} alignItems="flex-start">
          {/* Fuel Name - 4 columns */}
          <Grid size={{ xs: 12, md: 3.5 }}>
            <Controller
              name={`fuel_pumps.${index}.product_id`}
              control={control}
              render={({ field: controllerField }) => {
                // Get the current product ID from form state for this specific field
                const currentProductId = watch(`fuel_pumps.${index}.product_id`);
                const productValue = productOptions.find(product => product.id === currentProductId) || null;
                
                return (
                  <ProductSelect
                    label="Fuel Name"
                    frontError={getFieldError(index, "product_id")}
                    addedProduct={null}
                    defaultValue={productValue}
                    excludeIds={nonInventoryIds}
                    onChange={async (newValue: Product | null) => {
                      if (newValue) {
                        // Only update the current field's data
                        setValue(`fuel_pumps.${index}.product_name`, newValue.name);
                        controllerField.onChange(newValue.id);
                      } else {
                        controllerField.onChange(null);
                        setValue(`fuel_pumps.${index}.product_name`, "");
                      }
                    }}
                    startAdornment={
                      canCreateProduct && (
                        <Tooltip title="Add New Fuel Product">
                          <AddOutlined
                            onClick={() => {
                              const newOpen = [...openProductQuickAdd];
                              newOpen[index] = true;
                              setOpenProductQuickAdd(newOpen);
                            }}
                            sx={{ cursor: "pointer" }}
                          />
                        </Tooltip>
                      )
                    }
                  />
                );
              }}
            />
          </Grid>

          {/* Pump Name - 4 columns */}
          <Grid size={{ xs: 12, md: 3.5 }}>
            <Controller
              name={`fuel_pumps.${index}.name`}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Pump Name"
                  size="small"
                  error={!!getFieldError(index, "name")}
                  helperText={getFieldError(index, "name")?.message}
                />
              )}
            />
          </Grid>

          {/* Tank Name - 3 columns */}
          <Grid size={{ xs: 11, md: 3.5 }}>
            <Controller
              name={`fuel_pumps.${index}.tank_id`}
              control={control}
              render={({ field }) => {
                // Find valid default store
                const selectedStore = validStoreOptions.find(
                  (store) => store.id === field.value && store.name && typeof store.name === "string" && store.name.trim() !== ""
                ) || null;
                
                return (
                 <StoreSelector
                  label="Tank Name"
                  defaultValue={selectedStore}
                  frontError={getFieldError(index, "tank_id")}
                  onChange={(newValue: StoreOption | null) => {
                    if (newValue) {
                      field.onChange(newValue.id);
                    } else {
                      field.onChange(null);
                    }
                  }}
                />
                );
              }}
            />
          </Grid>

          {/* Delete Button - 1 column */}
          <Grid size={{ xs: 1, md: 1.5 }} sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            {fields.length > 1 && (
              <IconButton
                onClick={() => remove(index)}
                color="error"
                sx={{ mt: 0.5 }}
              >
                <Delete />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ))}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => append({ product_id: null, name: "", tank_id: null })}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default FuelPumpTab;