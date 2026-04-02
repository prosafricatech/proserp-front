'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
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
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDesignations } from '../designations/DesignationsProvider';
import { Designation } from '../designations/DesignationsType';
import { useEmployees } from '../employees/EmployeesProvider';
import { Employee } from '../employees/EmployeesType';
import humanResourcesServices from '../humanResourcesServices';
import { ContractType } from './ContractType';

interface EmployeesContractsFormProps {
  setOpenDialog: (open: boolean) => void;
  contract?: ContractType | null;
}

interface FormData extends Omit<ContractType, 'id'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    symbol?: string;
  };
}

const EmployeesContractsForm = ({
  setOpenDialog,
  contract,
}: EmployeesContractsFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authUser } = useJumboAuth();
  const { employees, isFetching: fetchingEmployees } = useEmployees();
  const { designations, isFetching: fetchingDesignations } = useDesignations();
  const [employeesData, setEmployeesData] = useState<Employee[] | []>([]);
  const [designationsData, setDesignationsData] = useState<Designation[] | []>(
    []
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [selectedDesignation, setSelectedDesignation] =
    useState<Designation | null>(null);

  console.log('designations: ', designations);
  useEffect(() => {
    if (employees?.length) {
      setEmployeesData(employees);
    }
    if (designations?.length) {
      setDesignationsData(designations);
    }
  }, [employees, designations, fetchingEmployees, fetchingDesignations]);

  const contractOptions = [
    { label: 'Permanent', value: 'permanent' },
    { label: 'fixed Ferm', value: 'fixed_term' },
    { label: 'Probation', value: 'probation' },
  ];

  const [startDate, setStartDate] = useState<string | undefined>('');
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [probationEnd, setProbationENd] = useState<string | undefined>(
    undefined
  );
  const [contractType, setContractType] = useState(contractOptions[0]);

  useEffect(() => {
    const date = new Date();
    const dayjsDate = dayjs(date).toISOString().split('T')[0];
    setStartDate(dayjsDate);
    // setEndDate(dayjsDate);
    // setProbationENd(dayjsDate);
  }, []);

  useEffect(() => {
    setValue('contract_type', contractType.value);
  }, [contractType]);

  const {
    mutate: addEmployee,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const user_id = authUser?.user.id;
      const newData = { ...data, user_id: user_id };
      const response = await humanResourcesServices.addEmployee(newData);
      console.log('newData: ', newData);
      return response;
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Employee', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Adding Employee', {
        variant: 'error',
      });
      console.log('error adding employee: ', error);
    },
  });

  const {
    mutate: updateEmployee,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployee,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Employee update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Updating Employee', {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    employee_id: yup.number().required('Employee is required'),
    designation_id: yup.number().required('Designation is required'),
    contract_type: yup.string().required('Contract type is required'),
    start_date: yup.date().required('Start date is required'),
    end_date: yup
      .date()
      .nullable()
      .when('contract_type', {
        is: 'fixed_term',
        then: (schema) =>
          schema
            .required('End date is required')
            .min(yup.ref('start_date'), 'End date must be after start date'),
        otherwise: (schema) => schema.notRequired(),
      }),
    probation_end_date: yup.date().nullable().min(yup.ref('start_date')),
    basic_salary: yup.number().required('Basic salary is required').min(0),
    remarks: yup
      .string()
      .max(1000, 'Remarks should not exceed 1000 characters'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      employee_id: contract?.employee_id || undefined,
      designation_id: contract?.designation_id || undefined,
      contract_type: contract?.contract_type || '',
      start_date: contract?.start_date || '',
      end_date: contract?.end_date || '',
      probation_end_date: contract?.probation_end_date || '',
      basic_salary: contract?.basic_salary || undefined,
      remarks: contract?.remarks || '',
    },
  });

  const saveMutation = React.useMemo(() => {
    return contract?.id ? updateEmployee : addEmployee;
  }, [contract, updateEmployee, addEmployee]);

  const onSubmit = (data: FormData) => {
    saveMutation?.(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!contract?.id ? 'Add Contract' : `Edit Contract`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div>
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
                          employeesData.find((e) => e.id === field.value) ||
                          null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                          setSelectedEmployee(newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Employee'
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
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
                {fetchingDesignations ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='designation_id'
                    control={control}
                    rules={{ required: 'Designation is required' }}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={designationsData}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option.title || ' '}
                        value={
                          designationsData.find((e) => e.id === field.value) ||
                          null
                        }
                        onChange={(event, newValue) => {
                          field.onChange(newValue?.id || null);
                          setSelectedDesignation(newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Designation'
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
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
                <Autocomplete
                  size='small'
                  options={contractOptions}
                  isOptionEqualToValue={(option, value) =>
                    option.label === value.label
                  }
                  getOptionLabel={(option) => option.label}
                  value={contractType}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setContractType(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label='Coontract Type' />
                  )}
                  //   {...register('contract_type')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DatePicker
                  label='Start Date'
                  value={dayjs(startDate)}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      const formatted = value.format('YYYY-MM-DD');

                      setStartDate(formatted);
                      setValue('start_date', formatted);
                    }
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DatePicker
                  label='End Date'
                  value={endDate !== undefined ? dayjs(endDate) : undefined}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      const formatted = value.format('YYYY-MM-DD');

                      setEndDate(formatted);
                      setValue('end_date', formatted);
                    }
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DatePicker
                  label='Probation End Date'
                  value={
                    probationEnd !== undefined ? dayjs(probationEnd) : undefined
                  }
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      const formatted = value.format('YYYY-MM-DD');

                      setProbationENd(formatted);
                      setValue('probation_end_date', formatted);
                    }
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Basic Salary'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.basic_salary ||
                    !!error?.response?.data?.validation_errors?.basic_salary ||
                    !!updateError?.response?.data?.validation_errors
                      ?.basic_salary
                  }
                  helperText={
                    errors.basic_salary?.message ||
                    error?.response?.data?.validation_errors?.basic_salary ||
                    updateError?.response?.data?.validation_errors?.basic_salary
                  }
                  {...register('basic_salary')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Remarks'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.remarks ||
                    !!error?.response?.data?.validation_errors?.remarks ||
                    !!updateError?.response?.data?.validation_errors?.remarks
                  }
                  helperText={
                    errors.remarks?.message ||
                    error?.response?.data?.validation_errors?.remarks ||
                    updateError?.response?.data?.validation_errors?.remarks
                  }
                  {...register('remarks')}
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
              loading={isPending || updateIsLoading}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeesContractsForm;
