import { FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { LoadingButton } from '@mui/lab';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import productServices from '@/components/productAndServices/products/productServices';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';

function InventoryConsumptionItemForm({ setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, item = null,index = -1, setShowForm = null, items=[], setItems, getUpdatedBalanceItems, setIsDirty }) {
    const [isRetrieving, setIsRetrieving] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(item && item.measurement_unit_id);
    const { productOptions } = useProductsSelect();
    const nonInventoryIds = productOptions.filter(product => product.type !== 'Inventory').map(product => product.id);

    const validationSchema = yup.object({
        product: yup.object().required("Product is required").typeError('Product is required'),
        quantity: yup
        .number()
        .transform((value) => (isNaN(value) ? undefined : value))
        .when('product', (product, schema) => {
            if (!product || product.type !== 'Inventory') {
            return schema.positive('Quantity must be a positive number').typeError('Quantity is required');
            }

            return schema
            .required('Quantity is required')
            .positive('Quantity must be a positive number')
            .typeError('Quantity is required')
            .test('not-negative-balance', 'This quantity will lead to negative balance', function (value) {
                const currentBalance = parseFloat(this.resolve(yup.ref('current_balance')));
                return !value || value <= currentBalance;
            })
            .test('quantity-exceeded', 'The quantity exceeds the balance', function (value) {
                const availableBalance = this.resolve(yup.ref('available_balance'));
                return availableBalance === 'N/A' || !value || value <= availableBalance;
            });
        }),
    });

    const {setValue, handleSubmit, register, watch, clearErrors, reset, formState: {errors, dirtyFields}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            ledger_id: item && item.ledger_id,
            ledger: item && item.ledger,
            product: item && productOptions.find(product => product.id === item.product.id),
            product_id: item && (item.product_id || item.product.id),
            available_balance: 'N/A',
            quantity: item ? item.quantity : null,
            conversion_factor: item ? item.conversion_factor : 1,
            measurement_unit_id: item && item.measurement_unit_id,
            unit_symbol: item && (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.unit_symbol),
            description: item && item.description,
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
    const [isAdding, setIsAdding] = useState(false);

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
            setSubmitItemForm(false);
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

    const cost_center_selected = getUpdatedBalanceItems.costCenterId;
    const store_selected = getUpdatedBalanceItems.storeId;
    const date_selected = getUpdatedBalanceItems.consumptionDate;

    // Function to calculate updated balance
    const calculateUpdatedBalance = async () => {
        const currentQuantity= item ? watch(`quantity`) : 0
        const productId= watch(`product`)?.id;
        const measurement_unit_id= watch(`measurement_unit_id`);

        if (!!productId && store_selected && cost_center_selected) {

            const existingItems = items.filter((existingItem, itemIndex) => {
                return existingItem.product.id === productId && itemIndex !== index
            });

            let balances ;

            setIsRetrieving(true);

            if(store_selected && cost_center_selected !== null && productId){
                balances = await productServices.getStoreBalances({
                    as_at: date_selected,
                    productId: productId,
                    storeIds: [store_selected],
                    costCenterId: cost_center_selected,
                    measurement_unit_id: measurement_unit_id
                });
            }

            setIsRetrieving(false);

            const existingQuantity = existingItems.reduce((total, existItem) => parseFloat(total) + parseFloat(existItem.quantity), 0);
            const availableBalance = balances && balances.stock_balances[0] ? balances.stock_balances[0].balance : 0;
            const current_balance = balances && balances.stock_balances[0] ? balances.stock_balances[0].current_balance : 0;

            await setValue(`available_balance`, availableBalance - existingQuantity);
            await setValue(`current_balance`, parseFloat(current_balance) + parseFloat(currentQuantity || 0));
        } else {
            setValue(`available_balance`, 0);
        }
    };

    useEffect(() => {
        if(!!product){
            calculateUpdatedBalance();
        }
    }, [store_selected, cost_center_selected, date_selected])

    const combinedUnits = product?.secondary_units.concat(product?.primary_unit);

    if(isAdding){
       return <LinearProgress/>
    }
    
  return (
    <>
        <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
            <Grid container columnSpacing={1} rowSpacing={1} mb={2} mt={1}>
                <Grid size={{xs: 12, md: 4}}>
                    <ProductSelect
                        label='Product'
                        frontError={errors.product}
                        defaultValue={item && item.product}
                        excludeIds={nonInventoryIds}
                        multiple={false}
                        onChange={async(newValue) => {
                            clearErrors('quantity');
                            if(newValue) {
                                await setSelectedUnit(null)
                                await setValue(`product`, newValue, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                });
                                await setSelectedUnit(newValue?.primary_unit.id)
                                await setValue('measurement_unit_id', newValue.primary_unit?.id);
                                await setValue(`conversion_factor`, 1);
                                setValue(`unit_symbol`, newValue.primary_unit ? newValue.primary_unit.unit_symbol : newValue.measurement_unit.symbol);
                                await setValue(`product_id`,newValue.id);
                                await calculateUpdatedBalance();
                            } else {
                                setValue(`available_balance`, 0);
                                setValue(`current_balance`, 0);
                                setValue(`product_id`, null);
                                setValue(`measurement_unit_id`, null);
                                setValue(`unit_symbol`, null);
                                await setValue(`product`,null, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                });
                            }
                        }}
                    />
                </Grid>
                {!!product &&
                    <Grid size={{xs: 12, md: 2}}>
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
                <Grid size={{xs: 6, md: !!product ? 2 : 4}}>
                    <TextField
                        label="Quantity"
                        fullWidth
                        size='small'
                        error={!!errors?.quantity}
                        helperText={errors?.quantity?.message}
                        onChange={(e)=> {
                            const quantity= sanitizedNumber(e.target.value )
                            setValue(`quantity`,e.target.value ? quantity : 0,{
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
                                                    await setValue(`measurement_unit_id`, selectedUnit.id);
                                                    await setValue(`conversion_factor`, selectedUnit.conversion_factor);
                                                    setValue(`unit_symbol`, selectedUnit.unit_symbol);
                                                    await calculateUpdatedBalance();
                                                }
                                            }}
                                            variant="standard"
                                            size="small"
                                            MenuProps={{
                                                PaperProps: { style: { borderRadius: 0 } },
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
                        defaultValue={item ? item?.quantity : null}
                    />
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                    <LedgerSelect
                        multiple={false}
                        label="Corresponding Ledger"
                        allowedGroups={['Expenses', 'Fixed Assets']}
                        defaultValue={item && item.ledger}
                        onChange={(newValue) => {
                            setValue(`ledger`, newValue);
                            setValue(`ledger_id`, newValue ? newValue.id : null)
                        }} 
                    />
                </Grid>
                <Grid size={{xs: 12, md: 8}}>
                    <TextField
                        label="Description"
                        fullWidth
                        size='small'
                        error={!!errors?.items?.[index]?.description}
                        helperText={errors?.items?.[index]?.description?.message}
                        {...register(`description`)}
                    />
                </Grid>
                <Grid textAlign={'end'} size={{xs: 12, md: 4}}>
                    <LoadingButton
                        loading={false}
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
                    </LoadingButton>
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
    </>
  )
}

export default InventoryConsumptionItemForm