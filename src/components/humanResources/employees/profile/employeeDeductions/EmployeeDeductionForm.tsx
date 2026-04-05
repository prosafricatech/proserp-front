'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { DeductionType } from '../../../deductionTypes/DeductionType';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeeDeductionType } from './EmployeeDeductionType';

interface EmployeeDeductionFormProps {
  setOpenDialog: (open: boolean) => void;
  employeeDeduction?: EmployeeDeductionType | null;
  employeeId?: number;
}

interface FormData extends Omit<EmployeeDeductionType, 'id' | 'created_by'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: Record<string, string[] | string>;
}

const getValidationMessage = (
  validationErrors: Record<string, string[] | string> | undefined,
  field: string
) => {
  const message = validationErrors?.[field];
  if (!message) return undefined;
  return Array.isArray(message) ? message[0] : message;
};

const EmployeeDeductionForm = ({
  setOpenDialog,
  employeeDeduction = null,
  employeeId,
}: EmployeeDeductionFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: deductionTypesResponse, isFetching: fetchingDeductionTypes } =
    useQuery({
      queryKey: ['fetchDeductionTypesForEmployeeDeductionForm'],
      queryFn: async () => {
        return humanResourcesServices.getDeductionTypesList({ page: 1, limit: 200 });
      },
    });

  const deductionTypes = (deductionTypesResponse?.data || []) as DeductionType[];

  const {
    mutate: addEmployeeDeduction,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeDeduction,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Employee Deduction Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeDeductions'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Employee Deduction', {
        variant: 'error',
      });
      console.log('error adding employee deduction: ', mutationError);
    },
  });

  const {
    mutate: updateEmployeeDeduction,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeDeduction,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Employee Deduction Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeDeductions'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Employee Deduction', {
        variant: 'error',
      });
      console.log('error updating employee deduction: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    employee_id: yup.number().required('Employee is required'),
    deduction_type_id: yup.number().required('Deduction type is required'),
    value: yup
      .number()
      .typeError('Value must be a number')
      .required('Value is required')
      .min(0, 'Value must be 0 or greater'),
    effective_from: yup.string().required('Effective from is required'),
    effective_to: yup.string().nullable().optional(),
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: employeeDeduction?.id,
      employee_id: employeeDeduction?.employee_id,
      deduction_type_id: employeeDeduction?.deduction_type_id,
      value: employeeDeduction?.value ?? 0,
      effective_from: employeeDeduction?.effective_from || '',
      effective_to: employeeDeduction?.effective_to || '',
    },
  });


  useEffect(() => {
    if (employeeId) setValue('employee_id', employeeId);
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return employeeDeduction?.id ? updateEmployeeDeduction : addEmployeeDeduction;
  }, [employeeDeduction?.id, updateEmployeeDeduction, addEmployeeDeduction]);

  const validationErrors =
    error?.response?.data?.validation_errors ||
    updateError?.response?.data?.validation_errors;

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!employeeDeduction?.id
            ? 'Add Employee Deduction'
            : 'Edit Employee Deduction'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingDeductionTypes ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='deduction_type_id'
                    control={control}
                    rules={{ required: 'Deduction type is required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={deductionTypes}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.name || ''}
                        value={
                          deductionTypes.find((type) => type.id === field.value) ||
                          null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Deduction Type'
                            error={
                              !!fieldState.error ||
                              !!getValidationMessage(validationErrors, 'deduction_type_id')
                            }
                            helperText={
                              fieldState.error?.message ||
                              getValidationMessage(
                                validationErrors,
                                'deduction_type_id'
                              )
                            }
                          />
                        )}
                      />
                    )}
                  />
                )}
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Value'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.value ||
                    !!getValidationMessage(validationErrors, 'value')
                  }
                  helperText={
                    errors.value?.message ||
                    getValidationMessage(validationErrors, 'value')
                  }
                  {...register('value')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='effective_from'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label='Effective From'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.effective_from ||
                            !!getValidationMessage(validationErrors, 'effective_from'),
                          helperText:
                            errors.effective_from?.message ||
                            getValidationMessage(validationErrors, 'effective_from'),
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='effective_to'
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label='Effective To'
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(newValue) => {
                        field.onChange(newValue ? newValue.toISOString() : '');
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error:
                            !!errors?.effective_to ||
                            !!getValidationMessage(validationErrors, 'effective_to'),
                          helperText:
                            errors.effective_to?.message ||
                            getValidationMessage(validationErrors, 'effective_to'),
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              sx={{ display: 'flex' }}
              loading={isPending || updateIsPending}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeeDeductionForm;
