import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete, Dialog, Tooltip } from '@mui/material';
import { useCallback, useEffect, useState } from 'react'
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { IconButton, LinearProgress } from '@mui/material';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import QuickAddLedger from '@/components/accounts/ledgers/forms/QuickAddLedger';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function LedgerItemsTab({
  index = -1,
  setShowForm = null,
  ledgerItem,
  ledgerItems = [],
  setLedgerItems,
  submitMainForm,
  submitItemForm = false,
  setSubmitItemForm,
  setIsDirty,
  allTasks = [],
  selectedCostCenter
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [boundToOption, setBoundToOption] = useState(ledgerItem?.selectedItemable ? 'Task' : ledgerItem?.bound_to === 'ProjectTask' ? 'Task' : '');
  const [selectedItemable, setSelectedItemable] = useState(ledgerItem?.selectedItemable ?? allTasks.find(task => task.id === ledgerItem?.budget_itemable_id) ?? null);
  const [openQuickAddLedger, setOpenQuickAddLedger] = useState(false);
  const [recentlyAddedLedger, setRecentlyAddedLedger] = useState(null);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { currencies } = useCurrencySelect();
  const [triggerKey, setTriggerKey] = useState(0);
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const canQuickAddLedger = organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE) && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_CREATE);

  const formatTaskOptionLabel = (option) => {
    if (!option) return '';
    const code = String(option.code || '').trim();
    const name = String(option.name || option.label || '').trim();

    if (code && name) {
      return `${code} - ${name}`;
    }

    return name;
  };

  const validationSchema = yup.object({
    ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
    exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
    rate: yup.number().positive('Rate is required').required("Rate is required").positive("Rate is required").typeError('Rate is required'),
    quantity: yup.number().positive('Quantity is required').required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
    measurement_unit_id: yup.number().required("Measurement Unit is required").typeError('Measurement Unit is required'),
  });

  const { setValue, handleSubmit, watch, reset, formState: { errors, dirtyFields } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      type: 'ledger',
      ledger_id: ledgerItem?.ledger_id || ledgerItem?.ledger?.id || null,
      ledger: ledgerItem?.ledger || null,
      currency_id: ledgerItem?.currency_id || ledgerItem?.currency?.id || 1,
      currency: ledgerItem?.currency || currencies?.find(c => c.is_base === 1),
      exchange_rate: ledgerItem?.exchange_rate || 1,
      rate: ledgerItem?.rate || '',
      quantity: ledgerItem?.quantity || '',
      budget_itemable_id: ledgerItem?.budget_itemable_id || ledgerItem?.selectedItemable?.id || null,
      selectedItemable: ledgerItem?.selectedItemable ?? allTasks.find(task => task.id === ledgerItem?.budget_itemable_id) ?? null,
      measurement_unit_id: ledgerItem?.measurement_unit_id || ledgerItem?.measurement_unit?.id || null,
      measurement_unit: ledgerItem?.measurement_unit || null,
      description: ledgerItem?.description || '',
    }
  });

  useEffect(() => {
    setIsDirty?.(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  const handleLedgerChange = useCallback((newValue) => {
    if (Array.isArray(newValue)) return;

    setRecentlyAddedLedger(newValue || null);
    setValue('ledger_id', newValue ? newValue.id : null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue('ledger', newValue || null);
  }, [setValue]);

  const updateItems = async (item) => {
    setIsAdding(true);
      const normalizedItem = {
        ...item,
        selectedItemable: selectedItemable,
        budget_itemable_id: selectedItemable?.id || null,
        bound_to: boundToOption === 'Task' ? 'ProjectTask' : null,
        ledger: item.ledger || ungroupedLedgerOptions.find((ledger) => ledger.id === item.ledger_id),
      };
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedLedgerItems = [...ledgerItems];
        updatedLedgerItems[index] = normalizedItem;
        await setLedgerItems(updatedLedgerItems);
        setTriggerKey((prev) => prev + 1);
      } else {
        // Add the new item to the ledgerItems array
        await setLedgerItems((ledgerItems) => [...ledgerItems, normalizedItem]);
        if (submitItemForm) {
          submitMainForm?.();
        }
        setSubmitItemForm?.(false);
        setTriggerKey((prev) => prev + 1);
      }

      // Reset form to blank/default values and force rerender
      reset({
        type: 'ledger',
        ledger_id: null,
        ledger: null,
        currency_id: currencies?.find(c => c.is_base === 1)?.id ?? 1,
        currency: currencies?.find(c => c.is_base === 1) ?? null,
        exchange_rate: 1,
        rate: '',
        quantity: '',
        budget_itemable_id: null,
        selectedItemable: null,
        measurement_unit_id: null,
        measurement_unit: null,
        description: '',
      });
      setSelectedItemable(null);
      setRecentlyAddedLedger(null);
      setBoundToOption('');
      setTriggerKey(prev => prev + 1);
      setIsDirty?.(false);
      setIsAdding(false);
      setShowForm && setShowForm(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm?.(false);
      })();
    }
  }, [submitItemForm]);

  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <>
      <Grid container spacing={1} key={triggerKey}>
        <Grid size={{xs: 12, md: 4}}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              multiple={false}
              label="Expense Name"
              allowedGroups={['Expenses']}
              frontError={errors?.ledger_id}
              addedLedger={recentlyAddedLedger}
              value={recentlyAddedLedger || ungroupedLedgerOptions.find(option => option.id === watch('ledger_id')) || null}
              onChange={handleLedgerChange}
              startAdornment={canQuickAddLedger ? (
                <Tooltip title="Quick Add Ledger" placement="top">
                  <AddOutlined
                    onClick={() => setOpenQuickAddLedger(true)}
                    sx={{ cursor: 'pointer' }}
                  />
                </Tooltip>
              ) : null}
            />
          </Div>
        </Grid>
        {selectedCostCenter?.cost_centerable_id &&
          <>
            <Grid size={{ xs: 12, md: 4 }} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <Div sx={{ mt: 1, width: '100%' }}>
                <FormControl fullWidth>
                  <InputLabel id="bound-to-label" sx={{ width: '100%'}}>Bound To</InputLabel>
                  <Select
                    labelId="bound-to-label"
                    value={boundToOption}
                    label="Bound To"
                    size='small'
                    fullWidth
                    onChange={(e) => {
                      setSelectedItemable(null);
                      setBoundToOption(e.target.value);
                      setValue('bound_to', e.target.value);
                    }}
                  >
                    <MenuItem value="Task">Task</MenuItem>
                  </Select>
                </FormControl>
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} textAlign="center">
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={boundToOption === 'Task' ? allTasks : []}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  getOptionLabel={(option) => formatTaskOptionLabel(option)}
                  value={selectedItemable}
                  renderInput={(params) => (
                    <TextField {...params} label={`Select ${boundToOption}`} size="small" fullWidth />
                  )}
                  onChange={(e, newValue) => {
                    setSelectedItemable(newValue);
                    setValue('budget_itemable_id', newValue?.id ?? null);
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {formatTaskOptionLabel(option)}
                    </li>
                  )}
                />
              </Div>
            </Grid>
          </>
        }
        <Grid size={{xs: 12, md: 4}}>
          <Div sx={{mt: 1}}>
            <CurrencySelector
              frontError={errors?.currency_id}
              defaultValue={ledgerItem?.currency_id}
              onChange={(newValue) => {
                setValue('currency', newValue ? newValue : null);
                setValue(`exchange_rate`, newValue ? newValue.exchangeRate : 1);
                setValue(`currency_id`, newValue ? newValue.id : 1,{
                  shouldDirty: true,
                  shouldValidate: true
                });
                setValue('currency', newValue || null);
              }}
            />
          </Div>
        </Grid>
        {
          watch(`currency_id`) > 1 &&
          <Grid size={{xs: 6, md: 2, lg: 2}}>
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
        <Grid size={{xs: 12, md: watch(`currency_id`) > 1 ? 2 : (selectedCostCenter?.cost_centerable_id ? 2.66 : 4)}}>
          <Div sx={{ mt: 1}}>
            <MeasurementSelector
              label='Unit'
              frontError={errors && errors?.measurement_unit_id}
              defaultValue={ledgerItem?.measurement_unit_id}
              onChange={(newValue) => {
                if (Array.isArray(newValue)) return;
                setValue(`measurement_unit_id`, newValue ? newValue.id : null,{
                  shouldDirty: true,
                  shouldValidate: true
                });
                setValue('measurement_unit', newValue || null);
              }}      
            />
          </Div>
        </Grid>
        <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 2 : (selectedCostCenter?.cost_centerable_id ? 2.66 : 4)}}>
          <Div sx={{mt: 1}}>
            <TextField
              label="Quantity"
              fullWidth
              size="small"
              InputProps={{
                  inputComponent: CommaSeparatedField,
              }}
              defaultValue={ledgerItem?.quantity}
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
        <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 2 : (selectedCostCenter?.cost_centerable_id ? 2.66 : 4)}}>
          <Div sx={{mt: 1}}>
            <TextField
              label="Rate"
              fullWidth
              size="small"
              error={errors && !!errors?.rate}
              helperText={errors && errors?.rate?.message}
              defaultValue={ledgerItem?.rate}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e) => {
                setValue(`rate`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: selectedCostCenter?.cost_centerable_id ? 12 :  watch(`currency_id`) > 1 ? 8 : 4}}>
          <Div sx={{mt: 1}}>
            <TextField
              label="Description"
              fullWidth
              multiline={true}
              rows={2}
              size="small"
              defaultValue={ledgerItem?.description}
              onChange={(e) => {
                setValue(`description`,e.target.value,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
      </Grid>
      <Dialog open={openQuickAddLedger} onClose={() => setOpenQuickAddLedger(false)} maxWidth="md" fullWidth>
        <LedgerGroupProvider>
          <QuickAddLedger
            ledgerType="debit"
            toggleOpen={setOpenQuickAddLedger}
            heading="Quick Add Ledger"
            setAddedLedger={(newLedger) => {
              setRecentlyAddedLedger(newLedger);
              setValue('ledger_id', newLedger?.id ?? null, {
                shouldValidate: true,
                shouldDirty: true,
              });
              setValue('ledger', newLedger || null);
            }}
          />
        </LedgerGroupProvider>
      </Dialog>
      <Grid size={12} textAlign={'end'}>
        <LoadingButton
          loading={false}
          variant='contained'
          type='submit'
          size='small'
          sx={{marginBottom: 0.5, marginTop: 1}}
          onClick={handleSubmit(updateItems)}
        >
          {
            ledgerItem ? (
              <><CheckOutlined fontSize='small' /> Done</>
            ) : (
              <><AddOutlined fontSize='small' /> Add</>
            )
          }
        </LoadingButton>
        {
          ledgerItem && 
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
    </>
  )
}

export default LedgerItemsTab