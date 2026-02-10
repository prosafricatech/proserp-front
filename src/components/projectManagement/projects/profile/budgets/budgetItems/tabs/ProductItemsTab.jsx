import { yupResolver } from '@hookform/resolvers/yup';
import { FormControl, Grid, MenuItem, Select, TextField, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react'
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { Div } from '@jumbo/shared';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function ProductItemsTab({budget, selectedBoundTo, selectedItemable}) {
    const {productOptions} = useProductsSelect();
    const {checkOrganizationPermission} = useJumboAuth();
    const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
    const [addedProduct, setAddedProduct] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [triggerKey, setTriggerKey] = useState(0);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
  
    const { mutate: addBudgetItem, isPending } = useMutation({
      mutationFn: projectsServices.addBudgetItems,
      onSuccess: (data) => {
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({queryKey: ['budgetItemsDetails']});
        reset({
          type: 'product',
          budget_id: budget.id,
          product_id: null,
          currency_id: 1,
          exchange_rate: 1,
          rate: '',
          quantity: '',
          alternative_product_ids: [],
          description: '',
          unit_symbol: '',
          measurement_unit_id: null,
          budget_itemable_id: selectedItemable?.id,
          bound_to: selectedBoundTo,
        }); 
        setTriggerKey(prevKey => prevKey + 1);
      },
      onError: (error) => {
        enqueueSnackbar(error.response.data.message, {variant: 'error'});
      },
    });
  
    const saveMutation = React.useMemo(() => {
      return addBudgetItem;
    }, [addBudgetItem]);

    // Define validation schema
    const validationSchema = yup.object({
        product_id: yup.number().required("Product name is required").typeError('Product name is required'),
        currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
        exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
        rate: yup.number().positive('Rate is required').required("Rate is required").positive("Rate is required").typeError('Rate is required'),
        quantity: yup.number().positive('Quantity is required').required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
        alternative_product_ids: yup.array().of(yup.number()).nullable().test(
            'unique-alternative-product','An alternative product cannot be the same as the Main Product.',
            function (alternative_product_ids) {
                const productId = this.parent.product_id;
                if (!alternative_product_ids || alternative_product_ids.length === 0) return true; 
    
                return !alternative_product_ids.includes(productId);
            }
        )
    });

    const {setValue, handleSubmit, watch, reset, formState:{errors}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            type: 'product',
            product_id: null,
            currency_id: 1,
            exchange_rate: 1,
            rate: '',
            quantity: '',
            alternative_product_ids: [],
            description: '',
            unit_symbol: '',
            measurement_unit_id: null,
            budget_id: budget.id,
            budget_itemable_id: selectedItemable?.id,
            bound_to: selectedBoundTo,
        }
    });

    useEffect(() => {
        if (selectedBoundTo) {
          setValue('bound_to', selectedBoundTo);
        } else {
          setValue('bound_to', null);
        }
      
        if (selectedItemable) {
          setValue('budget_itemable_id', selectedItemable.id);
        } else {
          setValue('budget_itemable_id', null);
        }
    }, [selectedBoundTo, selectedItemable, triggerKey, setValue]);

    // setvalues from coming addedProduct
    useEffect(() => {
        if(addedProduct?.id){
            setValue(`product`, addedProduct)
            setValue('product_id', addedProduct.id);
            setValue('measurement_unit_id', addedProduct.measurement_unit_id);
            setOpenProductQuickAdd(false)
        }
    }, [addedProduct])

    const product = watch('product');

    const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

  return (
    <form autoComplete='off' onSubmit={handleSubmit(saveMutation)} >
        <Grid container columnSpacing={1} key={triggerKey}>
            {
                !openProductQuickAdd &&
                    <>
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{ mt: 1 }}>
                                <ProductSelect
                                    multiple={false}
                                    label="Product name"
                                    frontError={errors?.product_id}
                                    addedProduct={addedProduct}
                                    onChange={(newValue) => {
                                        if (!!newValue) {
                                            setAddedProduct(null)
                                            setSelectedUnit(newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id)
                                            setValue(`product`, newValue)
                                            setValue(`measurement_unit_id`, newValue.primary_unit ? newValue?.primary_unit?.id : newValue?.measurement_unit_id);
                                            setValue(`product_id`, newValue ? newValue.id : null,{
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                        } else {
                                            setAddedProduct(null)
                                            setSelectedUnit(null)
                                            setValue(`product`, null)
                                            setValue(`measurement_unit_id`, null);
                                            setValue(`product_id`, null,{
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                        }
                                    }}
                                    startAdornment={
                                        checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE]) &&
                                        <Tooltip title={'Add New Product'}>
                                            <AddOutlined
                                                onClick={() => setOpenProductQuickAdd(true)}
                                                sx={{
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        </Tooltip>
                                    }
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{mt: 1}}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    size="small"
                                    onChange={(e) => {
                                        setValue(`description`,e.target.value,{
                                            shouldValidate: true,
                                            shouldDirty: true
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: watch(`currency_id`) > 1 ? 2 : 4}}>
                            <Div sx={{mt: 1}}>
                                <CurrencySelector
                                    frontError={errors?.currency_id}
                                    onChange={(newValue) => {
                                        setValue(`currency_id`, newValue ? newValue.id : 1,{
                                            shouldDirty: true,
                                            shouldValidate: true
                                        });
                                        setValue(`currency`, newValue);
                                        setValue(`exchange_rate`, newValue ? newValue.exchangeRate : 1);
                                    }}
                                />
                            </Div>
                        </Grid>
                        {
                            watch(`currency_id`) > 1 &&
                            <Grid size={{xs: 6, md: 2}}>
                                <Div sx={{mt: 1}}>
                                    <TextField
                                        label="Exchange Rate"
                                        fullWidth
                                        size='small'
                                        defaultValue={watch(`exchange_rate`)}
                                        error={errors && !!errors.exchange_rate}
                                        helperText={errors && errors.exchange_rate?.message}
                                        InputProps={{
                                            inputComponent: CommaSeparatedField,
                                        }}
                                        onChange={(e) => {
                                            setValue(`exchange_rate`,e.target.value ? sanitizedNumber(e.target.value ): null,{
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                        }}
                                    />
                                </Div>
                            </Grid>
                        }
                        <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: 2}}>
                            <Div sx={{mt: 1}}>
                                <TextField
                                    label="Quantity"
                                    fullWidth
                                    size="small"
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
                                        }
                                    }
                                    error={errors && !!errors?.quantity}
                                    helperText={errors && errors?.quantity?.message}
                                    onChange={(e) => {
                                        setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                                            shouldValidate: true,
                                            shouldDirty: true
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: 2}}>
                            <Div sx={{mt: 1}}>
                                <TextField
                                    label="Rate"
                                    fullWidth
                                    size="small"
                                    InputProps={{
                                        inputComponent: CommaSeparatedField,
                                    }}
                                    error={errors && !!errors?.rate}
                                    helperText={errors && errors?.rate?.message}
                                    onChange={(e) => {
                                        setValue(`rate`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                                            shouldValidate: true,
                                            shouldDirty: true
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 8}}>
                            <Div sx={{ mt: 1 }}>
                                <ProductSelect
                                    multiple={true}
                                    label="Alternative Products"
                                    excludeIds={productOptions.filter(product => product.primary_unit.unit_symbol !== watch(`unit_symbol`))}
                                    frontError={errors?.alternative_product_ids}
                                    onChange={(newValue) => {
                                        if (!!newValue) {
                                            setValue(`alternative_product_ids`, newValue && newValue.map(value => value.id),{
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                        } else {
                                            setValue(`alternative_product_ids`, [],{
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                        }
                                    }}
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 12}} textAlign={'end'} paddingTop={0.5}>
                            <LoadingButton
                                loading={isPending}
                                variant='contained'
                                size='small'
                                type='submit'
                                onClick={() => setAddedProduct(null)}
                                sx={{marginBottom: 0.5}}
                            >
                                Add
                            </LoadingButton>
                        </Grid>
                    </>
            }
            {!!openProductQuickAdd && <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct}/>}
        </Grid>
    </form>
  )
}

export default ProductItemsTab