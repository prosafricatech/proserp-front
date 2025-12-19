import { Button, FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import React, { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { ProductionBatchesContext } from '../ProductionBatchesList';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import productServices from '@/components/productAndServices/products/productServices';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

function InventoryInputsItemForm({setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, setIsDirty, productionDates, item = null, index = -1, setInventoryInputs, inventoryInputs = [], setShowForm = null}) {
    const { activeWorkCenter } = useContext(ProductionBatchesContext);
    const { productOptions } = useProductsSelect();
    const [isRetrieving, setIsRetrieving] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit.id));
    const [preservedValues, setPreservedValues] = useState(null)

    const validationSchema = yup.object({
        consumption_date: yup
            .string()
            .required('Consumption Date is required')
            .typeError('Consumption Date is required'),
        product: yup
            .object()
            .required('Product is required')
            .typeError('Product is required'),
        store_id: yup
            .number()
            .nullable()
            .transform((value) => (isNaN(value) ? null : value))
            .when('product', (product, schema) => {
            return product && product.type === 'Inventory'
                ? schema.required('Store is required').typeError('Store is required')
                : schema.nullable();
            }),
        quantity: yup
            .number()
            .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
            .nullable()
            .when('product', (product, schema) => {
                if (!product || product.type !== 'Inventory') {
                    return schema
                    .positive('Quantity must be a positive number')
                    .typeError('Quantity must be a number');
                }
            return schema
                .required('Quantity is required')
                .positive('Quantity must be a positive number')
                .test(
                'not-exceed-current',
                'This quantity will lead to a negative balance',
                    function (value) {
                        const currentBalance = parseFloat(this.parent.current_balance) || 0;
                        return value == null || value <= currentBalance;
                    }
                )
                .test(
                'not-exceed-available',
                'The quantity exceeds the available balance',
                    function (value) {
                        const availableBalance = parseFloat(this.parent.available_balance) || 0;
                        return value == null || availableBalance === 0 || value <= availableBalance;
                    }
                );
            }),
            rate: yup
                .number()
                .when('product', (product, schema) => {
                    if (product && product.type === 'Inventory') {
                        return schema
                        .required('Rate is required')
                        .positive('Rate must be a positive number')
                        .typeError('Rate must be a number');
                    }
                    return schema.nullable();
                }),
    });

    const {setValue, clearErrors, register, handleSubmit, watch, reset, formState: {errors, dirtyFields}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            product: item && productOptions.find(product => product.id === (item.product_id || item.product.id)),
            product_id: item && item.product_id,
            consumption_date: item && dayjs(item.consumption_date).toISOString(),
            store: item && item.store,
            store_id: item && (item.store_id || item.store.id),
            quantity: item && item.quantity,
            rate: item ? item.rate : null,
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

    const product = watch('product');
    const measurement_unit_id = watch('measurement_unit_id');
    const store_id = watch('store_id');
    const isInventory = product?.type === 'Inventory'
    const costCenterId = activeWorkCenter?.cost_center.id
    const consumption_date = watch('consumption_date');

    const [isAdding, setIsAdding] = useState(false);

    const updateItems = async (item) => {
        setIsAdding(true);
        if (index > -1) {
            let updatedItems = [...inventoryInputs];
            updatedItems[index] = item;
            await setInventoryInputs(updatedItems);
            setClearFormKey(prevKey => prevKey + 1);
        } else {
            await setInventoryInputs((items) => [...items, item]);
            if (!!submitItemForm) {
                submitMainForm()
                setClearFormKey(prevKey => prevKey + 1);
            }
            setSubmitItemForm(false)
        }

        setPreservedValues(
            {
                store: item.store,
                store_id: item.store_id,
                consumption_date: item.consumption_date,
            }
        )

        reset({
            consumption_date: item.consumption_date,
            store: item.store,
            store_id: item.store_id,
            product: null,
            product_id: null,
            quantity: null,
            rate: null,
            remarks: null,
            measurement_unit_id: null,
            unit_symbol: null
        });
        setIsAdding(false);
        setShowForm && setShowForm(false);
    };

    useEffect(() => {
      if (submitItemForm) {
        handleSubmit(updateItems, () => {
          setSubmitItemForm(false);
        })();
      }
    }, [submitItemForm]);

    const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

    const retrieveBalances = async (consumption_date, storeId = null, product, measurement_unit_id) => {
        if (isInventory && storeId && !isRetrieving) { 
          setIsRetrieving(true);

          try {
            const balances = await productServices.getStoreBalances({
              as_at: consumption_date,
              productId: product.id,
              storeIds: [storeId],
              costCenterId: costCenterId,
              measurement_unit_id: measurement_unit_id
            });

            if (balances) {
                const pickedUnit = combinedUnits?.find(unit => unit.id === measurement_unit_id);

                const existingItems = inventoryInputs?.filter((existingItem, itemIndex) => {
                    return existingItem?.store?.id === storeId 
                    && existingItem.product.id === product?.id 
                    && itemIndex !== index
                });

                const existingQuantity = existingItems.reduce((total, existingItem) => {
                    const itemUnitFactor = combinedUnits.find(unit => unit.id === existingItem?.measurement_unit_id)?.conversion_factor || 1;
                    const pickedUnitFactor = pickedUnit?.conversion_factor || 1;
                    const primaryUnitId = product?.primary_unit.id;
        
                    const conversionFactor = pickedUnit?.id === primaryUnitId
                    ? (existingItem?.measurement_unit_id !== primaryUnitId ? 1 / itemUnitFactor : 1) // Primary to secondary or same unit
                    : (existingItem?.measurement_unit_id === primaryUnitId ? pickedUnitFactor : pickedUnitFactor / itemUnitFactor); // Secondary to primary or another secondary

                    return total + (existingItem.quantity * conversionFactor);
                }, 0);

                const balance = balances?.stock_balances.find(storeBalance => storeBalance.cost_center_id === costCenterId)?.balance;
                const currentBalance = balances?.stock_balances.find(storeBalance => storeBalance.cost_center_id === costCenterId)?.current_balance;

                const updatedBalance = parseFloat((balance - existingQuantity).toFixed(6));

                setValue(`available_balance`, !balance ? 0 : updatedBalance);
                setValue(`unit_cost`, balances?.stock_balances.find(storeBalance => storeBalance.cost_center_id === costCenterId)?.unit_cost);
                setValue(`current_balance`, !balance
                    ? 0
                    : parseFloat(currentBalance) + parseFloat(item ? item.quantity : 0 || existingQuantity) || 0);

            }
          } catch (error) {
            console.clear()
          } finally {
            setIsRetrieving(false);
          }
        } else {
          setValue(`available_balance`, 'N/A');
          clearErrors(`rate`);
        }
    };  

    useEffect(() => {
       retrieveBalances(consumption_date, store_id, product, measurement_unit_id)
    }, [store_id, product, measurement_unit_id, item, consumption_date]);

    if(isAdding){
        return <LinearProgress/>
    }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
        <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
            <Grid size={{xs: 12, md: 6}}>
                <DateTimePicker
                    label="Consumption Date (MM/DD/YYYY)"
                    fullWidth
                    defaultValue={item ? dayjs(item.consumption_date) : preservedValues ? dayjs(preservedValues.consumption_date) : null}
                    minDateTime={dayjs(productionDates.start_date)}  
                    maxDateTime={dayjs(productionDates.end_date)}   
                    minutesStep={1}    
                    slotProps={{
                        textField: {
                            size: 'small',
                            fullWidth: true,
                            readOnly: true,
                            error: !!errors?.consumption_date,
                            helperText: errors?.consumption_date?.message
                        }
                    }}
                    onChange={(newValue) => {
                        setValue('consumption_date', newValue ? newValue.toISOString() : null, {
                            shouldValidate: true,
                            shouldDirty: true
                        });
                        retrieveBalances(newValue?.toISOString(), store_id, product, measurement_unit_id);
                    }}
                />
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
                <StoreSelector
                    allowSubStores={true}
                    proposedOptions={activeWorkCenter.stores}
                    defaultValue={item ? item.store : preservedValues ? preservedValues.store : null}
                    frontError={errors.store_id}
                    onChange={(newValue) => {
                        if (newValue !== null) {
                            retrieveBalances(consumption_date, newValue.id, product, measurement_unit_id);
                        }
                        setValue(`store`, newValue);
                        setValue(`store_id`, newValue && newValue.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                        });
                    }}
                />
            </Grid>
            <Grid size={{xs: 12, md: 3}}>
                <ProductSelect
                    label='Product'
                    frontError={errors.product}
                    defaultValue={item && item.product}
                    onChange={async(newValue) => {
                        if (!!newValue) {
                            await setSelectedUnit(null)
                            setValue(`product`, newValue, {
                                shouldDirty: true,
                                shouldValidate: true
                            });
                            setSelectedUnit(newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id)
                            setValue(`measurement_unit_id`, newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id);
                            setValue(`unit_symbol`, newValue.primary_unit ? newValue?.primary_unit?.unit_symbol : newValue?.measurement_unit.symbol)
                            setValue(`product_id`,newValue?.id);
                            setValue(`store_id`, store_id, {
                                shouldDirty: true,
                                shouldValidate: true
                            });

                            await retrieveBalances(consumption_date, store_id, newValue, newValue.primary_unit?.id);
                        } else {
                            await setValue(`available_balance`,'N/A');
                            setValue(`product`, null, {
                                shouldDirty: true,
                                shouldValidate: true
                            });
                            setValue(`store_id`, store_id, {
                                shouldDirty: true,
                                shouldValidate: true
                            });
                            setValue(`measurement_unit_id`, null);
                            setValue(`unit_symbol`, null);
                            setValue(`product_id`,null);
                        }
                    }}
                />
            </Grid>
            {!!isInventory &&
                <Grid size={{xs: 12, md: 3}}>
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
            <Grid size={{xs: 12, md: 3}}>
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
                                                await setValue(`conversion_factor`, selectedUnit.conversion_factor);
                                                await setValue(`measurement_unit_id`, selectedUnit.id);
                                                setValue(`unit_symbol`, selectedUnit?.unit_symbol);
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
                        const val = e.target.value;
                        const num = val ? sanitizedNumber(val) : null;
                        setValue('quantity', num, { shouldValidate: true, shouldDirty: true });
                    }}
                />
            </Grid>
            {
                product && !isInventory &&
                <Grid size={{xs: 12, md: 3}}>
                    <TextField
                        label="Rate"
                        fullWidth
                        size="small"
                        defaultValue={item && item.rate}
                        error={!!errors?.rate}
                        helperText={errors?.rate?.message}
                        InputProps={{
                            inputComponent: CommaSeparatedField,
                        }}
                        onChange={(e) => {
                            const val = e.target.value;
                            const num = val ? sanitizedNumber(val) : null;
                            setValue('rate', num, { shouldValidate: true, shouldDirty: true });
                        }}
                    />
                </Grid>
            }
            <Grid size={{xs: 12, md: product ? 3 : 6}}>
                <TextField
                    label="Remarks"
                    fullWidth
                    size="small"
                    {...register('remarks')}
                />
            </Grid>
            <Grid size={12} textAlign={'end'} mb={1}>
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

export default InventoryInputsItemForm