'use client'
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField, useMediaQuery } from '@mui/material';
import React, { useEffect, useState } from 'react'
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

function SubContractTasksTab({budget, selectedBoundTo, selectedItemable}) {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [triggerKey, setTriggerKey] = useState(0);
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    // React Query v5 syntax for useMutation
    const { mutate: addBudgetItem, isPending } = useMutation({
        mutationFn: projectsServices.addBudgetItems,
        onSuccess: (data) => {
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({queryKey: ['budgetItemsDetails']});
            reset({ type: 'subcontract_task', budget_id: budget.id, expense_ledger_id: '', currency_id: 1, exchange_rate: 1, quantity: 0, rate: 0 });
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
        expense_ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
        currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
        exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
        rate: yup.number().positive('Rate is required').required("Rate is required").positive("Rate is required").typeError('Rate is required'),
        quantity: yup.number().positive('Quantity is required').required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
        project_task_id: yup.number().nullable().when(['selectedBoundTo', 'selectedItemable'], {
            is: (selectedBoundTo, selectedItemable) => !(selectedBoundTo === 'ProjectTask' && selectedItemable?.id),
            then: yup.number().required("Project task is required").typeError('Project task is required'),
            otherwise: yup.number().nullable(),
        }),
    });    

    const {setValue, handleSubmit, watch, reset, formState: {errors}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            type: 'subcontract_task',
            currency_id: 1,
            exchange_rate: 1,
            budget_id: budget.id,
            project_task_id: selectedBoundTo === 'ProjectTask' && selectedItemable?.id ? selectedItemable.id : null,
        }
    });

    useEffect(() => {
        if (selectedBoundTo === 'ProjectTask' && selectedItemable?.id) {
          setValue('project_task_id', selectedItemable.id);
        } else {
          setValue('project_task_id', null);
        }
    }, [selectedBoundTo, selectedItemable, triggerKey, setValue]);

  return (
  <form autoComplete='off' onSubmit={handleSubmit((data) => saveMutation(data))} >
    <Grid container width={'100%'} spacing={1} key={triggerKey}>
        <Grid size={{xs: 12, md: 5}}>
            <Div sx={{ mt: 1 }}>
                <LedgerSelect
                    multiple={false}
                    label="Expense Name"
                    allowedGroups={['Expenses']}
                    frontError={errors?.expense_ledger_id}
                    onChange={(newValue) => {
                        if (!!newValue) {
                            setValue(`expense_ledger_id`, newValue ? newValue.id : null,{
                                shouldValidate: true,
                                shouldDirty: true
                            })
                        ;}
                    }}
                />
            </Div>
        </Grid>
        <Grid size={{xs: 12, md: watch(`currency_id`) > 1 ? 2.5 : 3}}>
            <Div sx={{mt: 1}}>
                <CurrencySelector
                    frontError={errors?.currency_id}
                    onChange={(newValue) => {
                        setValue(`currency_id`, newValue ? newValue.id : 1,{
                            shouldDirty: true,
                            shouldValidate: true
                        });
                        setValue(`currency`, newValue);
                        setValue(`exchange_rate`, newValue ? newValue.exchangeRate : 1);
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
                        error={!!errors?.exchange_rate}
                        helperText={errors?.exchange_rate?.message}
                        InputProps={{
                            inputComponent: CommaSeparatedField,
                        }}
                        defaultValue={watch(`exchange_rate`)}
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
        <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 1.5 : 2}}>
            <Div sx={{mt: 1}}>
                <TextField
                    label="Quantity"
                    fullWidth
                    size="small"
                    InputProps={{
                        inputComponent: CommaSeparatedField,
                    }}
                    error={!!errors?.quantity}
                    helperText={errors?.quantity?.message}
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
                    InputProps={{
                        inputComponent: CommaSeparatedField,
                    }}
                    error={!!errors?.rate}
                    helperText={errors?.rate?.message}
                    onChange={(e) => {
                        setValue(`rate`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                            shouldValidate: true,
                            shouldDirty: true
                        });
                    }}
                />
            </Div>
        </Grid>
        <Grid size={{xs: 12, md: 12, lg: 10}}>
            <Div sx={{mt: 0.3}}>
                <TextField
                    label="Description"
                    fullWidth
                    multiline={true}
                    rows={belowLargeScreen ? 2 : 1}
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
        <Grid size={{xs: 12, md: 12, lg: 2}} textAlign={'end'} paddingTop={0.5}>
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
    </Grid>
  </form>
  )
}

export default SubContractTasksTab