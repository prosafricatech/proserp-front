import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { Button, Divider, FormControl, Grid, IconButton, InputLabel, LinearProgress, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from "yup";
import priceListServices from '../priceLists-services';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Product } from '@/components/productAndServices/products/ProductType';

interface PriceListItemFormProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  costInsights?: boolean;
  costCenterId?: number;
  storeId?: number;
  fuelPriceLists?: boolean;
  item?: any;
  index?: number;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  items?: any[];
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FormValues {
  product: any;
  price: number;
  bottom_cap: number;
  measurement_unit_id?: number;
  unit_symbol?: string;
  product_id?: number;
}

interface Unit {
  id: number;
  name: string;
  unit_symbol?: string;
}

const PriceListItemForm: React.FC<PriceListItemFormProps> = ({ 
  fuelPriceLists,
  setClearFormKey, 
  submitItemForm, 
  setSubmitItemForm, 
  setIsDirty, 
  costInsights, 
  costCenterId, 
  storeId, 
  item = null, 
  index = -1, 
  setItems, 
  items = [], 
  setShowForm = null 
}) => {
  const [productUnits, setProductUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<number | undefined>(item?.measurement_unit_id);
  const { productOptions } = useProductsSelect();
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [costAverage, setCostAverage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const validationSchema = yup.object({
    product: yup.object().required("Product is required").typeError('Product is required'),
    price: yup.number().required("Price is required").positive("Price is required").typeError('Price is required'),
    bottom_cap: yup.number().positive("Invalid bottom cap").typeError('Invalid bottom cap'),
  });

  const { 
    setValue, 
    handleSubmit, 
    reset, 
    control, 
    watch, 
    setError,
    clearErrors, 
    formState: { errors, dirtyFields } 
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      product: item && productOptions.find(product => product.id === item.product.id),
      price: item?.price || 0,
      bottom_cap: item?.bottom_cap || 0,
      measurement_unit_id: item?.measurement_unit_id,
      unit_symbol: item?.unit_symbol || item?.measurement_unit?.symbol,
    }
  });

  useEffect(() => {
    const subscription = watch(() => {
      const hasDirtyFields = Object.keys(dirtyFields).length > 0;
      setIsDirty(hasDirtyFields);
    });
    return () => subscription.unsubscribe();
  }, [watch, dirtyFields, setIsDirty]);

  const updateItems = async (itemData: FormValues) => {
    setIsAdding(true);
    
    try {
      if (index > -1) {
        const updatedItems = [...items];
        updatedItems[index] = itemData;
        await setItems(updatedItems);
      } else {
        await setItems(prevItems => [...prevItems, itemData]);
      }

      reset();
      setProductUnits([]);
      setCostAverage(0);
      setIsDirty(false);
      
      if (submitItemForm) {
        setSubmitItemForm(false);
        return true;
      }
      
      return false;
    } finally {
      setIsAdding(false);
      setShowForm?.(false);
    }
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, (errors) => {
        setSubmitItemForm(false);
        setIsDirty(false);
      })();
    }
  }, [submitItemForm]);

  useEffect(() => {
    if (item && item.product) {
      const itemProduct = productOptions.find(product => product.id === item.product.id);
      const units = [
        ...(itemProduct?.secondary_units || []),
        ...(itemProduct?.primary_unit ? [itemProduct.primary_unit] : [])
      ];
      setProductUnits(units);
      setSelectedUnit(item.measurement_unit_id);
    }
  }, [item, productOptions]);

  const getAvailableUnits = (units: Unit[], productId: number) => {
    const selectedUnits = items
      ?.filter(existingItem => existingItem.product.id === productId)
      .map(existingItem => existingItem.measurement_unit_id);

    return units?.filter(unit => !selectedUnits?.includes(unit.id));
  };

  const product = watch('product');
  const measurement_unit_id = watch('measurement_unit_id');

  const retrieveCostInsights = async () => {
    if (costCenterId && storeId && product && measurement_unit_id) {
      setIsRetrieving(true);
      try {
        const costInsights = await priceListServices.getCostInsights({
          cost_center_id: costCenterId,
          store_id: storeId,
          product_id: product.id, 
          measurement_unit_id: measurement_unit_id,
        });
        setCostAverage(costInsights);
      } catch (error) {
        console.error('Error retrieving cost insights:', error);
      } finally {
        setIsRetrieving(false);
      }
    }
  };

  useEffect(() => {
    retrieveCostInsights();
  }, [costCenterId, storeId, product, measurement_unit_id]);

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Divider />
      <Grid container columnSpacing={1} rowSpacing={1} mb={1} mt={1}>
        {!item && (
          <Grid size={12} textAlign={'center'}>
            <Typography variant='h5'>Add Item</Typography>
          </Grid>
        )}

        {costInsights && (
          <Grid size={12} textAlign={'center'}>
            {isRetrieving ? (
              <LinearProgress />
            ) : (
              <Typography variant='subtitle1' color={'error'}>
                Average Cost: {costAverage.toLocaleString()}
              </Typography>
            )}
          </Grid>
        )}

        <Grid size={{xs: 12, md: productUnits?.length > 0 ? (fuelPriceLists ? 5.5 : 3.5) : (fuelPriceLists ? 7 : 5) }}>
          <ProductSelect
            label='Product/Service'
            frontError={errors.product}
            defaultValue={item?.product}
            includeOnlyFuelProducts={fuelPriceLists ? true : false}
            onChange={(newValue: Product) => {
              if (newValue) {
                const allUnits = [
                  ...(newValue.secondary_units || []),
                  ...(newValue.primary_unit ? [newValue.primary_unit] : [])
                ];
                const availableUnits = getAvailableUnits(allUnits, newValue.id);

                if (availableUnits?.length < 1) {
                  return setError('product', {
                    type: 'manual',
                    message: 'No available unit for this product to add price. Please select a different product.',
                  });
                } else {
                  clearErrors('product');
                }

                setProductUnits(availableUnits);
                setSelectedUnit(availableUnits?.[0]?.id);
                
                setValue('product', newValue, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                
                if (costCenterId && storeId) {
                  retrieveCostInsights();
                }

                setValue('measurement_unit_id', availableUnits?.[0]?.id);
                setValue('unit_symbol', availableUnits?.[0]?.unit_symbol);
                setValue('product_id', newValue.id);
              } else {
                setProductUnits([]);
                setSelectedUnit(undefined);
                setValue('measurement_unit_id', undefined);
                setValue('unit_symbol', undefined);
                setValue('product', null);
                setValue('product_id', undefined);
              }
            }}
          />
        </Grid>
        
        {productUnits?.length > 0 && selectedUnit && (
          <Grid size={{xs: 12, md: 1.5}}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Controller
                name="measurement_unit_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={selectedUnit}
                    onChange={(e) => {
                      const value = e.target.value as number;
                      setSelectedUnit(value);
                      const selectedUnit = productUnits.find(unit => unit.id === value);
                      if (selectedUnit) {
                        setValue('measurement_unit_id', selectedUnit.id, { shouldValidate: true });
                        setValue('unit_symbol', selectedUnit.unit_symbol, { shouldValidate: true });
                      }
                    }}
                    size="small"
                    label="Unit"
                  >
                    {productUnits.map((unit) => (
                      <MenuItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
        )}

        <Grid size={{xs: 12, md: fuelPriceLists ? 4 : 3}}>
          <TextField
            label="Price"
            fullWidth
            size='small'
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            error={!!errors?.price}
            helperText={errors?.price?.message}
            defaultValue={item?.price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const sanitizedValue = sanitizedNumber(e.target.value);
              setValue('price', sanitizedValue || 0, {
                shouldValidate: true,
                shouldDirty: true
              });
              setValue('bottom_cap', sanitizedValue || 0, {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Grid>

        {
          !fuelPriceLists && (
            <Grid size={{xs: 12, md: 3}}>
              <TextField
                label="Bottom Cap"
                fullWidth
                size='small'
                InputProps={{
                inputComponent: CommaSeparatedField
              }}
              error={!!errors?.bottom_cap}
              helperText={errors?.bottom_cap?.message}
              value={watch('bottom_cap')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue('bottom_cap', e.target.value ? sanitizedNumber(e.target.value) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Grid>
        )}

        <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
          <Button
            variant='contained'
            size='small'
            type='submit'
            onClick={() => {
              setProductUnits([]);
              setCostAverage(0);
            }}            
          >
            {item ? (
              <>
                <CheckOutlined fontSize='small'/> Done
              </>
            ) : (
              <>
                <AddOutlined fontSize='small'/> Add
              </>
            )}
          </Button>
          
          {item && (
            <Tooltip title='Close Edit'>
              <IconButton 
                size='small'
                onClick={() => {
                  setShowForm?.(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </form>
  );
};

export default PriceListItemForm;