import { FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup  from "yup";
import { yupResolver } from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useStoreProfile } from '../../StoreProfileProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import productServices from '@/components/productAndServices/products/productServices';

function InventoryTrasferItemForm({ setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, item = null, index = -1, setItems, items = [], setShowForm = null, sourceCostCenterId = null, transferDate, setIsDirty}) {
    const [isRetrieving, setIsRetrieving] = useState(false);
    const { activeStore } = useStoreProfile();
    const {productOptions} = useProductsSelect();
    const nonInventoryIds = productOptions.filter(product => product.type !== 'Inventory').map(product => product.id);
    const [selectedUnit, setSelectedUnit] = useState(item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit_id));

    const validationSchema = yup.object({
        product: yup.object().required("Product is required").typeError('Product is required'),
        quantity: yup.number()
            .transform((value) => (isNaN(value) ? undefined : value))
            .nullable()
            .when('product', {
            is: (product) => product?.type === 'Inventory',
            then: (schema) => schema
                .required("Quantity is required")
                .positive("Quantity must be a positive number")
                .typeError('Quantity must be a number')
                .test('balance-check', 'The quantity exceeds the available balance', function(value) {
                    const availableBalance = this.parent.available_balance;
                    if (availableBalance === 'N/A' || !value) return true;
                    return value <= parseFloat(availableBalance);
                })
                .test('current-balance-check', 'This quantity will lead to negative balance', function(value) {
                    const currentBalance = this.parent.current_balance;
                    const availableBalance = this.parent.available_balance;
                    
                    if (currentBalance >= availableBalance) return true;
                    return value <= parseFloat(currentBalance);
                }),
            otherwise: (schema) => schema
                .required("Quantity is required")
                .positive("Quantity must be a positive number")
                .typeError('Quantity must be a number')
            }),
    });

    const { setValue, handleSubmit, watch, reset, register, formState: { errors, dirtyFields} } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            product: item && productOptions?.find(product => product.id === (item.product_id || item.product.id)),           
            quantity: item && (item?.quantity || item.quantity),
            measurement_unit_id: item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit_id),
            unit_symbol: item && (item.unit_symbol ? item.unit_symbol : item.measurement_unit.symbol),
            conversion_factor: item ? item.conversion_factor : 1,
            available_balance: 0
        }
    });
    
    useEffect(() => {
        const subscription = watch(() => {
            const hasDirtyFields = Object.keys(dirtyFields).length > 0;
            setIsDirty(hasDirtyFields);
        });
        return () => subscription.unsubscribe();
    }, [watch, dirtyFields, setIsDirty]);

    const product = watch('product');
    const measurement_unit_id = watch('measurement_unit_id');
    const [isAdding, setIsAdding] = useState(false);

    const calculateUpdatedBalance = async (product, measurement_unit_id) => {
            setIsRetrieving(true);
            const productId = product?.id;
            const pickedUnit = combinedUnits?.find(unit => unit.id === measurement_unit_id);

            const existingItems = items.filter((item, itemIndex) => {
                return item.product.id === productId && itemIndex !== index && !item.id;
            });

            let balances ;

            if(productId && sourceCostCenterId !== null){
                 balances = await productServices.getStoreBalances({
                    as_at: transferDate,
                    productId: item ? item.product?.id : productId,
                    storeIds: [activeStore.id],
                    costCenterId: sourceCostCenterId,
                    measurement_unit_id: measurement_unit_id
                });
            }

            setIsRetrieving(false);
            const existingQuantity = existingItems.reduce((total, existingItem) => {
                const itemUnitFactor = combinedUnits?.find(unit => unit.id === existingItem?.measurement_unit_id)?.conversion_factor || 1;
                const pickedUnitFactor = pickedUnit?.conversion_factor || 1;
                const primaryUnitId = product?.primary_unit.id;
    
                const conversionFactor = pickedUnit?.id === primaryUnitId
                ? (existingItem?.measurement_unit_id !== primaryUnitId ? 1 / itemUnitFactor : 1) // Primary to secondary or same unit
                : (existingItem?.measurement_unit_id === primaryUnitId ? pickedUnitFactor : pickedUnitFactor / itemUnitFactor); // Secondary to primary or another secondary

                return total + (existingItem.quantity * conversionFactor);
            }, 0);

            const availableBalance = balances && balances.stock_balances[0] ? balances.stock_balances[0].balance : 0;
            const current_balance = balances && balances.stock_balances[0] ? balances.stock_balances[0].current_balance : 0;
            const updatedBalance = (availableBalance - existingQuantity);

            setValue('available_balance', updatedBalance + parseFloat(item?.sending_movement?.quantity || 0) || 0);
            setValue('current_balance', parseFloat(current_balance) + parseFloat(item?.sending_movement?.quantity || 0));
    };

    useEffect(() => {
        calculateUpdatedBalance(product, measurement_unit_id);
    }, [sourceCostCenterId, transferDate]);

    const updateItems = async (item) => {
        setIsAdding(true);
        if (index > -1) {
            // Replace the existing item with the edited item
            let updatedItems = [...items];
            updatedItems[index] = item;
            await setItems(updatedItems);
            setClearFormKey(prevKey => prevKey + 1);
        } else {
            // Add the new item to the items array
            await setItems((items) => [...items, item]);
            if (!!submitItemForm) {
                submitMainForm()
            }
            setSubmitItemForm(false)
            setClearFormKey(prevKey => prevKey + 1);
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

    if (isAdding) {
        return <LinearProgress />
    }

    const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

    return (
        <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
            <Grid container columnSpacing={1} rowSpacing={1} mb={2} mt={2}>
                {!item && (
                    <Grid size={12} textAlign={'center'} mt={1} mb={1}>
                        Add Item
                    </Grid>
                )}
                <Grid size={{xs: 12, md: 4, lg: 6}}>
                    <ProductSelect
                        frontError={errors.product}
                        defaultValue={item && item?.product}
                        excludeIds={nonInventoryIds}
                        onChange={async (newValue) => {
                            if ( newValue ) {
                                await setValue(`product`, newValue, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                });
                                setSelectedUnit(newValue?.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id)
                                setValue('measurement_unit_id', newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id);
                                setValue('unit_symbol', newValue.primary_unit ? newValue?.primary_unit?.unit_symbol : newValue?.measurement_unit.symbol)
                                calculateUpdatedBalance(newValue, measurement_unit_id);
                            } else {
                                setValue(`available_balance`, 'N/A');
                                setValue(`product`, null, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                });
                                setSelectedUnit(null)
                                setValue('measurement_unit_id', null);
                                setValue('unit_symbol', null)
                                setValue(`product_id`,null);
                            }
                        }}
                    />
                </Grid>
                <Grid size={{xs: 12, md: 4, lg: 3}}>
                    {
                        isRetrieving ? <LinearProgress /> :
                        <TextField
                            label="Available Balance"
                            fullWidth
                            size='small'
                            value={watch('available_balance')}
                            InputProps={{
                                readOnly: true,
                                endAdornment: <span>{product && product.unit_symbol}</span>
                            }}
                        />
                    }
                </Grid>
                <Grid size={{xs: 12, md: 4, lg: 3}}>
                    <TextField
                        label="Quantity"
                        fullWidth
                        size='small'
                        error={!!errors?.quantity}
                        helperText={errors?.quantity?.message}
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
                                                await setValue(`conversion_factor`, selectedUnit.conversion_factor);
                                                await setValue(`measurement_unit_id`, selectedUnit.id);
                                                setValue(`unit_symbol`, selectedUnit?.unit_symbol);
                                                calculateUpdatedBalance(product, selectedUnit.id)
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
                                            {product.measurement_unit?.symbol}
                                        </MenuItem>
                                    )}
                                    </Select>
                                 </FormControl>
                             </div>
                         ),
                         }}
                        {...register(`quantity`)}
                    />
                </Grid>
                <Grid textAlign={'end'} size={12}>
                    <LoadingButton
                        loading={false}
                        variant='contained'
                        size='small'
                        type='submit'
                        onClick={() => setSubmitItemForm(false)}
                    >
                        {
                            item ? (
                                <><CheckOutlined fontSize='small' /> Done</>
                            ) : (
                                <><AddOutlined fontSize='small' /> Add</>
                            )
                        }
                    </LoadingButton>
                    {
                        item &&
                        <Tooltip title='Close Edit'>
                            <IconButton size='small'
                                onClick={() => {
                                    setShowForm(false);
                                }}
                            >
                                <DisabledByDefault fontSize='small' color='success' />
                            </IconButton>
                        </Tooltip>
                    }
                </Grid>
            </Grid>
        </form>
    )
}

export default InventoryTrasferItemForm;