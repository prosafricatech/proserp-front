'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { RFQItem } from '../rfq-types';

interface RFQItemFormProps {
  setClearFormKey?: React.Dispatch<React.SetStateAction<number>>;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  items?: any[];
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
  item?: RFQItem | null;
  index?: number;
}

interface Unit {
  id: number;
  name?: string;
  unit_symbol?: string;
}

interface ProductWithUnits {
  id: number;
  name?: string;
  item_name?: string;
  measurement_unit_id?: number;
  primary_unit?: Unit;
  measurement_unit?: {
    id: number;
    name?: string;
    symbol?: string;
    unit_symbol?: string;
  };
  secondary_units?: Unit[];
}

interface FormValues {
  product: any;
  quantity: number;
  remarks: string;
  product_id?: number;
  measurement_unit_id?: number;
  unit_symbol?: string;
}

const validationSchema = yup.object({
  product: yup.object().required('Product is required').typeError('Product is required'),
  quantity: yup.number().required('Quantity is required').positive('Quantity is required').typeError('Quantity is required'),
  remarks: yup.string().nullable(),
});

const RFQItemForm: React.FC<RFQItemFormProps> = ({
  setClearFormKey,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  setItems,
  items = [],
  setShowForm = null,
  item = null,
  index = -1,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [productUnits, setProductUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<number | undefined>(item?.measurement_unit_id);
  const [resetKey, setResetKey] = useState(0);
  const isEditing = index !== -1 && !!item;

  // Create a product object with proper structure for editing
  const getDefaultProduct = () => {
    const product = item?.product as ProductWithUnits | undefined;
    if (!product) return undefined;
    
    // If the product already has primary_unit and secondary_units, use it as is
    if (product.primary_unit || product.secondary_units) {
      return product;
    }
    
    // Otherwise, construct a product object with the available data
    const measurementUnit = item?.measurement_unit;
    return {
      ...product,
      primary_unit: measurementUnit ? {
        id: measurementUnit.id,
        name: measurementUnit.name,
        unit_symbol: measurementUnit.symbol,
      } : undefined,
      secondary_units: [],
    };
  };

  const defaultProduct = getDefaultProduct();

  const {
    setValue,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      product: defaultProduct || undefined,
      quantity: item?.quantity || 0,
      remarks: item?.remarks || '',
      product_id: item?.product_id || item?.product?.id,
      measurement_unit_id: item?.measurement_unit_id || item?.measurement_unit?.id,
      unit_symbol: item?.unit_symbol || item?.measurement_unit?.symbol,
    },
  });

  // Initialize units when editing
  useEffect(() => {
    if (isEditing && item) {
      const measurementUnit = item.measurement_unit;
      const productObj = (item.product || {}) as ProductWithUnits;
      
      const allUnits = [
        ...(productObj.secondary_units || []),
        ...(measurementUnit ? [{
          id: measurementUnit.id,
          name: measurementUnit.name,
          unit_symbol: measurementUnit.symbol,
        }] : []),
        ...(productObj.primary_unit ? [productObj.primary_unit] : []),
      ];

      if (allUnits.length > 0) {
        // Remove duplicates based on id
        const uniqueUnits = allUnits.filter((unit, index, self) => 
          index === self.findIndex(u => u.id === unit.id)
        );
        setProductUnits(uniqueUnits);
        
        // Set the selected unit to the item's measurement unit
        const unitId = item.measurement_unit_id || item.measurement_unit?.id;
        if (unitId) {
          setSelectedUnit(unitId);
        }
      }
    }
  }, [isEditing, item]);

  useEffect(() => {
    const subscription = watch(() => {
      const hasDirtyFields = Object.keys(dirtyFields).length > 0;
      setIsDirty(hasDirtyFields);
    });
    return () => subscription.unsubscribe();
  }, [watch, dirtyFields, setIsDirty]);

  const updateItems = async (formData: FormValues) => {
    setIsAdding(true);

    try {
      const selectedUnitData = productUnits.find(unit => unit.id === formData.measurement_unit_id);
      
      const itemData = {
        product: formData.product,
        product_id: formData.product?.id,
        measurement_unit_id: formData.measurement_unit_id,
        quantity: Number.isFinite(Number(formData.quantity)) ? Number(formData.quantity) : 0,
        remarks: formData.remarks || '',
        unit_symbol: selectedUnitData?.unit_symbol || '',
        measurement_unit: selectedUnitData,
      };

      if (isEditing) {
        // Update existing item
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], ...itemData };
        setItems(updatedItems);
        // Close the edit form
        setShowForm?.(false);
      } else {
        // Add new item
        setItems((prevItems) => [...prevItems, itemData]);
        // Reset form for new item
        reset({
          product: undefined,
          quantity: 0,
          remarks: '',
          product_id: undefined,
          measurement_unit_id: undefined,
          unit_symbol: undefined,
        });
        setProductUnits([]);
        setSelectedUnit(undefined);
        setResetKey(prev => prev + 1);
        if (setClearFormKey) {
          setClearFormKey(prev => prev + 1);
        }
      }

      setIsDirty(false);

      if (submitItemForm) {
        setSubmitItemForm(false);
      }

      return true;
    } catch (error) {
      console.error('Error updating items:', error);
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false);
        setIsDirty(false);
      })();
    }
  }, [submitItemForm]);

  // Get available units for the selected product
  const getAvailableUnits = (units: Unit[], productId: number) => {
    // Filter out units already used by other items (except when editing the current item)
    const selectedUnits = items
      ?.filter((existingItem, idx) => {
        // If editing, exclude current item from validation
        if (isEditing && idx === index) return false;
        return existingItem.product?.id === productId;
      })
      .map(existingItem => existingItem.measurement_unit_id);

    return units?.filter(unit => !selectedUnits?.includes(unit.id));
  };

  // Watch for product changes to update available units
  const product = watch('product');

  useEffect(() => {
    if (product) {
      const selectedProduct = product as ProductWithUnits;
      const allUnits = [
        ...(selectedProduct.secondary_units || []),
        ...(selectedProduct.primary_unit ? [selectedProduct.primary_unit] : [])
      ];
      
      const availableUnits = getAvailableUnits(allUnits, selectedProduct.id);
      
      if (availableUnits?.length < 1) {
        setProductUnits([]);
        setSelectedUnit(undefined);
        setValue('measurement_unit_id', undefined);
        setValue('unit_symbol', undefined);
        return;
      }

      setProductUnits(availableUnits);
      
      // For editing, try to keep the selected unit if it's available
      const currentSelectedUnit = selectedUnit;
      const unitExists = availableUnits.some(unit => unit.id === currentSelectedUnit);
      
      if (unitExists && currentSelectedUnit) {
        setSelectedUnit(currentSelectedUnit);
        setValue('measurement_unit_id', currentSelectedUnit);
        const unitData = availableUnits.find(unit => unit.id === currentSelectedUnit);
        setValue('unit_symbol', unitData?.unit_symbol);
      } else {
        // Set the first available unit as default
        const defaultUnit = availableUnits[0];
        setSelectedUnit(defaultUnit.id);
        setValue('measurement_unit_id', defaultUnit.id);
        setValue('unit_symbol', defaultUnit.unit_symbol);
      }
    } else {
      setProductUnits([]);
      setSelectedUnit(undefined);
    }
  }, [product, items, index, isEditing]);

  // Reset form when item changes (for editing)
  useEffect(() => {
    if (item && isEditing) {
      const defaultProduct = getDefaultProduct();
      
      reset({
        product: defaultProduct || undefined,
        quantity: item.quantity || 0,
        remarks: item.remarks || '',
        product_id: item.product_id || item.product?.id,
        measurement_unit_id: item.measurement_unit_id || item.measurement_unit?.id,
        unit_symbol: item.unit_symbol || item.measurement_unit?.symbol,
      });
      
      const unitId = item.measurement_unit_id || item.measurement_unit?.id;
      if (unitId) {
        setSelectedUnit(unitId);
      }
    }
  }, [item, reset, isEditing]);

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)} key={resetKey}>
      <Divider />
      <Grid container columnSpacing={1} rowSpacing={1} mb={1} mt={1}>
        {!isEditing && (
          <Grid size={12} textAlign={'center'}>
            <Typography variant='h5'>Add RFQ Item</Typography>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: productUnits?.length > 0 ? 4 : 5 }}>
          <ProductSelect
            key={`product-select-${resetKey}`}
            label='Product'
            frontError={errors.product}
            defaultValue={defaultProduct}
            onChange={(newValue: any) => {
              if (newValue) {
                setValue('product', newValue, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue('product_id', newValue.id);
              } else {
                setValue('product', null);
                setValue('product_id', undefined);
                setValue('measurement_unit_id', undefined);
                setValue('unit_symbol', undefined);
                setProductUnits([]);
                setSelectedUnit(undefined);
              }
            }}
          />
        </Grid>

        {productUnits?.length > 0 && selectedUnit && (
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size='small'>
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
                      const selectedUnitData = productUnits.find(unit => unit.id === value);
                      if (selectedUnitData) {
                        setValue('measurement_unit_id', selectedUnitData.id, { 
                          shouldValidate: true,
                          shouldDirty: true 
                        });
                        setValue('unit_symbol', selectedUnitData.unit_symbol, { 
                          shouldValidate: true,
                          shouldDirty: true 
                        });
                      }
                    }}
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

        <Grid size={{ xs: 6, md: productUnits?.length > 0 ? 2 : 3 }}>
          <TextField
            label="Quantity"
            fullWidth
            size='small'
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            error={!!errors?.quantity}
            helperText={errors?.quantity?.message}
            value={watch('quantity') || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value ? sanitizedNumber(e.target.value) : '';
              setValue('quantity', Number.isFinite(value) ? value : '', {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Grid>

        <Grid size={{ xs: 10, md: 3 }}>
          <TextField
            label="Remarks"
            fullWidth
            size='small'
            value={watch('remarks') || ''}
            onChange={(e) => setValue('remarks', e.target.value, {
              shouldDirty: true,
            })}
          />
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <Button
            variant='contained'
            size='small'
            type='submit'
          >
            {isEditing ? (
              <>
                <CheckOutlined fontSize='small' /> Update
              </>
            ) : (
              <>
                <AddOutlined fontSize='small' /> Add
              </>
            )}
          </Button>

          {isEditing && (
            <Tooltip title='Cancel Edit'>
              <IconButton
                size='small'
                onClick={() => {
                  setShowForm?.(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </form>
  );
};

export default RFQItemForm;