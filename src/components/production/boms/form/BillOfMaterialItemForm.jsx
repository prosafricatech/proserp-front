import {
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';

function BillOfMaterialItemForm({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  item = null,
  index = -1,
  setItems,
  items = [],
  setShowForm = null,
}) {
  const { productOptions } = useProductsSelect();
  const { checkOrganizationPermission } = useJumboAuth();

  // Filter out non-inventory products
  const nonInventoryIds = productOptions
    ?.filter((p) => p.type !== 'Inventory')
    .map((p) => p.id);

  const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
  const [addedProduct, setAddedProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(
    item && (item.measurement_unit_id || item.measurement_unit?.id)
  );
  const [isAdding, setIsAdding] = useState(false);

  // Validation schema
  const validationSchema = yup.object({
    product: yup
      .object()
      .required('Material is required')
      .typeError('Material is required'),
    quantity: yup.number().when('product', {
      is: (product) => !!product && product.type === 'Inventory',
      then: (schema) =>
        schema
          .required('Quantity is required')
          .positive('Quantity must be positive')
          .typeError('Quantity is required'),
    }),
  });

  // Form hook
  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      product:
        item &&
        productOptions.find(
          (product) => product.id === (item.product_id || item.product.id)
        ),
      alternatives: item?.alternatives,
      product_id: item?.product_id,
      quantity: item?.quantity,
      measurement_unit_id:
        item && (item.measurement_unit_id || item.measurement_unit?.id),
      conversion_factor: item?.conversion_factor || 1,
      unit_symbol: item?.measurement_unit?.symbol || item?.unit_symbol,
    },
  });

  // Track dirty state
  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  // When a new product is quick-added, patch the form
  useEffect(() => {
    if (addedProduct?.id) {
      setValue('product', addedProduct);
      setValue('product_id', addedProduct.id);
      setValue('measurement_unit_id', addedProduct.measurement_unit_id);
      setValue('unit_symbol', addedProduct.measurement_unit.symbol);
      setSelectedUnit(addedProduct.measurement_unit_id);
      setOpenProductQuickAdd(false);
    }
  }, [addedProduct, setValue]);

  const product = watch('product');
  const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

  const updateItems = async (formItem) => {
    setIsAdding(true);

    if (index > -1) {
      // Editing existing item
      const updatedItems = [...items];
      updatedItems[index] = formItem;
      await setItems(updatedItems);
    } else {
      // Adding new item
      await setItems((prev) => [...prev, formItem]);
      if (submitItemForm) {
        submitMainForm();
      }
    }

    // Reset and cleanup
    reset();
    setClearFormKey((prev) => prev + 1);
    setSubmitItemForm(false);
    setIsDirty(false);
    setShowForm && setShowForm(false);
    setIsAdding(false);
  };

  // External trigger for submission
  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => setSubmitItemForm(false))();
    }
  }, [submitItemForm, handleSubmit]);

  if (isAdding) return <LinearProgress />;

  return (
    <form autoComplete="off" onSubmit={handleSubmit(updateItems)}>
      <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
        <Grid size={12}>
          <Divider />
        </Grid>

        {/* Quick Add Mode */}
        {openProductQuickAdd && !item && (
          <Grid size={12} textAlign="center">
            <Typography variant="h5">
              Quick Input Product Registration
            </Typography>
          </Grid>
        )}

        {/* Normal Form Mode */}
        {!openProductQuickAdd && (
          <>
            <Grid size={{xs: 12, md: 8}}>
              <ProductSelect
                label="Input Product"
                frontError={errors.product}
                addedProduct={addedProduct}
                defaultValue={item && item.product}
                excludeIds={nonInventoryIds}
                onChange={async (newValue) => {
                  if (newValue) {
                    setSelectedUnit(null);
                    setValue('product', newValue, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    const unitId =
                      newValue.primary_unit?.id || newValue.measurement_unit_id;
                    const unitSymbol =
                      newValue.primary_unit?.unit_symbol ||
                      newValue.measurement_unit.symbol;
                    setSelectedUnit(unitId);
                    setValue('measurement_unit_id', unitId);
                    setValue('unit_symbol', unitSymbol);
                    setValue('product_id', newValue.id);
                  } else {
                    setValue('product', null, { shouldDirty: true });
                    setValue('measurement_unit_id', null);
                    setValue('unit_symbol', null);
                    setValue('product_id', null);
                  }
                }}
                startAdornment={
                  checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE]) && (
                    <Tooltip title="Add New Input Product">
                      <AddOutlined
                        onClick={() => setOpenProductQuickAdd(true)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Tooltip>
                  )
                }
              />
            </Grid>

            <Grid size={{xs: 12, md: 4}}>
              <TextField
                label="Quantity"
                fullWidth
                size="small"
                defaultValue={item?.quantity}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                  endAdornment:
                    !!product &&
                    !!selectedUnit && (
                      <FormControl fullWidth>
                        <Select
                          value={selectedUnit}
                          onChange={(e) => {
                            const selectedUnitId = e.target.value;
                            setSelectedUnit(selectedUnitId);
                            const unit = combinedUnits?.find(
                              (u) => u.id === selectedUnitId
                            );
                            if (unit) {
                              setValue('conversion_factor', unit.conversion_factor);
                              setValue('measurement_unit_id', unit.id);
                              setValue('unit_symbol', unit.unit_symbol);
                            }
                          }}
                          variant="standard"
                          size="small"
                          MenuProps={{
                            PaperProps: { style: { borderRadius: 0 } },
                          }}
                        >
                          {product?.primary_unit ? (
                            combinedUnits?.map((unit) => (
                              <MenuItem key={unit.id} value={unit.id}>
                                {unit.unit_symbol}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem
                              key={product?.measurement_unit?.id}
                              value={product?.measurement_unit?.id}
                            >
                              {product?.measurement_unit?.symbol}
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    ),
                }}
                error={!!errors?.quantity}
                helperText={errors?.quantity?.message}
                onChange={(e) =>
                  setValue(
                    'quantity',
                    e.target.value ? sanitizedNumber(e.target.value) : 0,
                    { shouldValidate: true, shouldDirty: true }
                  )
                }
              />
            </Grid>

            <Grid size={12} textAlign="end">
              <Button
                variant="contained"
                size="small"
                type="submit"
                onClick={() => {
                  setAddedProduct(null);
                  setIsDirty(false);
                }}
              >
                {item ? (
                  <>
                    <CheckOutlined fontSize="small" /> Done
                  </>
                ) : (
                  <>
                    <AddOutlined fontSize="small" /> Add
                  </>
                )}
              </Button>

              {item && (
                <Tooltip title="Close Edit">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowForm(false);
                      setIsDirty(false);
                    }}
                  >
                    <DisabledByDefault fontSize="small" color="success" />
                  </IconButton>
                </Tooltip>
              )}
            </Grid>
          </>
        )}

        {/* Quick Add Component */}
        {openProductQuickAdd && (
          <ProductQuickAdd
            setOpen={setOpenProductQuickAdd}
            setAddedProduct={setAddedProduct}
          />
        )}
      </Grid>
    </form>
  );
}

export default BillOfMaterialItemForm;
