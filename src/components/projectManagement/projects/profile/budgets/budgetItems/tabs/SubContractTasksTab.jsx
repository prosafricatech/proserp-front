'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField, useMediaQuery } from '@mui/material';
import React, { useEffect } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Div } from '@jumbo/shared';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

function SubContractTasksTab({ budget, selectedBoundTo, selectedItemable }) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: addBudgetItem, isPending } = useMutation({
    mutationFn: projectsServices.addBudgetItems,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['budgetItemsDetails'] });
      reset(formDefaultValues);
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to add item', { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    expense_ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    currency_id: yup.number().positive().required().typeError('Currency is required'),
    exchange_rate: yup.number().positive().required().typeError('Exchange rate is required'),
    rate: yup.number().positive().required().typeError('Rate is required'),
    quantity: yup.number().positive().required().typeError('Quantity is required'),
    project_task_id: yup.number().nullable().when(
      ['selectedBoundTo', 'selectedItemable'],
      {
        is: (boundTo, item) => boundTo === 'ProjectTask' && !!item?.id,
        then: (schema) => schema.nullable(),
        otherwise: (schema) => schema.required("Project task is required"),
      }
    ),
  });

  const formDefaultValues = {
    type: 'subcontract_task',
    budget_id: budget.id,
    currency_id: 1,
    exchange_rate: 1,
    quantity: 0,
    rate: 0,
    project_task_id: selectedBoundTo === 'ProjectTask' && selectedItemable?.id ? selectedItemable.id : null,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (selectedBoundTo === 'ProjectTask' && selectedItemable?.id) {
      setValue('project_task_id', selectedItemable.id, { shouldValidate: true });
    } else {
      setValue('project_task_id', null, { shouldValidate: true });
    }
  }, [selectedBoundTo, selectedItemable, setValue]);

  return (
    <form
        onSubmit={handleSubmit((data) =>
            addBudgetItem({
            ...data,
            rate: Number(data.rate),
            quantity: Number(data.quantity),
            exchange_rate: Number(data.exchange_rate),
            })
        )}
    >
      <Grid container width="100%" spacing={1}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              multiple={false}
              label="Expense Name"
              allowedGroups={['Expenses']}
              frontError={errors?.expense_ledger_id}
              onChange={(newValue) => {
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
              onChange={(newValue) => {
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
                InputProps={{ inputComponent: CommaSeparatedField }}
                error={!!errors?.quantity}
                helperText={errors?.quantity?.message}
                {...register('quantity', {
                    onChange: (e) => {
                    const sanitized = sanitizedNumber(e.target.value);
                    setValue('quantity', sanitized !== null ? Number(sanitized) : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
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
                InputProps={{ inputComponent: CommaSeparatedField }}
                error={!!errors?.rate}
                helperText={errors?.rate?.message}
                {...register('rate', {
                    onChange: (e) => {
                    const sanitized = sanitizedNumber(e.target.value);
                    setValue('rate', sanitized !== null ? Number(sanitized) : 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
                    },
                })}
            />
          </Div>
        </Grid>

        <Grid size={{ xs: 12, md: 12, lg: 10 }}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={belowLargeScreen ? 2 : 1}
              size="small"
              {...register('description')}
            />
          </Div>
        </Grid>


        <Grid size={{ xs: 12, md: 12, lg: 2 }} textAlign="end" paddingTop={0.5}>
          <LoadingButton
            loading={isPending}
            variant="contained"
            size="small"
            type="submit"
            sx={{ marginBottom: 0.5 }}
          >
            Add
          </LoadingButton>
        </Grid>
      </Grid>
    </form>
  );
}

export default SubContractTasksTab;