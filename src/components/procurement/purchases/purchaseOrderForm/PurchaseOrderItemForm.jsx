import { Button, Checkbox, Divider, FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ProductSelect from '../../../productAndServices/products/ProductSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import purchaseServices from '../purchase-services';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function PurchaseOrderItemForm({ setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, item = null, index = -1, setItems, items = [], setShowForm = null, checked, getLastPriceItems, setIsDirty }) {
    const [isRetrieving, setIsRetrieving] = useState(false);
    const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
    const [addedProduct, setAddedProduct] = useState(null);
    const { checkOrganizationPermission, authOrganization } = useJumboAuth();
    const { productOptions } = useProductsSelect();
    const [isAdding, setIsAdding] = useState(false);
    const [calculatedAmount, setCalculatedAmount] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState(item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit.id));
    const [preservedValues, setPreservedValues] = useState(null);
    const [vatChecked, setVatChecked] = useState(item?.vat_percentage > 0 ? true : false);

    const [isVatfieldChange, setIsVatfieldChange] = useState(false);
    const [priceInclusiveVAT, setPriceInclusiveVAT] = useState(0);
    const [priceFieldKey, setPriceFieldKey] = useState(0);
    const [vatPriceFieldKey, setVatPriceFieldKey] = useState(0);

    const validationSchema = yup.object({
        product: yup.object().required('Product is required').typeError('Product is required'),
        quantity: yup.number().positive('Quantity is required').required('Quantity is required').typeError('Quantity is required'),
        rate: yup.number().required('Price is required').positive('Price is required').typeError('Price is required'),
    });

    const { setValue, handleSubmit, watch, clearErrors, reset, register, formState: { errors, dirtyFields } } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            product: item && productOptions.find(product => product.id === (item.product_id || item.product.id)),
            quantity: item && item.quantity,
            rate: item && item.rate,
            vat_percentage: item ? item.vat_percentage :
                !!preservedValues ? preservedValues.vat_percentage :
                    0,
            measurement_unit_id: item && (item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit.id),
            unit_symbol: item && (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.unit_symbol),
        },
    });

    useEffect(() => {
        setIsDirty(Object.keys(dirtyFields).length > 0); // Update dirty state
    }, [dirtyFields, setIsDirty, watch]);

    const product = watch('product');
    const vat_percentage = watch('vat_percentage');
    const vat_factor = vat_percentage * 0.01;

    // Set values from addedProduct
    useEffect(() => {
        if (addedProduct?.id) {
            setValue('product', addedProduct);
            setValue('measurement_unit_id', addedProduct.measurement_unit_id);
            setValue('unit_symbol', addedProduct.measurement_unit.symbol);
            setSelectedUnit(addedProduct?.measurement_unit_id);
            setOpenProductQuickAdd(false);
        }
    }, [addedProduct]);

    useEffect(() => {
        if (product && product.vat_exempted === 1) {
            setVatChecked(false);
            setValue('vat_percentage', 0);
        } else {
            setValue(`vat_percentage`, vat_percentage);
            setVatChecked(vatChecked);
        }
    }, [product, vat_percentage]);

    const calculateAmount = () => {
        const quantity = parseFloat(watch(`quantity`)) || item?.quantity || 0;
        const rate = parseFloat(watch(`rate`)) || (item?.rate || 0);
        return quantity * rate * (1 + vat_factor);
    };

    useEffect(() => {
        const amount = calculateAmount();
        setCalculatedAmount(amount);
        setValue(`amount`, amount);
        setValue(`item_vat`, watch(`rate`) * vat_factor);
    }, [watch('quantity'), watch('rate'), vat_factor, item]);

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
            setAddedProduct(null);
            if (!!submitItemForm) {
                submitMainForm();
                setClearFormKey(prevKey => prevKey + 1);
            }
            setSubmitItemForm(false);
        }

        setPreservedValues({
            vat_percentage: item.vat_percentage,
        });

        reset({
            product: null,
            quantity: null,
            rate: null,
            measurement_unit_id: null,
            unit_symbol: null,
        });
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

    const retrieveLastPrice = async (product, measurement_unit_id) => {
        if (checked === true && product !== null && getLastPriceItems.stakeholder_id !== null) {
            setIsRetrieving(true);
            const lastPrice = await purchaseServices.getLastPrice({
                stakeholder_id: getLastPriceItems.stakeholder_id,
                product_id: product.id,
                as_at: getLastPriceItems.date,
                currency_id: getLastPriceItems.currency_id,
                measurement_unit_id: measurement_unit_id,
            });
            setValue(`rate`, lastPrice?.message);
            setIsRetrieving(false);
            setVatPriceFieldKey((key) => key + 1);
        }
    };

    useEffect(() => {
        if (!item && !checked) {
            // Clear the 'rate' field
            setValue('rate', 0);
        } else {
            clearErrors(`rate`);
        }
    }, [checked, setValue]);

    useEffect(() => {
        if (product?.vat_exempted !== 0) {
          setPreservedValues(null)
        }
        setValue(`vat_percentage`, item ? item?.vat_percentage : 
            preservedValues ? preservedValues.vat_percentage :
            ((product && product?.vat_exempted !== 0) ? 0 : vat_percentage)
        );
    }, [preservedValues, item, product]);

    if (isAdding) {
        return <LinearProgress />;
    }

    const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

    return (
        <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
            <Divider />
            <Grid container spacing={1} mb={1} mt={1}>
                {!openProductQuickAdd && !item && (
                    <Grid size={12} textAlign={'center'}>
                        <Typography variant='h5'>Add Item</Typography>
                    </Grid>
                )}

                {!!openProductQuickAdd && !item && (
                    <Grid size={12} textAlign={'center'}>
                        <Typography variant='h5'>Quick Product Registration</Typography>
                    </Grid>
                )}

                {!openProductQuickAdd && (
                    <>
                        <Grid size={{xs: 12, md: 3}}>
                            <ProductSelect
                                label='Product/Service'
                                frontError={errors.product}
                                defaultValue={item && item.product}
                                addedProduct={addedProduct}
                                onChange={(newValue) => {
                                    if (!!newValue) {
                                        setValue(`product`, newValue, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        });
                                        setAddedProduct(null);
                                        setSelectedUnit(newValue?.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id);
                                        setValue('measurement_unit_id', newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id);
                                        setValue('unit_symbol', newValue.primary_unit ? newValue?.primary_unit?.unit_symbol : newValue?.measurement_unit.symbol);
                                        setValue(`product_id`, newValue.id);

                                        retrieveLastPrice(newValue, newValue.primary_unit?.id);
                                    } else {
                                        setValue(`product`, null, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        });
                                        setSelectedUnit(null);
                                        setValue('measurement_unit_id', null);
                                        setValue('unit_symbol', null);
                                        setValue(`product_id`, null);
                                    }
                                }}
                                startAdornment={
                                    checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE]) && (
                                        <Tooltip title={'Add New Product'}>
                                            <AddOutlined
                                                onClick={() => setOpenProductQuickAdd(true)}
                                                sx={{
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        </Tooltip>
                                    )
                                }
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 2}}>
                            <TextField
                                label='Quantity'
                                fullWidth
                                size='small'
                                InputProps={{
                                    endAdornment: (
                                        !!product && !!selectedUnit && (
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <FormControl fullWidth>
                                                    <Select
                                                        value={!!selectedUnit && selectedUnit}
                                                        onChange={async (e) => {
                                                            setSelectedUnit(e.target.value);
                                                            const selectedUnitId = e.target.value;
                                                            const selectedUnit = combinedUnits?.find(unit => unit.id === selectedUnitId);
                                                            if (selectedUnit) {
                                                                await setValue('measurement_unit_id', selectedUnit.id);
                                                                setValue('unit_symbol', selectedUnit?.unit_symbol);
                                                            }
                                                            retrieveLastPrice(product, selectedUnit.id);
                                                        }}
                                                        variant='standard'
                                                        size='small'
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
                                        )
                                    ),
                                }}
                                error={!!errors?.quantity}
                                helperText={errors?.quantity?.message}
                                {...register(`quantity`)}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 1}}>
                            <Typography align='left' variant='body2'>
                                VAT
                                <Checkbox
                                    size='small'
                                    checked={vatChecked}
                                    disabled={product && product?.vat_exempted === 1}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setVatChecked(checked);
                                        setValue('vat_percentage', checked ? authOrganization.organization.settings.vat_percentage : 0, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        });
                                    }}
                                />
                            </Typography>
                        </Grid>
                        <Grid size={{xs: 12, md: vat_factor ? 2 : 3}}>
                            {isRetrieving ? (
                                <LinearProgress />
                            ) : (
                                <TextField
                                    label='Price'
                                    fullWidth
                                    key={priceFieldKey}
                                    size='small'
                                    error={!!errors?.rate}
                                    helperText={errors?.rate?.message}
                                    InputProps={{
                                        inputComponent: CommaSeparatedField,
                                    }}
                                    defaultValue={Math.round(watch(`rate`) * 100000) / 100000}
                                    onChange={(e) => {
                                        setIsVatfieldChange(false);
                                        setPriceInclusiveVAT(0);
                                        setValue(`rate`, e.target.value ? sanitizedNumber(e.target.value) : 0, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                        setVatPriceFieldKey((key) => key + 1);
                                    }}
                                />
                            )}
                        </Grid>
                        {!!vat_factor && (
                            <Grid size={{xs: 12, md: 2}}>
                                <TextField
                                    label='Price (VAT Inclusive)'
                                    fullWidth
                                    key={vatPriceFieldKey}
                                    size='small'
                                    error={!!errors?.rate}
                                    helperText={errors?.rate?.message}
                                    InputProps={{
                                        inputComponent: CommaSeparatedField,
                                    }}
                                    defaultValue={
                                        isVatfieldChange
                                            ? Math.round(priceInclusiveVAT * 100000) / 100000
                                            : Math.round(watch('rate') * (1 + vat_factor) * 100000) / 100000
                                    }
                                    onChange={(e) => {
                                        setIsVatfieldChange(!!e.target.value);
                                        setPriceInclusiveVAT(e.target.value ? sanitizedNumber(e.target.value) : 0);
                                        setValue(`rate`, e.target.value ? sanitizedNumber(e.target.value) / (1 + vat_factor) : 0, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                        setPriceFieldKey((key) => key + 1);
                                    }}
                                />
                            </Grid>
                        )}
                        <Grid size={{xs: 12, md: vat_factor ? 2 : 3}}>
                            <TextField
                                label='Amount'
                                fullWidth
                                size='small'
                                value={calculatedAmount}
                                InputProps={{
                                    inputComponent: CommaSeparatedField,
                                    readOnly: true,
                                }}
                            />
                        </Grid>
                        <Grid size={12} textAlign={'end'}>
                            <Button
                                variant='contained'
                                size='small'
                                type='submit'
                                onClick={() => setPriceInclusiveVAT(0)}
                            >
                                {item ? (
                                    <>
                                        <CheckOutlined fontSize='small' /> Done
                                    </>
                                ) : (
                                    <>
                                        <AddOutlined fontSize='small' /> Add
                                    </>
                                )}
                            </Button>
                            {item && (
                                <Tooltip title='Close Edit'>
                                    <IconButton
                                        size='small'
                                        onClick={() => {
                                            setShowForm(false);
                                        }}
                                    >
                                        <DisabledByDefault fontSize='small' color='success' />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Grid>
                    </>
                )}
                {!!openProductQuickAdd && <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct} />}
            </Grid>
        </form>
    );
}

export default PurchaseOrderItemForm;