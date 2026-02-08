import { AddOutlined, DisabledByDefault } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Autocomplete, Button, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, Input, LinearProgress, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import storeServices from '../../store-services'
import { useStoreProfile } from '../StoreProfileProvider'
import { useSnackbar } from 'notistack'
import stockAdjustmentServices from './stock-adjustment-services'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Div } from '@jumbo/shared'
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector'
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect'
import ProductSelect from '@/components/productAndServices/products/ProductSelect'
import productServices from '@/components/productAndServices/products/productServices'
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField'
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers'

function StockAdjustmentDialogForm({toggleOpen,stockAdjustment = null}) {
  //Initial necessary constants
  const {authOrganization} = useJumboAuth();
  const {activeStore} = useStoreProfile();
  const {enqueueSnackbar} = useSnackbar();
  const itemTemplate = {product_id:0,actual_stock:'',current_stock:0,average_cost:0};
  const queryClient = useQueryClient();
  const [reasonSelectorDisabled, setReasonSelectorDisabled] = useState(!!stockAdjustment);
  const [switchToExcell, setSwitchToExcell] = useState(false);
  const {ungroupedLedgerOptions} = useLedgerSelect();

  //Initiate/Define reasons options
  const reasons = [
    {reason:'Opening balance'},
    {reason:'Stock-taking'},
    {reason:'Returned goods'},
    {reason:'Write-offs'},
    {reason:'Internal'},
    {reason:'Waste'},
    {reason:'Others'}
  ];

  // Validation schema
  const validationSchema = yup.object({
    reason: yup.string().required('Reason is required'),
    adjustment_date: yup.string().required('Adjustment Date is required').typeError('Adjustment Date is required'),
    cost_center_id: yup.number().min(-1, 'Cost center is required').required('Cost center is required').typeError('Cost center is required'),
    stock_complement_ledger_id: yup.number().required('Stock Complement Ledger is required').typeError('Stock Complement Ledger is required'),
    narration: yup.string().required('Narration is required').typeError('Narration is required'),
    ...(!switchToExcell && {
      items: yup.array().of(
        yup.object().shape({
          product_id: yup.number().required("Product is required").positive('Product is required'),
          actual_stock: yup.number().required("Actual stock is required").typeError('Actual stock is required'),
          average_cost: yup.number('Average cost is required')
            .required('Average cost is required')
            .positive('Average cost is required').typeError('Average cost is required')
          })
        ),
    }),
  });

  const {handleSubmit, setValue, control, register, watch, formState: {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: stockAdjustment ? stockAdjustment.id : null,
      reason: stockAdjustment ? stockAdjustment.reason : 'Stock-taking',
      cost_center_id: stockAdjustment && stockAdjustment.inventory_movements[0].cost_center_id,
      adjustment_date: stockAdjustment ? stockAdjustment.adjustment_date : dayjs().toISOString(),
      store_id: activeStore.id,
      stock_complement_ledger_id: stockAdjustment?.stock_complement_ledger && stockAdjustment?.stock_complement_ledger?.id,
      narration: stockAdjustment && stockAdjustment.narration,
      items: stockAdjustment ? stockAdjustment.inventory_movements : (!!switchToExcell ? [] : [itemTemplate]),
    }
  }); 

  //Field Array definitions
  const {fields,append,remove} = useFieldArray({
    name: 'items',
    control
  });

  //Retrieve already existed in store
  const { data: existedProducts, isFetching: isFetchingExistedProducts } = useQuery({
    queryKey: ['existedProducts', { storeId: activeStore.id, cost_center_id: watch('cost_center_id') }],
    queryFn: async () => {
      return stockAdjustment ? { data: [] } : await storeServices.getExistedProducts(activeStore.id);
    },
  });

  const addStockAdjustment = useMutation({
    mutationFn: stockAdjustmentServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['storeStockAdjustments'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const updateStockAdjustment = useMutation({
    mutationFn: stockAdjustmentServices.update,
    onSuccess: (data) => {
      if (data?.message) enqueueSnackbar(data.message, { variant: 'success' });
      toggleOpen(false);
      queryClient.invalidateQueries({ queryKey: ['storeStockAdjustments'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  useEffect(() => {
    if(switchToExcell){
      setValue('items',[]);
    }
  }, [switchToExcell])  

  const saveStockAdjustment = React.useMemo(() => {
      return stockAdjustment ? updateStockAdjustment.mutate : addStockAdjustment.mutate
  },[updateStockAdjustment,addStockAdjustment]);

  const stockChange = (index) => {
    const actual_stock = parseFloat(watch(`items.${index}.actual_stock`)) || 0;
    const current_stock = parseFloat(watch(`items.${index}.current_stock`)) || 0;
    const stock_change = actual_stock === '' ? 0 : actual_stock - current_stock;
    return stock_change;
  }

  return (
    <>
      <DialogTitle textAlign={'center'}>{stockAdjustment ? `Edit: ${stockAdjustment.adjustmentNo}` : `New Stock Adjustment`}</DialogTitle>
      <DialogContent>
        <form autoComplete='false'>
          <Grid container columnSpacing={1}>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{mt: 1, mb: 1}}>
                <DateTimePicker
                  label="Adjustment Date (MM/DD/YYYY)"
                  fullWidth
                  minDate={dayjs(authOrganization.organization.recording_start_date)}
                  maxDate={dayjs()}
                  disabled={!!stockAdjustment}
                  readOnly={reasonSelectorDisabled}
                  defaultValue={stockAdjustment ? dayjs(stockAdjustment.adjustment_date) : dayjs()}
                  slotProps={{
                      textField : {
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                          error: !!errors?.adjustment_date,
                          helperText: errors?.adjustment_date?.message
                      }
                  }}
                  onChange={(newValue) => {
                    setValue('adjustment_date', newValue ? newValue.toISOString() : null,{
                        shouldValidate: true,
                        shouldDirty: true
                    });
                }}
                
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{mt: 1, mb: 1}}>
                  <Autocomplete
                      size="small"
                      isOptionEqualToValue={(option, value) => option.reason === value.reason}
                      options={reasons}
                      readOnly={reasonSelectorDisabled}
                      getOptionLabel={(option) => option.reason}
                      defaultValue={reasons.find(reason => reason.reason === (!!stockAdjustment ? stockAdjustment.reason : 'Stock-taking'))}
                      renderInput={(params) => (
                          <TextField 
                              {...params} 
                              label="Reason"
                              error={!!errors?.reason}
                              helperText={errors?.reason?.message}
                          />
                      )}
                      onChange={(event, newValue) => {
                          setValue('reason',newValue ? newValue.reason : '',{
                              shouldValidate: true,
                              shouldDirty: true
                          });
                      }}
                  />
                </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
                <Div sx={{mt: 1, mb: 1}}>
                    <TextField
                        size="small"
                        label="Reference"
                        fullWidth
                        {...register('reference')}
                    />
                </Div>
            </Grid>
            <Grid size={{xs: 12, md: 8}}>
                <Div sx={{mt: 1, mb: 1}}>
                    <CostCenterSelector
                      label="Cost Center"
                      multiple={false}
                      frontError={errors.cost_center_id}
                      readOnly={reasonSelectorDisabled}
                      defaultValue={stockAdjustment && stockAdjustment.inventory_movements[0].cost_center}
                      onChange={(newValue) => {
                        setValue('cost_center_id', newValue?.id ? newValue.id : null,{
                          shouldValidate: true,
                          shouldDirty: true
                        });
                      }}
                    />
                </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{mt: 1, mb: 1}}>
                <LedgerSelect
                  label={'Stock Complement Ledger'}
                  allowedGroups={['Capital','Expenses','Accounts Payable']}
                  frontError={errors.stock_complement_ledger_id}
                  defaultValue={ungroupedLedgerOptions.find(ledger => ledger.id === watch(`stock_complement_ledger_id`))}
                  onChange={(newValue) => setValue('stock_complement_ledger_id', !!newValue ? newValue.id : null,{
                      shouldValidate: true,
                      shouldDirty: true
                  })}
                />
              </Div>
            </Grid>
            <Grid size={12}>
              <Stack spacing={1} direction={'row'} p={1}>
                <Typography>Import Excel</Typography>
                <Switch
                  onClick={() => setSwitchToExcell(!switchToExcell)}
                  size='small'
                />
              </Stack>
            </Grid>
          </Grid>
          { 
          !switchToExcell &&
              fields.map((field, index) => {
                const unit_symbol = stockAdjustment ? field.product.measurement_unit.symbol : watch(`items.${index}.unit_symbol`);
                const currentStock = stockAdjustment ? field.balance_before : watch(`items.${index}.current_stock`);
                const stock_change = stockAdjustment ? (field.type === 'in' ? field.quantity : -field.quantity) : stockChange(index);
                return (
                  <React.Fragment key={field.id}  >
                      <Grid container 
                          columnSpacing={1} 
                          marginTop={1} 
                        >
                        <Grid size={{xs: 12, md: 6}}>
                          <Div sx={{mt: 1, mb: 1}}>
                            {
                              isFetchingExistedProducts ? <LinearProgress/> :
                              <ProductSelect
                                readOnly={!!stockAdjustment}
                                defaultValue={stockAdjustment && field.product}
                                frontError={errors.items && errors?.items[index]?.product_id}
                                excludeIds={(watch('reason') === "Opening balance" && !stockAdjustment) ? existedProducts.map(product => product.product_id) : []}
                                onChange={async(newValue) => {
                                  if(newValue){
                                    setValue(`items.${index}.unit_symbol`,newValue.unit_symbol);
                                    const productStock = await productServices.getStoreBalances({
                                      productId : newValue.id,
                                      costCenterId: watch('cost_center_id'),
                                      storeIds: [activeStore.id],
                                      as_at: watch('adjustment_date')
                                    });
                                    setReasonSelectorDisabled(true);

                                    //extract the current stock from API response
                                    const currentStock = productStock && productStock.stock_balances.find(stock => stock.store_id === activeStore.id && stock.cost_center_id === watch('cost_center_id'));

                                    setValue(`items.${index}.current_stock`,!!currentStock?.balance ? currentStock.balance : 0,{
                                      shouldValidate: true,
                                      shouldDirty: true
                                    });
                                    setValue(`items.${index}.product_id`,newValue.id,{
                                      shouldValidate: true,
                                      shouldDirty: true
                                    });
                                    setValue(`items.${index}.average_cost`,!!currentStock?.unit_cost ? currentStock.unit_cost : 0);
                                  } else {
                                    setValue(`items.${index}.unit_symbol`,'');
                                    setValue(`items.${index}.average_cost`,0);
                                    setValue(`items.${index}.product_id`,0,{
                                      shouldValidate: true,
                                      shouldDirty: true
                                    });
                                  }
                                    
                                }}
                              />
                            }
                          </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 6}}>
                          <Div sx={{mt: 1, mb: 1}}>
                            <TextField
                              label="Description"
                              fullWidth
                              size='small'
                              error={errors.items && !!errors?.items[index]?.description}
                              helperText={errors.items && errors?.items[index]?.description?.message}
                              {...register(`items.${index}.description`)}
                            />
                          </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                          <Div sx={{mt: 1, mb: 1}}>
                            <TextField
                              label="Current Stock"
                              fullWidth
                              size='small'
                              InputProps={{
                                readOnly: true,
                                endAdornment: <span>{unit_symbol}</span>
                              }}
                              value={currentStock}
                            />
                          </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 3}}>
                          <Div sx={{mt: 1, mb: 1}}>
                            <TextField
                              label="Actual Stock"
                              fullWidth
                              size='small'
                              InputProps={{ 
                                endAdornment: <span>{unit_symbol}</span>,
                                readOnly: !!stockAdjustment
                               }}
                              {...register(`items.${index}.actual_stock`)}
                              error={errors.items && !!errors?.items[index]?.actual_stock}
                              helperText={errors.items && errors?.items[index]?.actual_stock?.message}
                            />
                          </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 2}}>
                          <Div sx={{mt: 1, mb: 1}}>
                            <TextField
                              label="Change in Stock"
                              fullWidth
                              size='small'
                              value={stock_change}
                              type='number'
                              readOnly
                            />
                          </Div>
                        </Grid>
                        <Grid size={{xs: 10, md: 3}}>
                          <Div sx={{mt: 1, mb: 1}}>
                            <TextField
                              label="Average Cost"
                              fullWidth
                              size="small"
                              error={errors.items && !!errors?.items[index]?.average_cost}
                              helperText={errors.items && errors?.items[index]?.average_cost?.message}
                              InputProps={{
                                  inputComponent: CommaSeparatedField,
                              }}
                              value={watch(`items.${index}.average_cost`)}
                              onChange={(e) => {
                                setValue(`items.${index}.average_cost`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                                  shouldValidate: true,
                                  shouldDirty: true
                                });
                              }}
                            />
                          </Div>
                        </Grid>
                        {fields.length > 1 && !stockAdjustment && (
                          <Grid ssize={{xs: 2, md: 1}}>
                              <Div sx={{mt: 1, mb: 1}}>
                                  <Tooltip title='Remove Row'>
                                      <IconButton size='small' onClick={() => remove(index)}>
                                        <DisabledByDefault fontSize='small' color='error'/>
                                      </IconButton>
                                  </Tooltip>
                              </Div>
                          </Grid>
                        )}
                      </Grid>
                      <Divider/>
                  </React.Fragment>
              )
            })
          }
            <Grid container columnSpacing={1}>
                {
                  !switchToExcell &&
                  !stockAdjustment &&
                  <Grid size={12} sx={{ 
                      display: 'flex',
                      direction:'row',
                      justifyContent: 'flex-end'
                    }}>
                      <Div sx={{mt: 1, mb: 1}}>
                          <Tooltip title='Add row'>
                              <Button size='small' variant='outlined' onClick={() => append(itemTemplate)}>
                                  <AddOutlined fontSize='10' /> Add
                              </Button>
                          </Tooltip>
                      </Div>
                  </Grid>
                }
                {!!switchToExcell &&
                  <Grid size={12}>
                    <Input
                        label={'Stock Excel'}
                        type="file"
                        required
                        id="excel-import"
                        {...register("stock_excel")}
                    />
                  </Grid>
                }
                <Grid size={12}>
                    <Div sx={{mt: 1, mb: 1}}>
                        <TextField
                            label='Narration'
                            multiline={true}
                            rows={2}
                            fullWidth
                            error={!!errors?.narration}
                            helperText={errors?.narration?.message}
                            size='small'
                            {...register('narration')}
                        />
                    </Div>
                </Grid>
            </Grid>
          </form>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton onClick={handleSubmit(saveStockAdjustment)} loading={addStockAdjustment.isPending || updateStockAdjustment.isPending} type='submit' size='small' variant='contained'>
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  )
}

export default StockAdjustmentDialogForm