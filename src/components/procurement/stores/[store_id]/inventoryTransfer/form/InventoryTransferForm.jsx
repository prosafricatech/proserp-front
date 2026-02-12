import React, { useState, useEffect } from 'react';
import { Alert, Autocomplete, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import InventoryTransferItemRow from './InventoryTransferItemRow';
import InventoryTrasferItemForm from './InventoryTrasferItemForm';
import storeServices from '../../../store-services';
import { useStoreProfile } from '../../StoreProfileProvider';
import inventoryTransferServices from '../inventoryTransfer-services';
import StoreSelector from '../../../StoreSelector';
import { HighlightOff } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div } from '@jumbo/shared';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

function InventoryTransferForm({ toggleOpen, transfer = null, type }) {
  const [items, setItems] = useState(transfer ? transfer.items: []);
  const { activeStore, mainStore } = useStoreProfile();
  const [change_cost_center, setCostCenterChange] = useState(transfer ? (transfer?.cost_center_change_transfer !== null ? true : false) : false);
  const [transfer_date] = useState(transfer ? dayjs(transfer.transfer_date) : dayjs());
  const {authOrganization,checkOrganizationPermission} = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const validationSchema = yup.object({
    transfer_date: yup.string().required('Transfer Date is required'),
    narration: yup.string().required('Narration is required'),
    destination_store_id: yup.number().when('type', {
      is: (type) => type === 'external' || type === 'internal',
      then: (schema) => schema.required('Destination Store is required').typeError('Destination Store is required'),
      otherwise: (schema) => schema.nullable()
    }),
    receivable_ledger_id: yup.mixed().when(['type', 'change_cost_center'], {
      is: (type, change_cost_center) =>
        type?.toLowerCase() === 'cost center change' || change_cost_center === 1,
      then: (schema) => schema
        .required('Ledger is required')
        .typeError('Ledger is required'),
      otherwise: (schema) => schema.nullable()
    }),
  });
  
  const { setValue, setError, register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: transfer?.id,
      transfer_date: transfer_date.toISOString(),
      type: transfer ? transfer.type : type,
      vehicle_information: transfer?.vehicle_information || '',
      driver_information: transfer?.driver_information || '',
      source_cost_center_id: transfer?.source_cost_center?.id || null,
      change_cost_center: transfer ? (transfer?.cost_center_change_transfer ? 1 : 0) : 0,
      destination_cost_center_id: transfer?.destination_cost_center?.id || null,
      source_store_id: activeStore.id,
      destination_store_id: transfer ? transfer.destination_store_id : (type === 'cost center change' ? activeStore.id : null),
      narration: transfer?.narration || '',
    }
  });

  const transferDate = watch(`transfer_date`);

  const addInventoryTransfer = useMutation({
    mutationFn: inventoryTransferServices.add,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['inventoryTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['transferDetails'] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const updateInventoryTransfer = useMutation({
    mutationFn: inventoryTransferServices.update,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['inventoryTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['transferDetails'] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) enqueueSnackbar(message, { variant: 'error' });
    },
  });

  useEffect(() => {
    async function loopItems() {
      await setValue(`items`, null);
      await items?.forEach((item, index) => {
        setValue(`items.${index}.product_id`, item?.product?.id ? item.product.id : item.product_id);
        setValue(`items.${index}.quantity`, item?.sending_movement ? item.sending_movement.quantity : item.quantity);
        setValue(`items.${index}.measurement_unit_id`, item.measurement_unit_id ? item.measurement_unit_id : item.measurement_unit.id);
        setValue(`items.${index}.conversion_factor`, item ? item.conversion_factor : 1)
      });
    }
    loopItems();
  }, [items, setValue]);

  const handleFormSubmit = (data) => {
    if (items.length === 0) {
      setError(`items`, {
        type: "manual",
        message: "You must add at least one item",
      });
      return;
    }

    if (isDirty) {
      setShowWarning(true);
      return;
    }

    const submitData = {
      ...data,
      items: items.map(item => ({
        product_id: item.product?.id || item.product_id,
        quantity: item.quantity,
        measurement_unit_id: item.measurement_unit_id,
        conversion_factor: item.conversion_factor || 1
      }))
    };

    if (transfer?.id) {
      updateInventoryTransfer.mutate(submitData);
    } else {
      addInventoryTransfer.mutate(submitData);
    }
  };

  const handleConfirmSubmitWithoutAdd = () => {
    handleSubmit(handleFormSubmit)();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey(prev => prev + 1);
  };

  const {
    data: suggestions,
    isLoading: isFetchingAddresses,
  } = useQuery({
    queryKey: ['address'],
    queryFn: storeServices.getAddresses,
  });

  const {
    data: stores,
    isLoading: isFetchingStores,
  } = useQuery({
    queryKey: ['stores'],
    queryFn: storeServices.getStoreOptions,
  });

  if (isFetchingStores || isFetchingAddresses) {
    return <BackdropSpinner />;
  }

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid size={12}>
          <form autoComplete='off'>
            <Grid size={12} textAlign={"center"} mb={2}>
              {!transfer
                ? type === 'external' ? 'New External Inventory Transfer'
                  : type === 'internal' ? 'New Internal Inventory Transfer'
                    : type === 'cost center change' ? 'New Cost Centers Inventory Transfer'
                      : ''
                : `Edit ${transfer.transferNo}`}
            </Grid>
            <Grid container spacing={1}>
              <Grid size={{xs: 12, md: 6, lg: 6}}>
                <Div sx={{ mt: 1 }}>
                  <DateTimePicker
                    fullWidth
                    label="Transfer Date"
                    defaultValue={transfer_date}
                    minDate={checkOrganizationPermission(PERMISSIONS.INVENTORY_TRANSFERS_BACKDATE) ? dayjs(authOrganization.organization.recording_start_date) : dayjs().startOf('day')}
                    maxDate={checkOrganizationPermission(PERMISSIONS.INVENTORY_TRANSFERS_POSTDATE) ? dayjs().add(10,'year').endOf('year') : dayjs().endOf('day')}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                      }
                    }}
                    onChange={(newValue) => {
                      setValue(`transfer_date`, newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true
                      });
                    }}
                  />
                </Div>
              </Grid>
              { (type === 'internal' || transfer?.type === 'Internal') &&
                  <Grid size={{xs: 12, md: 6, lg: 6}}>
                    <Div sx={{ mt: 1 }}>
                      <StoreSelector
                        allowSubStores={true}
                        proposedOptions={mainStore ? [mainStore] : null}
                        excludeStores={[activeStore]}
                        defaultValue={!!transfer ? transfer.destination_store : null}
                        label="Destination Store"
                        frontError={errors.destination_store_id}
                        onChange={(newValue) => {
                          setValue('destination_store_id', newValue ? newValue.id : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                    </Div>
                  </Grid>
                }
              { (type === 'external' || transfer?.type === 'External') &&
                  <Grid size={{xs: 12, md: 6, lg: 6}}>
                    <Div sx={{ mt: 1 }}>
                      <Autocomplete
                        multiple={false}
                        id="checkboxes-stores"
                        options={stores.filter((store) => store.id !== activeStore.id)}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        getOptionLabel={(option) => option.name}
                        defaultValue={!!transfer ? transfer.destination_store : null}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Destination"
                            size="small"
                            fullWidth
                            error={!!errors.destination_store_id}
                            helperText={errors.destination_store_id?.message}
                          />
                        )}
                        onChange={(e, newValue) => {
                          setValue(`destination_store_id`, newValue ? newValue.id : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                    </Div>
                  </Grid>
                }
                  <Grid size={{xs: 12, md: 6, lg: 6}}>
                    <Div sx={{ mt: 1 }}>
                      <CostCenterSelector
                        multiple={false}
                        withNotSpecified={true}
                        label={type === 'cost center change' ? "Source Cost Center" : "Cost Center"}
                        defaultValue={transfer?.source_cost_center}
                        onChange={(newValue) => {
                          setValue(`source_cost_center_id`, newValue ? newValue.id : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });

                          if (type !== 'cost center change') {
                            setValue(`destination_cost_center_id`, newValue ? newValue.id : null, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                    </Div>
                  </Grid>
               {(type === 'cost center change' || transfer?.type === 'Cost Center Change') &&
                <>
                  <Grid size={{xs: 12, md: 6, lg: 6}}>
                    <Div sx={{ mt: 1 }}>
                      <CostCenterSelector
                        multiple={false}
                        label="Destination Cost Center"
                        allowAllCostCenters={true}
                        removedCostCenters={[watch(`source_cost_center_id`)]}
                        withNotSpecified={true}
                        defaultValue={transfer?.destination_cost_center}
                        onChange={(newValue) => {
                          setValue(`destination_cost_center_id`, newValue ? newValue.id : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                    </Div>
                  </Grid>
                  <Grid size={{xs: 12, md: 6, lg: 6}}>
                    <Div sx={{ mt: 1 }}>
                      <LedgerSelect
                        multiple={false}
                        label="Receivable Account"
                        allowedGroups={['Accounts Receivable','Accounts Payable']}
                        defaultValue={transfer?.receivable_ledger_id} 
                        frontError={errors.receivable_ledger_id}
                        onChange={(newValue) => {
                          setValue(`receivable_ledger_id`, newValue ? newValue.id : null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                    </Div>
                  </Grid>
                </>
              }
              { (type === 'external' || transfer?.type === 'External') &&
                <>
                  <Grid size={{xs: 12, md: 6, lg: 6}}>
                    <Div sx={{ mt: 1}}>
                      <Checkbox
                        checked={change_cost_center}
                        size='small'
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setCostCenterChange(isChecked);
                          setValue('change_cost_center', isChecked ? 1 : 0, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                      Change Cost Center
                    </Div>
                  </Grid>
                  {watch(`change_cost_center`) === 1 &&
                    <>
                      <Grid size={{xs: 12, md: 6, lg: 6}}>
                        <Div sx={{ mt: 1 }}>
                          <CostCenterSelector
                            multiple={false}
                            label="Destination Cost Center"
                            allowAllCostCenters={true}
                            removedCostCenters={[watch(`source_cost_center_id`)]}
                            withNotSpecified={true}
                            defaultValue={transfer?.destination_cost_center}
                            onChange={(newValue) => {
                              setValue(`destination_cost_center_id`, newValue ? newValue.id : null, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                          />
                        </Div>
                      </Grid>
                      <Grid size={{xs: 12, md: 6, lg: 6}}>
                        <Div sx={{ mt: 1 }}>
                          <LedgerSelect
                            multiple={false}
                            label="Receivable Account"
                            allowedGroups={['Accounts Receivable','Accounts Payable']}
                            defaultValue={transfer?.receivable_ledger_id} 
                            frontError={errors.receivable_ledger_id}
                            onChange={(newValue) => {
                              setValue(`receivable_ledger_id`, newValue ? newValue.id : null, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            }}
                          />
                        </Div>
                      </Grid>
                    </>
                  }
                </>
              }
              { 
                (type === 'external' || transfer?.type === 'External') &&
                  <>
                    <Grid size={{xs: 12, md: 6, lg: 6}}>
                      <Div sx={{ mt: 1 }}>
                            <Autocomplete
                                id="checkboxes-vehicles"
                                freeSolo
                                options={suggestions?.vehicles}
                                isOptionEqualToValue={(option,value) => option === value}
                                getOptionLabel={(option) => option}
                                defaultValue={transfer && transfer.vehicle_information}
                                renderInput={
                                  (params) => 
                                  <TextField 
                                    {...params} 
                                    label="Vehicle Information" 
                                    size="small" 
                                    fullWidth 
                                  />
                                }
                                onChange={(e, newValue) => {
                                    setValue('vehicle_information', newValue && newValue , {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                    });
                                }}
                                onInputChange={(event, newValue) => {
                                  setValue('vehicle_information',newValue ? newValue : '',{
                                    shouldValidate: true,
                                    shouldDirty: true
                                  });
                                }}
                            />
                      </Div>
                    </Grid>
                    <Grid size={{xs: 12, md: 6, lg: 6}}>
                      <Div sx={{ mt: 1 }}>
                        <Autocomplete
                            id="checkboxes-drivers"
                            freeSolo
                            options={suggestions?.drivers}
                            isOptionEqualToValue={(option,value) => option === value}
                            getOptionLabel={(option) => option}
                            defaultValue={transfer && transfer.driver_information}
                            renderInput={
                                (params) => 
                                <TextField 
                                  {...params} 
                                  label="Driver Information" 
                                  size="small" 
                                  fullWidth
                                />
                            }
                            onChange={(e, newValue) => {
                                setValue('driver_information', newValue && newValue , {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                            }}
                            onInputChange={(event, newValue) => {
                                setValue('driver_information',newValue ? newValue : '',{
                                    shouldValidate: true,
                                    shouldDirty: true
                                });
                            }}
                        />
                      </Div>
                  </Grid>
                </>
              }
              <Grid size={{xs: 12, md: (type === 'internal' || transfer?.type === 'Internal') ? 6 : 12}}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label='Narration'
                    fullWidth
                    defaultValue={transfer?.narration}
                    multiline={true}
                    minRows={2}
                    error={!!errors?.narration}
                    helperText={errors?.narration?.message}
                    {...register('narration')}
                  />
                </Div>
              </Grid>
            </Grid>
          </form>
        </Grid>
        <Grid size={12}>
          <InventoryTrasferItemForm setClearFormKey={setClearFormKey} submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} submitItemForm={submitItemForm} setSubmitItemForm={setSubmitItemForm} key={clearFormKey} setIsDirty={setIsDirty} setItems={setItems} items={items} transfer={transfer} sourceCostCenterId={watch('source_cost_center_id')} transferDate={transferDate}/>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {errors?.items?.message && items.length < 1 && <Alert severity='error'>{errors.items.message}</Alert>}
        {items.map((item, index) => (
          <InventoryTransferItemRow
            key={index} 
            setClearFormKey={setClearFormKey}
            submitMainForm={handleSubmit((data) => saveMutation.mutate(data))} 
            submitItemForm={submitItemForm}
            setSubmitItemForm={setSubmitItemForm}
            setIsDirty={setIsDirty}
            index={index}
            setItems={setItems}
            items={items}
            item={item}
            sourceCostCenterId={watch('source_cost_center_id')}
          />
        ))}

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>            
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={11}>
                Unsaved Changes
              </Grid>
              <Grid size={1} textAlign="right">
                <Tooltip title="Close">
                  <IconButton
                    size="small" 
                    onClick={() => setShowWarning(false)}
                  >
                    <HighlightOff color="primary" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>
            Last item was not added to the list
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={() => {setSubmitItemForm(true); setShowWarning(false);}}>
              Add and Submit
            </Button>
            <Button size="small" onClick={handleConfirmSubmitWithoutAdd} color="secondary">
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={addInventoryTransfer.isPending || updateInventoryTransfer.isPending}
          variant='contained'
          size='small'
          onClick={handleSubmit(handleFormSubmit)}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </React.Fragment>
  )
}

export default InventoryTransferForm;