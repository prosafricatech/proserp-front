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
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { AllowanceType } from '../allowanceTypes/AllowanceType';
import { useEmployees } from '../employees/EmployeesProvider';
import { Employee } from '../employees/EmployeesType';
import humanResourcesServices from '../humanResourcesServices';
import { EmployeeAllowanceType } from './EmployeeAllowanceType';

interface EmployeeAllowanceFormProps {
  setOpenDialog: (open: boolean) => void;
  employeeAllowance?: EmployeeAllowanceType | null;
}

interface FormData extends Omit<EmployeeAllowanceType, 'id' | 'created_by'> {
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

const EmployeeAllowanceForm = ({
  setOpenDialog,
  employeeAllowance = null,
}: EmployeeAllowanceFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { employees, isFetching: fetchingEmployees } = useEmployees();

  const { data: allowanceTypesResponse, isFetching: fetchingAllowanceTypes } =
    useQuery({
      queryKey: ['fetchAllowanceTypesForEmployeeAllowanceForm'],
      queryFn: async () => {
        return humanResourcesServices.getAllowanceTypesList({ page: 1, limit: 200 });
      },
    });

  const allowanceTypes = (allowanceTypesResponse?.data || []) as AllowanceType[];
  const [employeesData, setEmployeesData] = useState<Employee[] | []>([]);

  useEffect(() => {
    if (employees?.length) {
      setEmployeesData(employees);
    }
  }, [employees]);

  const {
    mutate: addEmployeeAllowance,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeAllowance,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Employee Allowance Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeAllowances'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Employee Allowance', {
        variant: 'error',
      });
      console.log('error adding employee allowance: ', mutationError);
    },
  });

  const {
    mutate: updateEmployeeAllowance,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeAllowance,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Employee Allowance Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeAllowances'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Employee Allowance', {
        variant: 'error',
      });
      console.log('error updating employee allowance: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    employee_id: yup.number().required('Employee is required'),
    allowance_type_id: yup.number().required('Allowance type is required'),
    amount: yup
      .number()
      .typeError('Amount must be a number')
      .required('Amount is required')
      .min(0, 'Amount must be 0 or greater'),
    effective_from: yup.string().required('Effective from is required'),
    effective_to: yup.string().nullable().optional(),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: employeeAllowance?.id,
      employee_id: employeeAllowance?.employee_id,
      allowance_type_id: employeeAllowance?.allowance_type_id,
      amount: employeeAllowance?.amount ?? 0,
      effective_from: employeeAllowance?.effective_from || '',
      effective_to: employeeAllowance?.effective_to || '',
    },
  });

  const saveMutation = useMemo(() => {
    return employeeAllowance?.id ? updateEmployeeAllowance : addEmployeeAllowance;
  }, [employeeAllowance?.id, updateEmployeeAllowance, addEmployeeAllowance]);

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
          {!employeeAllowance?.id
            ? 'Add Employee Allowance'
            : 'Edit Employee Allowance'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {fetchingEmployees ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='employee_id'
                    control={control}
                    rules={{ required: 'Employee is required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={employeesData}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) =>
                          `${option?.first_name || ''} ${option?.middle_name || ''} ${option?.last_name || ''}`
                        }
                        value={
                          employeesData.find((employee) => employee.id === field.value) ||
                          null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Employee'
                            error={
                              !!fieldState.error ||
                              !!getValidationMessage(validationErrors, 'employee_id')
                            }
                            helperText={
                              fieldState.error?.message ||
                              getValidationMessage(validationErrors, 'employee_id')
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
                {fetchingAllowanceTypes ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='allowance_type_id'
                    control={control}
                    rules={{ required: 'Allowance type is required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={allowanceTypes}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.name || ''}
                        value={
                          allowanceTypes.find((type) => type.id === field.value) ||
                          null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Allowance Type'
                            error={
                              !!fieldState.error ||
                              !!getValidationMessage(validationErrors, 'allowance_type_id')
                            }
                            helperText={
                              fieldState.error?.message ||
                              getValidationMessage(
                                validationErrors,
                                'allowance_type_id'
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

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Amount'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.amount ||
                    !!getValidationMessage(validationErrors, 'amount')
                  }
                  helperText={
                    errors.amount?.message ||
                    getValidationMessage(validationErrors, 'amount')
                  }
                  {...register('amount')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
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

            <Grid size={{ xs: 12, md: 4 }}>
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

export default EmployeeAllowanceForm;
