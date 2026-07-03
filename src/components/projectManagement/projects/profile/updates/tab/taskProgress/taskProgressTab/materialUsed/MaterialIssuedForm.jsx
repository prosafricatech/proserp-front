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
  
  const validationSchema = yup.object({
    product: yup
      .object()
      .required('Product is required')
      .typeError('Product is required'),

      quantity: yup.number()
        .required("Quantity is required")
        .positive("Quantity must be positive")
        .typeError('Quantity is required')
        .test(
          'balance-check',
          'Quantity exceeds available balance',
          function (value) {
            const availableBalance = this.parent.available_balance;
            return availableBalance === 'N/A' || !value || value <= availableBalance;
          }
        )
        .test(
          'negative-balance-check',
          function (value) {
            const currentBalance = parseFloat(this.parent.current_balance) || 0;
            const availableBalance = parseFloat(this.parent.available_balance || 0);
            if (currentBalance >= availableBalance) return true;
            return !value || value <= currentBalance || this.createError({
              message: `This quantity will lead to negative balance. Current balance today is ${currentBalance.toLocaleString()}`
            });
          }
        )
  });
  
  const {setValue, handleSubmit, register, watch, clearErrors, reset, formState: {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: material?.id,
      execution_date: material?.execution_date || taskProgressItem?.execution_date,
      product: material && productOptions.find(product => product.id === material.product?.id),
      product_id: material?.product?.id,
      available_balance: 'N/A',
      projectTaskIndex: material?.projectTaskIndex,
      store_id: material?.store?.id,
      remarks: material?.remarks,
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
  const store = watch('store');
  const quantity = watch('quantity');

  const [isAdding, setIsAdding] = useState(false);
  
  const updateItems = async (item) => {
    setIsAdding(true);
    const normalizedItem = {
      ...item,
      execution_date: item?.execution_date || taskProgressItem?.execution_date || material?.execution_date,
      projectTaskIndex: projectTaskIndex ?? material?.projectTaskIndex,
    };
    
    if (index > -1) {
      let updatedItems = [...MaterialIssued];
      updatedItems[index] = normalizedItem;
      await setMaterialIssued(updatedItems);
    } else {
      await setMaterialIssued((items) => [...items, normalizedItem]);
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
        const currentQuantity = material
          ? (parseFloat(quantity) || parseFloat(material?.quantity) || 0)
          : 0;
        const pickedUnit = combinedUnits?.find(unit => unit.id === measurement_unit_id);

        // Build a stable snapshot so current task uses the latest local rows before context sync completes.
        const taskProgressSnapshot = (taskProgressItems || []).map((taskItem, taskIndex) => {
          if (taskIndex === projectTaskIndex) {
            return { ...taskItem, material_used: MaterialIssued || [] };
          }
          return taskItem;
        });

        const allIssuedWithMeta = taskProgressSnapshot.flatMap((taskItem, taskIndex) => {
          return (taskItem?.material_used || []).map((existingItem, itemIndex) => ({
            ...existingItem,
            __taskIndex: taskIndex,
            __itemIndex: itemIndex,
          }));
        });

        const existingItems = allIssuedWithMeta.filter((existingItem) => {
          const sameStoreAndProduct = existingItem?.store?.id === storeId && existingItem?.product?.id === product?.id;
          if (!sameStoreAndProduct) return false;

          // Persisted rows are already reflected by backend stock movements.
          if (existingItem?.id) return false;

          if (material?.id) {
            return existingItem?.id !== material.id;
          }

          if (index > -1) {
            const isCurrentEditingRow = existingItem.__taskIndex === projectTaskIndex && existingItem.__itemIndex === index;
            return !isCurrentEditingRow;
          }

          return true;
        });

        const existingQuantity = existingItems.reduce((total, existingItem) => {
          const itemUnitFactor = combinedUnits.find(unit => unit.id === existingItem?.measurement_unit_id)?.conversion_factor || 1;
          const pickedUnitFactor = pickedUnit?.conversion_factor || 1;
          const primaryUnitId = product?.primary_unit?.id;

          const conversionFactor = pickedUnit?.id === primaryUnitId
            ? (existingItem?.measurement_unit_id !== primaryUnitId ? 1 / itemUnitFactor : 1)
            : (existingItem?.measurement_unit_id === primaryUnitId ? pickedUnitFactor : pickedUnitFactor / itemUnitFactor);

          return total + ((parseFloat(existingItem?.quantity) || 0) * conversionFactor);
        }, 0);

        const balances = await productServices.getStoreBalances({
          as_at: taskProgressItem?.execution_date || material?.execution_date,
          productId: product.id,
          storeIds: [storeId],
          costCenterId: project?.cost_center?.id,
          measurement_unit_id: measurement_unit_id
        });

        const storeBalance = balances?.stock_balances?.find((balanceItem) => {
          return balanceItem.cost_center_id === project?.cost_center?.id;
        }) || balances?.stock_balances?.[0];

        const availableBalance = storeBalance?.current_balance || 0;
        const current_balance = storeBalance?.current_balance || 0;
        const editableQuantity = material?.id ? (parseFloat(currentQuantity) || 0) : 0;

        await setValue(`available_balance`, (availableBalance + editableQuantity) - existingQuantity);
        await setValue(`current_balance`, parseFloat(current_balance) + parseFloat(currentQuantity || 0));
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
  }, [store_id, product, measurement_unit_id, material, taskProgressItems, MaterialIssued, projectTaskIndex, index, quantity]);
  
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

                await setValue(`new_added`, true);

                // Auto-select store if available from project_subcontract
                let selectedStoreId = store_id;
                if (taskProgressItem?.project_subcontract?.store && !material) {
                  const autoStore = taskProgressItem.project_subcontract.store;
                  await setValue('store', autoStore);
                  await setValue('store_id', autoStore.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  selectedStoreId = autoStore.id;
                }

                await retrieveBalances(selectedStoreId, newValue, newValue.primary_unit?.id);
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
            key={store_id || 'no-store'}
            allowSubStores={true}
            proposedOptions={taskProgressItem?.project_subcontract?.store ? [taskProgressItem?.project_subcontract?.store] : project?.stores}
            defaultValue={store || material?.store}
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
            value={watch('quantity') || ''}
            type="number"
            inputProps={{ step: 'any', min: 0 }}
            onChange={(e)=> {
              const sanitized = e.target.value ? sanitizedNumber(e.target.value) : null;
              setValue(`quantity`, sanitized, {
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