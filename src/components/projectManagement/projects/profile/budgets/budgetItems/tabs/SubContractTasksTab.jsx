'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, IconButton, LinearProgress, TextField, Tooltip, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { set, useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Div } from '@jumbo/shared';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

function SubContractTasksTab({ 
  index = -1,
  setShowForm = null,
  subContractItem,
  subContractItems = [],
  setSubContractItems,
  submitMainForm,
  submitItemForm = false,
  setSubmitItemForm,
  setIsDirty,
  selectedBoundTo,
  selectedItemable
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { currencies } = useCurrencySelect();

  const validationSchema = yup.object({
    expense_ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    currency_id: yup.number().positive().required().typeError('Currency is required'),
    exchange_rate: yup.number().positive().required().typeError('Exchange rate is required'),
    rate: yup.number().positive().required().typeError('Rate is required'),
    quantity: yup.number().positive().required().typeError('Quantity is required')
  });

  const formDefaultValues = {
    type: 'subcontract_task',
    currency_id:  subContractItem?.currency_id ?? currencies?.find(c => c.is_base === 1)?.id,
    exchange_rate: subContractItem?.exchange_rate ?? 1,
    quantity: subContractItem?.quantity ?? 0,
    rate: subContractItem?.rate ?? 0,
    expense_ledger_id: subContractItem?.expense_ledger_id ?? null,
    currency: subContractItem?.currency ?? currencies?.find(c => c.is_base === 1),
    project_task: subContractItem?.project_task ?? selectedItemable,
    project_task_id: subContractItem?.project_task?.id ?? selectedItemable?.id ?? null,
    description: subContractItem?.description ?? '',
    bound_to: subContractItem ? subContractItem.bound_to : selectedBoundTo,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, dirtyFields },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    setIsDirty?.(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  const updateItems = async (item) => {
    setIsAdding(true);
      const normalizedItem = {
        ...item,
        expense_ledger: ungroupedLedgerOptions.find(option => option.id === item.expense_ledger_id) || null,
        currency: currencies.find(option => option.id === item.currency_id) || null,
      };
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedSubContractItems = [...subContractItems];
        updatedSubContractItems[index] = normalizedItem;
        await setSubContractItems(updatedSubContractItems);
        setTriggerKey((prev) => prev + 1);
      } else {
        // Add the new item to the subContractItems array
        await setSubContractItems((subContractItems) => [...subContractItems, normalizedItem]);
        if (submitItemForm) {
          submitMainForm?.();
        }
        setSubmitItemForm?.(false);
        setTriggerKey((prev) => prev + 1);
      }

      setTriggerKey((prev) => prev + 1);
      reset();
      setIsDirty?.(false);
      setIsAdding(false);
      setShowForm && setShowForm(false);
  };

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
    <Grid container width="100%" spacing={1}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Div sx={{ mt: 1 }}>
          <LedgerSelect
            multiple={false}
            label="Expense Name"
            allowedGroups={['Expenses']}
            value={ungroupedLedgerOptions.find(option => option.id === watch('expense_ledger_id')) || null}
            frontError={errors?.expense_ledger_id}
            onChange={(newValue) => {
              setValue('expense_ledger', newValue ?? null);
              setValue('expense_ledger_id', newValue?.id ?? null, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: watch('currency_id') > 1 ? 2.5 : 3 }}>
        <Div sx={{ mt: 1 }}>
          <CurrencySelector
            frontError={errors?.currency_id}
            defaultValue={subContractItem?.currency_id}
            onChange={(newValue) => {
              setValue('currency', newValue ?? null);
              setValue('currency_id', newValue?.id ?? 1, { shouldDirty: true, shouldValidate: true });
              setValue('exchange_rate', newValue?.exchangeRate ?? 1, { shouldDirty: true });
            }}
          />
        </Div>
      </Grid>

      {watch('currency_id') > 1 && (
        <Grid size={{ xs: 6, md: 2, lg: 1.5 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              label="Exchange Rate"
              fullWidth
              size="small"
              error={!!errors?.exchange_rate}
              defaultValue={watch(`exchange_rate`)}
              helperText={errors?.exchange_rate?.message}
              InputProps={{ inputComponent: CommaSeparatedField }}
              {...register('exchange_rate', {
                onChange: (e) => {
                  const sanitized = sanitizedNumber(e.target.value);
                  setValue('exchange_rate', sanitized ?? null, { shouldValidate: true });
                },
              })}
            />
          </Div>
        </Grid>
      )}

      <Grid size={{ xs: watch('currency_id') > 1 ? 6 : 12, md: watch('currency_id') > 1 ? 1.5 : 2 }}>
        <Div sx={{ mt: 1 }}>
          <TextField
              label="Quantity"
              fullWidth
              size="small"
              defaultValue={subContractItem?.quantity ?? null}
              InputProps={{ inputComponent: CommaSeparatedField }}
              error={!!errors?.quantity}
              helperText={errors?.quantity?.message}
              {...register('quantity', {
                setValueAs: (value) => {
                  const sanitized = sanitizedNumber(value);
                  return sanitized === null ? undefined : Number(sanitized);
                },
              })}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: watch('currency_id') > 1 ? 6 : 12, md: watch('currency_id') > 1 ? 1.5 : 2 }}>
        <Div sx={{ mt: 1 }}>
        <TextField
          label="Rate"
          fullWidth
          size="small"
          defaultValue={subContractItem?.rate ?? null}
          InputProps={{ inputComponent: CommaSeparatedField }}
          error={!!errors?.rate}
          helperText={errors?.rate?.message}
          {...register('rate', {
            setValueAs: (value) => {
              const sanitized = sanitizedNumber(value);
              return sanitized === null ? undefined : Number(sanitized);
            },
          })}
        />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            size="small"
            {...register('description')}
          />
        </Div>
      </Grid>

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
            subContractItem ? (
              <><CheckOutlined fontSize='small' /> Done</>
            ) : (
              <><AddOutlined fontSize='small' /> Add</>
            )
          }
        </LoadingButton>
        {
          subContractItem && 
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
  );
}

export default SubContractTasksTab;