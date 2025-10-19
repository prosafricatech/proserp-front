import { AddOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Autocomplete, Button, Checkbox, DialogActions, DialogContent, DialogTitle, Grid, TextField, Tooltip, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import ProductCategoryFormDialogContent from '../productCategories/ProductCategoryFormDialogContent';
import { useProductApp } from './ProductsProvider';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import CostCenterSelector from '../../masters/costCenters/CostCenterSelector';
import LedgerSelect from '../../accounts/ledgers/forms/LedgerSelect';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import productServices from './productServices';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';

const ProductFormDialogContent = ({ title = 'New Product/Service', product = null, toggleOpen }) => {
  const DefaultContent = () => {
    const { productCategories, item_names, brands, models, measurementUnits, specifications, storeOptions } = useProductApp();
    const { enqueueSnackbar } = useSnackbar();
    const { authOrganization } = useJumboAuth();
    const { costCenters } = authOrganization;
    const queryClient = useQueryClient();
    const [isInventory, setIsInventory] = useState(false);
    const [isVatExempt, setIsVatExempt] = useState(product ? product.vat_exempted === 1 : false);

    const validationObject = {
      item_name: yup.string().required('Item name is required'),
      product_category_id: yup.number().min(1, 'Product category is required').required('Product category is required'),
      measurement_unit_id: yup.number().min(1, 'Measurement unit is required').required('Measurement unit is required'),
      type: yup.string().required('Item type is required'),
    };

    if (!product) {
        validationObject.store_id = yup.mixed().nullable();
                
        validationObject.cost_center_id = yup
            .number()
            .nullable()
            .when('store_id', {
                is: (store_id) => Boolean(store_id),
                then: (schema) =>
                schema
                    .typeError('Cost center is required')
                    .required('Cost center is required')
                    .min(1, 'Cost center is required'),
                otherwise: (schema) => schema.nullable(),
            });

        validationObject.stock_complement_ledger_id = yup
            .number()
            .nullable()
            .when('store_id', {
                is: (store_id) => Boolean(store_id),
                then: (schema) =>
                schema
                    .typeError('Stock Complement Ledger is required')
                    .required('Stock Complement Ledger is required')
                    .min(1, 'Stock Complement Ledger is required'),
                otherwise: (schema) => schema.nullable(),
            });

        validationObject.unit_cost = yup
            .number()
            .nullable()
            .when('store_id', {
                is: (store_id) => Boolean(store_id),
                then: (schema) =>
                schema
                    .typeError('Unit cost is required')
                    .required('Unit cost is required')
                    .positive('Unit cost must be positive'),
                otherwise: (schema) => schema.nullable(),
            });

        validationObject.opening_balance_date = yup
            .string()
            .nullable()
            .when('store_id', {
                is: (store_id) => Boolean(store_id),
                then: (schema) =>
                schema
                    .typeError('Opening balance date is required')
                    .required('Opening balance date is required'),
                otherwise: (schema) => schema.nullable(),
            });

    }

    const validationSchema = yup.object(validationObject);
    const { register, setValue, watch, handleSubmit, clearErrors, formState: { errors } } = useForm({
      resolver: yupResolver(validationSchema),
      defaultValues: {
        measurement_unit_id: product?.id && product.measurement_unit_id,
        item_name: product?.id && product.item_name,
        product_category_id: product?.id && product.product_category_id,
        type: product?.id && product.type,
        id: product?.id && product.id,
        cost_center_id: (costCenters.length === 1 && costCenters[0].id) || null,
        vat_exempted: isVatExempt,
        store_id: null,
        opening_balance: null,
        unit_cost: null,
        opening_balance_date: null,
      },
    });

    useEffect(() => {
      if (costCenters.length === 1) {
        setValue('cost_center_id', costCenters[0].id);
      }
    }, [costCenters]);

    const addProduct = useMutation({
      mutationFn: productServices.add,
      onSuccess: (data) => {
        toggleOpen(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product_select_options'] });
        queryClient.invalidateQueries({ queryKey: ['productParams'] });
      },
      onError: (error) => {
        enqueueSnackbar(error?.response?.data?.message || 'Failed to add product', { variant: 'error' });
      },
    });

    const updateProduct = useMutation({
      mutationFn: productServices.update,
      onSuccess: (data) => {
        toggleOpen(false);
        enqueueSnackbar(data.message, { variant: 'success' });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product_select_options'] });
        queryClient.invalidateQueries({ queryKey: ['productParams'] });
      },
      onError: (error) => {
        enqueueSnackbar(error?.response?.data?.message || 'Failed to update product', { variant: 'error' });
      },
    });

    const saveMutation = React.useMemo(() => {
      return product?.id ? updateProduct.mutate : addProduct.mutate;
    }, [updateProduct, addProduct]);

    return (
      <form autoComplete="false" onSubmit={handleSubmit(saveMutation)}>
        <DialogTitle sx={{ textAlign: 'center' }}>{title}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size="small"
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  options={productCategories}
                  defaultValue={product?.id && productCategories.find(category => category.id === product.product_category_id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Tooltip title={'Quick Add Category'}>
                            <AddOutlined
                              sx={{ cursor: 'pointer' }}
                              onClick={() => {
                                setContent(<ProductCategoryFormDialogContent productCategories={productCategories} onClose={() => setContent(<DefaultContent />)} />);
                              }}
                            />
                          </Tooltip>
                        ),
                      }}
                      error={!!errors.product_category_id}
                      helperText={errors.product_category_id?.message}
                    />
                  )}
                  onChange={(event, newValue) => {
                    setValue('product_category_id', newValue ? newValue.id : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size="small"
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.name === value.name}
                  options={[
                    { name: 'Inventory' },
                    { name: 'Non-Inventory' },
                    { name: 'Service' },
                    // { name: 'Individually-Tracked' }
                  ]}
                  defaultValue={product?.id && { name: product.type }}
                  disabled={!!product?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Type"
                      error={!!errors.type}
                      helperText={errors.type?.message}
                    />
                  )}
                  onChange={(event, newValue) => {
                    setValue('type', newValue ? newValue.name : '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    if (newValue?.name === 'Inventory') {
                      setIsInventory(true);
                    } else {
                      setIsInventory(false);
                    }
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size="small"
                  freeSolo
                  getOptionLabel={(option) => option}
                  isOptionEqualToValue={(option, value) => option === value}
                  options={item_names}
                  defaultValue={product?.id && product.item_name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Item Name"
                      error={!!errors.item_name}
                      helperText={errors.item_name?.message}
                    />
                  )}
                  onChange={(event, newValue) => {
                    setValue('item_name', newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('item_name', newValue ? newValue : '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size="small"
                  freeSolo
                  getOptionLabel={(option) => option}
                  isOptionEqualToValue={(option, value) => option === value}
                  options={brands}
                  defaultValue={product?.id && product.brand}
                  renderInput={(params) => <TextField {...params} label="Brand (Optional)" />}
                  onChange={(event, newValue) => {
                    setValue('brand', newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('brand', newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size="small"
                  freeSolo
                  getOptionLabel={(option) => option}
                  isOptionEqualToValue={(option, value) => option === value}
                  options={models}
                  defaultValue={product?.id && product.model}
                  renderInput={(params) => <TextField {...params} label="Model (Optional)" />}
                  onChange={(event, newValue) => {
                    setValue('model', newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('model', newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  autoComplete="off"
                  label="SKU (Optional)"
                  defaultValue={product?.id && product.sku}
                  {...register('sku')}
                  error={!!errors.sku || !!addProduct.error?.response.data.validation_errors.sku || !!updateProduct.error?.response.data.validation_errors.sku}
                  helperText={errors.sku?.message || addProduct.error?.response.data.validation_errors.sku || updateProduct.error?.response.data.validation_errors.sku}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size="small"
                  freeSolo
                  getOptionLabel={(option) => option}
                  isOptionEqualToValue={(option, value) => option === value}
                  options={specifications}
                  defaultValue={product?.id && product.specifications}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      rows={2}
                      label="Specifications (Optional)"
                    />
                  )}
                  onChange={(event, newValue) => {
                    setValue('specifications', newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  onInputChange={(event, newValue) => {
                    setValue('specifications', newValue, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size="small"
                  getOptionLabel={(option) =>
                    option.name !== option.symbol ? `${option.name} (${option.symbol})` : option.name
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  options={measurementUnits}
                  defaultValue={product?.id && measurementUnits.find(unit => unit.id === product.measurement_unit_id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Primary Measurement Unit"
                      error={!!errors.measurement_unit_id}
                      helperText={errors.measurement_unit_id?.message}
                    />
                  )}
                  onChange={(event, newValue) => {
                    setValue('measurement_unit_id', newValue ? newValue.id : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Checkbox
                  checked={isVatExempt}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setIsVatExempt(isChecked);
                    setValue('vat_exempted', isChecked, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                VAT Exempted
              </Div>
            </Grid>
            <Grid size={12}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  multiline={true}
                  rows={2}
                  label="Description (Optional)"
                  defaultValue={product?.id && product.description}
                  {...register('description')}
                />
              </Div>
            </Grid>
          </Grid>
          {!product && isInventory && (
            <Grid container spacing={1}>
              <Grid size={12} mt={1}>
                <Typography variant="h5">Opening Balance Details</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <CostCenterSelector
                    label="Cost Center"
                    multiple={false}
                    defaultValue={costCenters.length === 1 ? costCenters[0] : null}
                    frontError={errors.cost_center_id}
                    onChange={(newValue) => {
                      setValue('cost_center_id', newValue?.id || null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <LedgerSelect
                    label={'Stock Complement Ledger'}
                    allowedGroups={['Capital', 'Expenses', 'Accounts Payable']}
                    frontError={errors.stock_complement_ledger_id}
                    onChange={(newValue) =>
                      setValue('stock_complement_ledger_id', !!newValue ? newValue.id : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label="As of"
                    fullWidth
                    minDate={dayjs(authOrganization.organization.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                        error: !!errors?.opening_balance_date,
                        helperText: errors?.opening_balance_date?.message,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('opening_balance_date', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    size="small"
                    options={storeOptions}
                    getOptionLabel={(option) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Store"
                        error={!!errors?.store_id}
                        helperText={errors?.store_id?.message}
                      />
                    )}
                    onChange={(event, newValue) => {
                      !newValue && clearErrors('opening_balance');
                      !newValue && clearErrors('unit_cost');
                      setValue('store_id', newValue ? newValue.id : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    label="Opening Balance"
                    fullWidth
                    size="small"
                    error={!!errors?.opening_balance}
                    helperText={errors?.opening_balance?.message}
                    {...register('opening_balance')}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    label="Unit Cost"
                    fullWidth
                    size="small"
                    InputProps={{
                      inputComponent: CommaSeparatedField,
                    }}
                    error={!!errors?.unit_cost}
                    helperText={errors?.unit_cost?.message}
                    onChange={(e) => {
                      setValue('unit_cost', e.target.value ? sanitizedNumber(e.target.value) : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => toggleOpen(false)}>Cancel</Button>
          <LoadingButton
            type="submit"
            loading={addProduct.isPending || updateProduct.isPending}
            variant="contained"
            size="small"
          >
            Save
          </LoadingButton>
        </DialogActions>
      </form>
    );
  };

  const [content, setContent] = useState(<DefaultContent />);

  return content;
};

export default ProductFormDialogContent;