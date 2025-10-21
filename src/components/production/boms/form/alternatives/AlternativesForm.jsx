import { Button, FormControl, Grid, IconButton, LinearProgress, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ProductQuickAdd from '@/components/productAndServices/products/ProductQuickAdd';

function AlternativesForm({alternativeIndex, alternative, setItems, alternatives=[], setAlternatives, setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, setIsDirty, index = -1, setShowForm = null}) {
    const { productOptions } = useProductsSelect();
    const {checkOrganizationPermission} = useJumboAuth();
    const nonInventoryIds = productOptions?.filter(product => product.type !== 'Inventory').map(product => product.id);
    const [openProductQuickAdd, setOpenProductQuickAdd] = useState(false);
    const [addedProduct, setAddedProduct] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(alternative && (alternative.measurement_unit_id ? alternative.measurement_unit_id : alternative.measurement_unit.id));

    const validationSchema = yup.object({
        product: yup.object().required("Material is required").typeError('Material is required'),
        quantity: yup
            .number()
            .when(['product'], {
            is: (product) =>
                !!product && product.type === 'Inventory',
        then: yup
            .number()
            .required("Quantity is required")
            .positive("Quantity must be a positive number")
            .typeError('Quantity is required'),
        }),
    })

  const {setValue, handleSubmit, watch, reset, formState: {errors, dirtyFields}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
        product: alternative && productOptions.find(product => product.id === (alternative.product_id || alternative.product.id)),
        product_id: alternative && alternative.product_id,
        quantity: alternative && alternative.quantity,
        remarks: alternative && alternative.remarks,
        measurement_unit_id: alternative && (alternative.measurement_unit_id ? alternative.measurement_unit_id : alternative.measurement_unit.id),
        conversion_factor: alternative ? alternative.conversion_factor : 1,
        unit_symbol: alternative && (alternative.measurement_unit?.symbol ? alternative.measurement_unit?.symbol : alternative.unit_symbol),
    }
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0); // Update dirty state
  }, [dirtyFields, setIsDirty, watch]);

  useEffect(() => {
    if(addedProduct?.id){
        setValue('product', addedProduct);
        setValue('product_id', addedProduct?.id);
        setValue('measurement_unit_id', addedProduct.measurement_unit_id);
        setValue('unit_symbol', addedProduct.measurement_unit.symbol);
        setSelectedUnit(addedProduct?.measurement_unit_id)
        setOpenProductQuickAdd(false)
    }
  }, [addedProduct])

  const product = watch('product');
  const [isAdding, setIsAdding] = useState(false);

    const updateItems = async (alternative) => {
        setIsAdding(true);
        if (index > -1) {
            let updatedAlternative = [...alternatives];
            updatedAlternative[index] = alternative;
            await setAlternatives(updatedAlternative);
            setClearFormKey(prevKey => prevKey + 1);
        } else {
            await setAlternatives((alternativeProduct) => [...alternativeProduct, alternative]);
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
      if (!alternative) {
          setItems((prevItems) => {
              return prevItems.map((item, index) => {
                  if (index === alternativeIndex) {
                  return { ...item, alternatives: [...alternatives] };
                  }
                  return item;
              });
          });   
      }
    }, [alternatives]);

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false); // Reset submitItemForm if there are errors
      })();
    }
  }, [submitItemForm]);

  const combinedUnits = product?.secondary_units?.concat(product?.primary_unit);

  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
      <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
        {!!openProductQuickAdd && !alternative && (
          <Grid size={12} textAlign={'center'} >
            <Typography variant='h5'>Quick Alternative Input Product Registration</Typography>
          </Grid>
        )}
        {!openProductQuickAdd && 
          <>
            <Grid size={{xs: 12, md: 8}}>
              <ProductSelect
                label='Alternative Input Product'
                frontError={errors.product}
                addedProduct={addedProduct}
                defaultValue={alternative && alternative.product}
                excludeIds={nonInventoryIds}
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

                  } else {
                    setValue(`product`, null, {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                    setValue(`measurement_unit_id`, null);
                    setValue(`unit_symbol`, null);
                    setValue(`product_id`,null);
                  }
                }}
                startAdornment={
                  checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE]) &&
                  <Tooltip title={'Add New Material'}>
                    <AddOutlined
                      onClick={() => setOpenProductQuickAdd(true)}
                      sx={{
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <TextField
                label="Quantity"
                fullWidth
                size='small'
                defaultValue={alternative && alternative.quantity}
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
                onChange={(e)=> {
                    setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value ) : 0,{
                        shouldValidate: true,
                        shouldDirty: true
                    });
                }}
              />
            </Grid>
            <Grid size={12} textAlign={'end'}>
              <Button
                variant='contained'
                size='small'
                type='submit'                  
                onClick={() => {
                  setAddedProduct(null);
                  setIsDirty(false)
                }}      
              >
                {
                  alternative ? (
                    <><CheckOutlined fontSize='small' /> Done</>
                  ) : (
                    <><AddOutlined fontSize='small' /> Add</>
                  )
                }
              </Button>
              {
                alternative && 
                <Tooltip title='Close Edit'>
                  <IconButton size='small' 
                    onClick={() => {
                      setShowForm(false);
                      setIsDirty(false)
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success'/>
                  </IconButton>
                </Tooltip>
              }
            </Grid>
          </>
        }

        {!!openProductQuickAdd && <ProductQuickAdd setOpen={setOpenProductQuickAdd} setAddedProduct={setAddedProduct}/>}
      </Grid>
    </form>
  )
}

export default AlternativesForm