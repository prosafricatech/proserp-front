import { Button, Checkbox, Divider, FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import ProductQuickAdd from '../../productAndServices/products/ProductQuickAdd';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { Product } from '@/components/productAndServices/products/ProductType';
import { Organization } from '@/types/auth-types';

export interface RequisitionProductItem {
  product_id?: number;
  product?: Product;
  quantity?: number;
  rate?: number;
  vat_percentage?: number;
  remarks?: string;
  measurement_unit_id?: number;
  measurement_unit?: {
    id: number;
    symbol: string;
  };
  conversion_factor?: number;
  unit_symbol?: string;
  amount?: number;
  product_item_vat?: number;
  [key: string]: any;
}

interface RequisitionProductItemFormProps {
  setClearFormKey: (value: React.SetStateAction<number>) => void;
  submitMainForm?: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: React.SetStateAction<boolean>) => void;
  setIsDirty: (value: React.SetStateAction<boolean>) => void;
  product_item?: RequisitionProductItem | null;
  index?: number;
  setRequisition_product_items: (items: React.SetStateAction<RequisitionProductItem[]>) => void;
  requisition_product_items?: RequisitionProductItem[];
  setShowForm?: (value: React.SetStateAction<boolean>) => void;
}

function RequisitionProductItemForm({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  product_item = null,
  index = -1,
  setRequisition_product_items,
  requisition_product_items = [],
  setShowForm,
}: RequisitionProductItemFormProps) {
    const { productOptions } = useProductsSelect();
    const { checkOrganizationPermission, authOrganization } = useJumboAuth();
    const nonInventoryIds = productOptions.filter(product => product.type !== 'Inventory').map(product => product.id);
    const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
    const [addedProduct, setAddedProduct] = useState<Product | null>(null);
    const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
    const [selectedUnit, setSelectedUnit] = useState<number | null>(product_item ? (product_item.measurement_unit_id ?? product_item.measurement_unit?.id ?? null) : null);
    const [preservedValues, setPreservedValues] = useState<{ vat_percentage?: number } | null>(null);
    const [vatChecked, setVatChecked] = useState(product_item?.vat_percentage ? product_item.vat_percentage > 0 : false);

    const [isVatfieldChange, setIsVatfieldChange] = useState(false);
    const [priceInclusiveVAT, setPriceInclusiveVAT] = useState(0);
    const [priceFieldKey, setPriceFieldKey] = useState(0);
    const [vatPriceFieldKey, setVatPriceFieldKey] = useState(0);

    const validationSchema = yup.object({
        product: yup.object().required('Product is required').typeError('Product is required'),
        quantity: yup
            .number()
            .when('product', {
            is: (product: Product) => !!product && product.type === 'Inventory',
            then: (schema) => schema
                .required('Quantity is required')
                .positive('Quantity must be a positive number')
                .typeError('Quantity is required'),
            }),
    });

    const { setValue, handleSubmit, register, watch, reset, formState: { errors, dirtyFields } } = useForm({
      resolver: yupResolver(validationSchema) as any,
      defaultValues: {
        product: product_item ? productOptions.find(product => product.id === (product_item.product_id || product_item.product?.id)) : null,
        product_id: product_item?.product_id,
        quantity: product_item?.quantity,
        rate: product_item?.rate,
        vat_percentage: product_item?.vat_percentage ?? preservedValues?.vat_percentage ?? 0,
        product_item_vat: product_item?.product_item_vat ?? 0,
        amount: product_item?.amount ?? undefined,
        remarks: product_item?.remarks,
        measurement_unit_id: product_item?.measurement_unit_id ?? product_item?.measurement_unit?.id,
        conversion_factor: product_item?.conversion_factor ?? 1,
        unit_symbol: product_item?.measurement_unit?.symbol ?? product_item?.unit_symbol,
      },
    });

    useEffect(() => {
        const subscription = watch(() => {
            const hasDirtyFields = Object.keys(dirtyFields).length > 0;
            setIsDirty(hasDirtyFields);
        });
        return () => subscription.unsubscribe();
    }, [watch, dirtyFields, setIsDirty]);

    const product: Product | undefined | null = watch('product');
    const vat_percentage: number = watch('vat_percentage') || 0;
    const vat_factor = vat_percentage * 0.01;

    useEffect(() => {
      setValue('vat_percentage', vat_percentage);
      setVatChecked(vatChecked);
    }, [product, vat_percentage]);

    const calculateAmount = (): number => {
      const quantity = parseFloat(watch('quantity')?.toString() ?? '0') || product_item?.quantity || 0;
      const rate = parseFloat(watch('rate')?.toString() ?? '0') || product_item?.rate || 0;
      return quantity * rate * (1 + vat_factor);
    };

    useEffect(() => {
      const amount = calculateAmount();
      setCalculatedAmount(amount);
      setValue('amount', amount);
      setValue('product_item_vat', (watch('rate') ?? 0) * vat_factor);
    }, [watch('quantity'), watch('rate'), vat_factor, product_item]);

  useEffect(() => {
    if (addedProduct?.id) {
      setValue('product', addedProduct);
      setValue('product_id', addedProduct.id);
      setValue('measurement_unit_id', addedProduct.measurement_unit_id);
      setValue('unit_symbol', addedProduct.measurement_unit?.symbol);
      setSelectedUnit(addedProduct.measurement_unit_id);
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct]);

  const [isAdding, setIsAdding] = useState(false);

  const updateItems = async (data: RequisitionProductItem) => {
    setIsAdding(true);
    const newItem = {
      ...data,
      amount: calculateAmount(),
      product_item_vat: (data.rate ?? 0) * vat_factor,
    };

    if (index > -1) {
      const updatedItems = [...requisition_product_items];
      updatedItems[index] = newItem;
      await setRequisition_product_items(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      await setRequisition_product_items(prevItems => [...prevItems, newItem]);
      if (submitItemForm && submitMainForm) {
        submitMainForm();
        setClearFormKey(prevKey => prevKey + 1);
      }
      setSubmitItemForm(false);
    }

    setPreservedValues({
      vat_percentage: newItem.vat_percentage,
    });

    reset({
      product: null,
      quantity: undefined,
      rate: undefined,
      measurement_unit_id: undefined,
      unit_symbol: undefined,
    });
    setIsAdding(false);
    setShowForm?.(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems as any, () => {
        setSubmitItemForm(false);
      })();
    }
  }, [submitItemForm]);

  useEffect(() => {
    setValue('vat_percentage', product_item?.vat_percentage ?? preservedValues?.vat_percentage ?? 0);
  }, [preservedValues, product_item, product]);

  if (isAdding) {
    return <LinearProgress />;
  }

  const combinedUnits: any = product?.secondary_units?.concat((product?.primary_unit as any)) ?? [];

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems as any)}>
      <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
        <Grid size={12}>
          <Divider />
        </Grid>
        {openProductQuickAdd && !product_item && (
          <Grid size={12} textAlign={'center'}>
            <Typography variant='h5'>Quick Product Registration</Typography>
          </Grid>
        )}
        {!openProductQuickAdd && (
          <>
            <Grid size={{xs: 12, md: 3}}>
              <ProductSelect
                label='Product'
                frontError={errors.product}
                addedProduct={addedProduct}
                defaultValue={product_item?.product}
                // excludeIds={nonInventoryIds}
                onChange={async (newValue: Product | null) => {
                  if (newValue) {
                    await setSelectedUnit(null);
                    setValue('product', newValue, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    const unitId = newValue.primary_unit?.id ?? newValue.measurement_unit_id;
                    setSelectedUnit(unitId);
                    setValue('measurement_unit_id', unitId);
                    setValue('unit_symbol', newValue.primary_unit?.unit_symbol ?? newValue.measurement_unit?.symbol);
                    setValue('product_id', newValue.id);
                  } else {
                    setValue('product', null, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue('measurement_unit_id', undefined);
                    setValue('unit_symbol', undefined);
                    setValue('product_id', undefined);
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
                defaultValue={product_item?.quantity}
                InputProps={{
                  endAdornment: (
                    product && selectedUnit && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FormControl fullWidth>
                          <Select
                            value={selectedUnit ?? ''}
                            onChange={async (e) => {
                              const selectedUnitId = e.target.value as number;
                              setSelectedUnit(selectedUnitId);
                              const selectedUnit = combinedUnits.find((unit: any) => unit.id === selectedUnitId);
                              if (selectedUnit) {
                                await setValue('conversion_factor', selectedUnit.conversion_factor);
                                await setValue('measurement_unit_id', selectedUnit.id);
                                setValue('unit_symbol', selectedUnit.unit_symbol);
                              }
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
                            {product.primary_unit ? (
                              combinedUnits.map((unit: any) => (
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
                    )
                  ),
                }}
                error={!!errors?.quantity}
                helperText={errors?.quantity?.message}
                onChange={(e) => {
                  setValue('quantity', e.target.value ? sanitizedNumber(e.target.value) : 0, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid>
            <Grid size={{xs: 12, md: 1}}>
              <Typography align='left' variant='body2'>
                VAT
                <Checkbox
                  size='small'
                  checked={vatChecked}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setVatChecked(checked);
                    setValue('vat_percentage', checked ? (authOrganization?.organization as Organization)?.settings?.vat_percentage ?? 0 : 0, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </Typography>
            </Grid>
            <Grid size={{xs: 12, md: vat_factor ? 2 : 3}}>
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
                defaultValue={Math.round((watch('rate') ?? 0) * 100000) / 100000}
                onChange={(e) => {
                  setIsVatfieldChange(false);
                  setPriceInclusiveVAT(0);
                  setValue('rate', e.target.value ? sanitizedNumber(e.target.value) : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setVatPriceFieldKey((key) => key + 1);
                }}
              />
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
                  value={
                    isVatfieldChange
                      ? Math.round(priceInclusiveVAT * 100000) / 100000
                      : Math.round((watch('rate') || 0) * (1 + vat_factor) * 100000) / 100000
                  }
                  onChange={(e) => {
                    const numericValue = e.target.value ? sanitizedNumber(e.target.value) : 0;
                    setIsVatfieldChange(!!e.target.value);
                    setPriceInclusiveVAT(numericValue);
                    setValue('rate', numericValue / (1 + vat_factor), {
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
            <Grid size={{xs: 12, md: 6}}>
              <TextField
                label='Remarks'
                fullWidth
                size='small'
                {...register('remarks')}
              />
            </Grid>
            <Grid size={12} textAlign={'end'}>
              <Button
                variant='contained'
                size='small'
                type='submit'
                onClick={() => {
                  setAddedProduct(null);
                  setIsDirty(false);
                  setPriceInclusiveVAT(0);
                }}
              >
                {product_item ? (
                  <>
                    <CheckOutlined fontSize='small' /> Done
                  </>
                ) : (
                  <>
                    <AddOutlined fontSize='small' /> Add
                  </>
                )}
              </Button>
              {product_item && (
                <Tooltip title='Close Edit'>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setShowForm?.(false);
                      setIsDirty(false);
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success' />
                  </IconButton>
                </Tooltip>
              )}
            </Grid>
          </>
        )}
        {openProductQuickAdd && <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct} />}
      </Grid>
    </form>
  );
}

export default RequisitionProductItemForm;