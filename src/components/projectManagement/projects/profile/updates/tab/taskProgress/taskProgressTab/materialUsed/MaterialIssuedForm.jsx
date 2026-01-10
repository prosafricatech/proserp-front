import { FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useUpdateFormContext } from '../../../../UpdatesForm';
import { useProjectProfile } from '../../../../../ProjectProfileProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import productServices from '@/components/productAndServices/products/productServices';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

function MaterialIssuedForm({projectTaskIndex, taskProgressItem, material = null, index = -1, setShowForm = null, MaterialIssued=[], setMaterialIssued}) {
  const { project} = useProjectProfile();
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(material?.measurement_unit_id);
  const { productOptions } = useProductsSelect();
  const { taskProgressItems, setTaskProgressItems} = useUpdateFormContext();
  const nonInventoryIds = productOptions.filter(product => product.type !== 'Inventory').map(product => product.id);

  // FIXED: Use proper when() syntax with functions
  const validationSchema = yup.object({
    product: yup.object().required("Product is required").typeError('Product is required'),
    quantity: yup
      .number()
      .transform((value) => (isNaN(value) ? undefined : value))
      .when('product', (product, schema) => {
        if (product && product.type === 'Inventory') {
          return schema
            .required("Quantity is required")
            .positive("Quantity must be a positive number")
            .typeError('Quantity is required')
            .test('quantity-balance', 'This quantity will lead to negative balance', function(value) {
              const currentBalance = parseFloat(this.parent.current_balance);
              const availableBalance = parseFloat(this.parent.available_balance);
              
              if (isNaN(currentBalance) || isNaN(availableBalance)) {
                return true; // Skip validation if balances aren't available
              }
              
              return !isNaN(value) && value <= currentBalance;
            })
            .test('quantity-exceeded', 'The quantity exceeds the balance', function(value) {
              const availableBalance = parseFloat(this.parent.available_balance);
              
              if (availableBalance === 'N/A' || isNaN(availableBalance)) {
                return true; // Skip validation if balance is not available
              }
              
              return !isNaN(value) && value <= availableBalance;
            });
        }
        return schema
          .positive("Quantity must be a positive number")
          .typeError('Quantity is required');
      }),
  });

  const {setValue, handleSubmit, register, watch, clearErrors, reset, formState: {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      product: material && productOptions.find(product => product.id === material.product?.id),
      available_balance: 'N/A',
      projectTaskIndex: material?.projectTaskIndex,
      store_id: material?.store?.id,
      store: material?.store,
      quantity: material ? material.quantity : null,
      conversion_factor: material ? material.conversion_factor : 1,
      measurement_unit_id: material && (material.measurement_unit_id || material.measurement_unit?.id),
      unit_symbol: material && (material.measurement_unit?.symbol ? material.measurement_unit?.symbol : material.unit_symbol),
    }
  });

  const product = watch('product');
  const measurement_unit_id = watch('measurement_unit_id');
  const store_id = watch('store_id');

  const [isAdding, setIsAdding] = useState(false);
  
  const updateItems = async (item) => {
    setIsAdding(true);
    
    if (index > -1) {
      let updatedItems = [...MaterialIssued];
      updatedItems[index] = item;
      await setMaterialIssued(updatedItems);
    } else {
      await setMaterialIssued((items) => [...items, item]);
    }
  
    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };  

  useEffect(() => {
    setTaskProgressItems((prevItems) => {
      return prevItems.map((taskItem, taskIndex) => {
        if (taskIndex === projectTaskIndex) {
          return { ...taskItem, material_used: [...MaterialIssued] };
        }
        return taskItem;
      });
    });
  }, [MaterialIssued, projectTaskIndex, setTaskProgressItems]);

  const combinedUnits = product?.secondary_units?.concat(product?.primary_unit) || [];

  const retrieveBalances = async (storeId = null, product, measurement_unit_id) => {
    if (!!product && !!storeId && !isRetrieving) { 
      setIsRetrieving(true);
  
      try {
        const balances = await productServices.getStoreBalances({
          as_at: taskProgressItem?.execution_date || material?.execution_date,
          productId: product.id,
          storeIds: [storeId],
          costCenterId: project?.cost_center?.id,
          measurement_unit_id: measurement_unit_id
        });
  
        if (balances) {
          const pickedUnit = combinedUnits?.find(unit => unit.id === measurement_unit_id);
          const allMaterialIssued = taskProgressItems?.flatMap(task => task.material_used) || [];

          const existingItems = allMaterialIssued?.filter((existingItem, itemIndex) => {
            return existingItem?.store?.id === storeId 
              && existingItem?.product?.id === product?.id 
              && itemIndex !== index
              && !material?.id;
          });

          const existingQuantity = existingItems.reduce((total, existingItem) => {
            const itemUnitFactor = combinedUnits.find(unit => unit.id === existingItem?.measurement_unit_id)?.conversion_factor || 1;
            const pickedUnitFactor = pickedUnit?.conversion_factor || 1;
            const primaryUnitId = product?.primary_unit?.id;
  
            const conversionFactor = pickedUnit?.id === primaryUnitId
              ? (existingItem?.measurement_unit_id !== primaryUnitId ? 1 / itemUnitFactor : 1)
              : (existingItem?.measurement_unit_id === primaryUnitId ? pickedUnitFactor : pickedUnitFactor / itemUnitFactor);
  
            return total + (existingItem.quantity * conversionFactor);
          }, 0);
  
          const balance = balances?.stock_balances?.find(storeBalance => storeBalance.cost_center_id === project?.cost_center?.id)?.balance;
          const currentBalance = balances?.stock_balances?.find(storeBalance => storeBalance.cost_center_id === project?.cost_center?.id)?.current_balance;
  
          const updatedBalance = parseFloat((balance - existingQuantity).toFixed(6));
  
          setValue(`available_balance`, !balance ? 0 : updatedBalance);
          setValue(`current_balance`, !balance
            ? 0
            : parseFloat(currentBalance) + parseFloat(material ? material.quantity : 0 || existingQuantity) || 0);
  
        }
      } catch (error) {
        console.error('Error retrieving balances:', error);
      } finally {
        setIsRetrieving(false);
      }
    } else {
      setValue(`available_balance`, 'N/A');
      clearErrors(`rate`);
    }
  };  

  useEffect(() => {
    retrieveBalances(store_id, product, measurement_unit_id)
  }, [store_id, product, measurement_unit_id, material]);
  
  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
      <Grid container columnSpacing={1} rowSpacing={1} mb={2} mt={1}>
        <Grid size={{xs: 12, md: !!product && !!store_id ? 3 : 4, lg: !!product && !!store_id ? 3 : 4}}>
          <ProductSelect
            frontError={errors.product}
            defaultValue={material?.product}
            excludeIds={nonInventoryIds}
            onChange={async(newValue) => {
              clearErrors('quantity');
              if(newValue) {
                await setSelectedUnit(null)
                await setValue(`product`, newValue, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                await setSelectedUnit(newValue?.primary_unit?.id)
                await setValue('measurement_unit_id', newValue.primary_unit?.id);
                await setValue('unit_symbol', newValue.primary_unit?.unit_symbol);
                await setValue(`product_id`,newValue.id);
                setValue(`projectTaskIndex`, projectTaskIndex)

                await retrieveBalances(store_id, newValue, newValue.primary_unit?.id);
              } else {
                await setValue(`available_balance`,'N/A');
                await setValue(`product`,null, {
                  shouldDirty: true,
                  shouldValidate: true
                });
              }
            }}
          />
        </Grid>
        <Grid size={{xs: 12, md: !!product && !!store_id ? 2 : 3}}>
          <StoreSelector
            allowSubStores={true}
            proposedOptions={project?.stores}
            defaultValue={material?.store}
            onChange={(newValue) => {
              newValue !== null && retrieveBalances(newValue.id, product, measurement_unit_id);
                setValue(`store`, newValue);
                setValue(`store_id`, newValue && newValue.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
            }}
          />
        </Grid>
        {!!product && !!store_id &&
          <Grid size={{xs: 12, md: 2, lg: 2}}>
            {
              isRetrieving ? <LinearProgress/> :
                <TextField
                  label="Available Balance"
                  fullWidth
                  size='small'
                  value={watch('available_balance')}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <span>{combinedUnits?.find(unit => unit.id === selectedUnit)?.unit_symbol}</span>
                  }}
                />
            }
          </Grid>
        }
        <Grid size={{xs: 12, md: 2}}>
          <TextField
            label="Quantity"
            fullWidth
            size='small'
            error={!!errors?.quantity}
            helperText={errors?.quantity?.message}
            onChange={(e)=> {
              setValue(`quantity`, e.target.value ? sanitizedNumber(e.target.value) : null, {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
            InputProps={{ 
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
                          retrieveBalances(store_id, product, selectedUnit.id);
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
                      {combinedUnits?.map((unit) => (
                        <MenuItem key={unit.id} value={unit.id}>
                          {unit.unit_symbol}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              ),
            }}
            defaultValue={material ? material?.quantity : null}
          />
        </Grid>
        <Grid size={{xs: 12, md: 3}}>
          <TextField
            label="Remarks"
            size="small"
            multiline={true}
            minRows={2}
            fullWidth
            {...register('remarks')}
          />
        </Grid>
        <Grid size={{xs: 12}} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            size='small'
            type='submit'
          >
            {
              material ? (
                <><CheckOutlined fontSize='small' /> Done</>
              ) : (
                <><AddOutlined fontSize='small' /> Add</>
              )
            }
          </LoadingButton>
          {
            material && 
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

export default MaterialIssuedForm