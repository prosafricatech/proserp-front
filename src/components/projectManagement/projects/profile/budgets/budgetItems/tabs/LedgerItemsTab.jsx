import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react'
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function LedgerItemsTab({budget, selectedBoundTo, selectedItemable}) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [triggerKey, setTriggerKey] = useState(0);

  const { mutate: addBudgetItem, isPending } = useMutation({
    mutationFn: projectsServices.addBudgetItems,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({queryKey: ['budgetItemsDetails']});
      reset({ type: 'ledger', budget_id: budget.id, ledger_id: '', measurement_unit_id: '', currency_id: 1, exchange_rate: 1, quantity: 0, rate: 0, description: '', budget_itemable_id: selectedItemable?.id, bound_to: selectedBoundTo, });
      setTriggerKey(prevKey => prevKey + 1);
    },
    onError: (error) => {
      enqueueSnackbar(error.response.data.message, {
        variant: 'error',
      });
    },
  });

  const saveMutation = React.useMemo(() => {
    return addBudgetItem;
  }, [addBudgetItem]);

  const validationSchema = yup.object({
    ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
    exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
    rate: yup.number().positive('Rate is required').required("Rate is required").positive("Rate is required").typeError('Rate is required'),
    quantity: yup.number().positive('Quantity is required').required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
    measurement_unit_id: yup.number().required("Measurement Unit is required").typeError('Measurement Unit is required'),
  });

  const {setValue, handleSubmit, watch, reset, formState: {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      type: 'ledger',
      bound_to: selectedBoundTo,
      currency_id: 1,
      exchange_rate: 1,
      budget_id: budget.id,
      budget_itemable_id: selectedItemable?.id,
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

  return (
    <form autoComplete='off' onSubmit={handleSubmit(saveMutation)} >
      <Grid container spacing={1} key={triggerKey}>
        <Grid size={{xs: 12, md: 3.5}}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              multiple={false}
              label="Expense Name"
              allowedGroups={['Expenses']}
              frontError={errors?.ledger_id}
              onChange={(newValue) => {
                setValue(`ledger_id`, newValue ? newValue.id : null,{
                  shouldValidate: true,
                  shouldDirty: true
                })
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: watch(`currency_id`) > 1 ? 2.5 : 3}}>
          <Div sx={{mt: 1}}>
            <CurrencySelector
              frontError={errors?.currency_id}
              onChange={(newValue) => {
                setValue(`exchange_rate`, newValue ? newValue.exchangeRate : 1);
                setValue(`currency_id`, newValue ? newValue.id : 1,{
                  shouldDirty: true,
                  shouldValidate: true
                });
              }}
            />
          </Div>
        </Grid>
        {
          watch(`currency_id`) > 1 &&
          <Grid size={{xs: 6, md: 2, lg: 1.5}}>
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
          <Grid size={{xs: 12, md: 1.5}}>
            <Div sx={{ mt: 1}}>
              <MeasurementSelector
                label='Unit'
                frontError={errors && errors?.measurement_unit_id}
                onChange={(newValue) => {
                  setValue(`measurement_unit_id`, newValue ? newValue.id : null,{
                    shouldDirty: true,
                    shouldValidate: true
                  })
                }}      
              />
            </Div>
          </Grid>
          <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 1.5 : 2}}>
            <Div sx={{mt: 1}}>
              <TextField
                label="Quantity"
                fullWidth
                size="small"
                InputProps={{
                    inputComponent: CommaSeparatedField,
                }}
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
          <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 1.5 : 2}}>
            <Div sx={{mt: 1}}>
              <TextField
                label="Rate"
                fullWidth
                size="small"
                error={errors && !!errors?.rate}
                helperText={errors && errors?.rate?.message}
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
          <Grid size={{xs: 12, md: 12}}>
            <Div sx={{mt: 0.3}}>
              <TextField
                label="Description"
                fullWidth
                multiline={true}
                rows={2}
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
      </Grid>
      <Grid size={{xs: 12, md: 12, lg: 12}} textAlign={'end'} paddingTop={0.5}>
        <LoadingButton
          loading={isPending}
          variant='contained'
          size='small'
          type='submit'
          sx={{marginBottom: 0.5}}
        >
          Add
        </LoadingButton>
      </Grid>
    </form>
  )
}

export default LedgerItemsTab