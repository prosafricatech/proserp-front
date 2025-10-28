import { Button, FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { ProductionBatchesContext } from '../ProductionBatchesList';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

function OutputsItemForm({setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, setIsDirty, item = null, index = -1, setOutputs, outputs = [], setShowForm = null}) {
  const { productOptions } = useProductsSelect();
  const { activeWorkCenter } = useContext(ProductionBatchesContext);
  const nonInventoryIds = productOptions?.filter(product => product.type !== 'Inventory').map(product => product.id);
  const [selectedUnit, setSelectedUnit] = useState(item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit.id));

  const validationSchema = yup.object({
    product_id: yup
      .number()
      .required("Product is required")
      .typeError("Product is required")
      .test(
        'unique-product',
        'Product already exists',
        (value) => {
          // Exclude the current product being edited
          const isEditing = index > -1 && outputs[index]?.product_id === value;
          const isDuplicate = outputs.some((output) => output.product_id === value);
          return isEditing || !isDuplicate;
        }
      ),
    store_id: yup.number().required("Store is required").typeError('Store is required'),
    quantity: yup.number().required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
    measurement_unit_id: yup.number().required("Measurement Unit is required").typeError('Measurement Unit is required'),
    value_percentage: yup
    .number()
    .min(0, 'Value Percentage must be greater or equal to 0')
    .max(100, "Value Percentage must be less than or equal to 100")
    .required("Value Percentage is required")
    .typeError('Value Percentage is required')
    .test('sum-check', function (value) {
      const context = this.options.context || {};
      const { outputs, item } = context;
  
      if (!outputs) return true;
  
      // Calculate total percentage before adding the current value, excluding the edited item
      const totalBeforeValue = outputs.reduce(
        (total, it) => total + (item && it === item ? 0 : it.value_percentage), // Compare the whole object if no id exists
        0
      );
  
      // Check if the new total exceeds 100%
      if ((totalBeforeValue + value) > 100) {
        return this.createError({
          message: `Total Value Percentage cannot exceed 100%. Current Outputs are already ${totalBeforeValue}%`,
        });
      }
      return true;
    }),  
  });

  const {setValue, handleSubmit, register, watch, reset, formState: {errors, dirtyFields}} = useForm({
    resolver: yupResolver(validationSchema),
    context: { outputs, item },
    defaultValues: {
      product: item && productOptions.find(product => product.id === (item.product_id || item.product.id)),
      product_id: item && item.product_id,
      store: item && item.store,
      store_id: item && (item.store_id || item.store.id),
      quantity: item && item.quantity,
      value_percentage: item && item.value_percentage,
      rate: item && item.rate,
      remarks: item && item.remarks,
      measurement_unit_id: item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit.id),
      conversion_factor: item ? item.conversion_factor : 1,
      unit_symbol: item && (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.unit_symbol),
    }
  });

  useEffect(() => {
      const subscription = watch(() => {
          const hasDirtyFields = Object.keys(dirtyFields).length > 0;
          setIsDirty(hasDirtyFields);
      });
      return () => subscription.unsubscribe();
  }, [watch, dirtyFields, setIsDirty, item]);

  const store_id = watch('store_id');

  const [isAdding, setIsAdding] = useState(false);

  const updateItems = async (item) => {
    setIsAdding(true);
    if (index > -1) {
      // Replace the existing item with the edited item
      let updatedItems = [...outputs];
      updatedItems[index] = item;
      await setOutputs(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      // Add the new item to the items array
      await setOutputs((items) => [...items, item]);
      if (!!submitItemForm) {
        submitMainForm()
        setClearFormKey(prevKey => prevKey + 1);
      }
      setSubmitItemForm(false)
    }

    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false); // Reset submitItemForm if there are errors
      })();
    }
  }, [submitItemForm]);

  if(isAdding){
    return <LinearProgress/>
  }

  const product = watch('product');

  const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
      <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
        <Grid size={{xs: 12, md: 4}}>
          <ProductSelect
            label='Product'
            frontError={errors.product_id}
            defaultValue={item && item.product}
            excludeIds={nonInventoryIds}
            onChange={async(newValue) => {
              if (newValue) {
                setValue(`product_id`, newValue?.id, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                setSelectedUnit(newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id)
                setValue('measurement_unit_id', newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id);
                setValue('unit_symbol', newValue.primary_unit ? newValue?.primary_unit?.unit_symbol : newValue?.measurement_unit.symbol)
                setValue(`product`,newValue);
                setValue(`store_id`, store_id, {
                  shouldDirty: true,
                  shouldValidate: true
                });
              } else {
                setValue(`product_id`, null, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                setValue(`store_id`, store_id, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                setSelectedUnit(null)
                setValue('measurement_unit_id', null);
                setValue('unit_symbol', null)
                setValue(`product`,null);
              }
            }}
          />
        </Grid>
        <Grid size={{xs: 12, md: 4}}>
          <StoreSelector
            allowSubStores={true}
            proposedOptions={activeWorkCenter.stores}
            defaultValue={item && item.store}
            frontError={errors.store_id}
            onChange={(newValue) => {
              setValue(`store`, newValue);
              setValue(`store_id`, newValue && newValue.id, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Grid>
        <Grid size={{xs: 12, md: 4}}>
          <TextField
            label="Quantity"
            fullWidth
            size='small'
            defaultValue={item && item.quantity}
            InputProps={{ 
              inputComponent: CommaSeparatedField,
              endAdornment: (
                !!product && !!selectedUnit &&
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl fullWidth>
                      <Select
                        value={!!selectedUnit && selectedUnit}
                        onChange={async(e) => {
                          setSelectedUnit(e.target.value)
                          const selectedUnitId = e.target.value;
                          const selectedUnit = combinedUnits?.find(unit => unit.id === selectedUnitId);
                          if (selectedUnit) {
                            await setValue('measurement_unit_id', selectedUnit.id);
                            setValue('unit_symbol', selectedUnit?.unit_symbol);
                            await setValue(`conversion_factor`, selectedUnit.conversion_factor);
                          }
                        }}
                        variant="standard"
                        size="small"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              borderRadius: 0, 
                            },
                          },
                        }}
                      >
                        {product?.primary_unit ? (
                          combinedUnits?.map((unit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              {unit.unit_symbol}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem key={product.measurement_unit?.id} value={product.measurement_unit?.id}>
                            {product.measurement_unit.symbol}
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </div>
              ),
            }}
            error={!!errors?.quantity}
            helperText={errors?.quantity?.message}
            onChange={(e) => {
              setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Grid>
        <Grid size={{xs: 12, md: 4}}>
          <TextField
            size="small"
            fullWidth
            defaultValue={item && item.value_percentage}
            error={errors && !!errors?.value_percentage}
            helperText={errors && errors.value_percentage?.message}
            label="Value Percentage"
            InputProps={{
              inputComponent: CommaSeparatedField,
              endAdornment: <span>%</span>
            }}
            onChange={(e) => {
              setValue(`value_percentage`,e.target.value ? sanitizedNumber(e.target.value) : null,{
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Grid>
        <Grid size={{xs: 12, md: 7}}>
          <TextField
            label="Remarks"
            fullWidth
            size="small"
            {...register('remarks')}
          />
        </Grid>
        <Grid size={{xs: 12, md: 1}} textAlign={'end'} mb={1}>
          <Button
            variant='contained'
            size='small'
            type='submit'                        
          >
            {
              item ? (
                <><CheckOutlined fontSize='small' /> Done</>
              ) : (
                <><AddOutlined fontSize='small' /> Add</>
              )
            }
          </Button>
          {
            item && 
            <Tooltip title='Close Edit'>
              <IconButton size='small' 
                onClick={() => {
                  setShowForm(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success'/>
              </IconButton>
            </Tooltip>
          }
        </Grid>
      </Grid>
    </form>
  )
}

export default OutputsItemForm