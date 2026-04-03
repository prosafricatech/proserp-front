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
  employeeId?: number;
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
  employeeId,
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
    { label: 'Fixed Term', value: 'fixed_term' },
    { label: 'Probation', value: 'probation' },
  ];

  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [probationEnd, setProbationENd] = useState<string | undefined>(
    undefined
  );
  const [contractType, setContractType] = useState(contractOptions[0]);

  useEffect(() => {
    const date = new Date();
    const dayjsDate = dayjs(date).toISOString().split('T')[0];
    if (contract?.id) {
      contract.start_date && setStartDate(contract.start_date);
      contract.end_date && setEndDate(contract.end_date);
      contract.probation_end_date &&
        setProbationENd(contract.probation_end_date);
      let newLabel;
      if (contract.contract_type === 'permanent') {
        newLabel = 'Permanent';
      } else if (contract.contract_type === 'fixed_term') {
        newLabel = 'fixed Ferm';
      } else {
        newLabel = 'Probation';
      }
      contract.contract_type &&
        setContractType({ label: newLabel, value: contract.contract_type });
    }
  }, []);

  const {
    mutate: addEmployeeContract,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const response = await humanResourcesServices.addEmployeeContract(data);
      return response;
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Employee Contract', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Adding Employee Contract', {
        variant: 'error',
      });
      console.log('error adding employee Contract: ', error);
    },
  });

  const {
    mutate: updateEmployeeContract,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const newData = { ...data, id: contract?.id };
      return humanResourcesServices.updateEmployeeContract(newData);
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Employee Contract update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
    },
    onError: (error) => {
      console.log('error: ', error);
      enqueueSnackbar('Error Updating Employee Contract', {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    employee_id: yup.number().required('Employee is required'),
    designation_id: yup.number().required('Designation is required'),
    contract_type: yup.string().required('Contract type is required'),
    start_date: yup.string().required('Start date is required'),
    end_date: yup
  .string()
  .nullable()
  .when('contract_type', {
    is: 'fixed_term',
    then: (schema) =>
      schema
        .required('End date is required')
        .test(
          'is-after-start-date',
          'End date must be after start date',
          function (value) {
            const { start_date } = this.parent;

            if (!value || !start_date) return true; // skip if empty

            return value >= start_date; // YYYY-MM-DD string compare
          }
        ),
    otherwise: (schema) => schema.notRequired(),
  }),
    probation_end_date: yup
      .string()
      .nullable()
      .notRequired()
      .transform((value) => (value === undefined ? null : value))
      .test(
        'is-after-start-date',
        'Probation End Date must be after start date',
        function (value) {
          const { start_date } = this.parent;

          if (!value || !start_date) return true; // skip validation if empty

          return value >= start_date; // string compare works for YYYY-MM-DD
        }
      ),
    basic_salary: yup
      .number()
      .required('Basic salary is required')
      .min(0, 'Basic salary cannot be less than 0'),
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
  
  // Pre-fill employee_id when rendered inside the Employee Profile
  useEffect(() => {
    if (employeeId) {
      setValue('employee_id', employeeId);
    }
  }, [employeeId, setValue]);
  
  useEffect(() => {
    setValue('contract_type', contractType.value);
  }, [contractType, setValue]);


  const saveMutation = React.useMemo(() => {
    return contract?.id ? updateEmployeeContract : addEmployeeContract;
  }, [contract, updateEmployeeContract, addEmployeeContract]);

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
            {!employeeId && (
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
            )}
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
                <Controller
                  name='contract_type'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      size='small'
                      options={contractOptions}
                      isOptionEqualToValue={(option, value) =>
                        option.label === value.label
                      }
                      getOptionLabel={(option) => option.label}
                      {...field}
                      value={contractType}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          setContractType(newValue);
                        }
                        field.onChange(newValue?.value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Contract Type'
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='start_date'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Start Date'
                      value={
                        startDate !== undefined ? dayjs(startDate) : undefined
                      }
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');

                          setStartDate(formatted);
                          field.onChange(formatted);
                        }
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                          // InputProps: {
                          //   endAdornment: field.value && (
                          //     <InputAdornment position='end'>
                          //       <IconButton
                          //         onClick={() => {
                          //           setStartDate(undefined);
                          //           field.onChange(undefined);
                          //         }}
                          //       >
                          //         <ClearIcon />
                          //       </IconButton>
                          //     </InputAdornment>
                          //   ),
                          // },
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
                  name='end_date'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='End Date'
                      value={endDate !== undefined ? dayjs(endDate) : undefined}
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');

                          setEndDate(formatted);
                          field.onChange(formatted);
                        }
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
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
                  name='probation_end_date'
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Probation End Date'
                      value={
                        probationEnd !== undefined
                          ? dayjs(probationEnd)
                          : undefined
                      }
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');

                          setProbationENd(formatted);
                          field.onChange(formatted);
                        }
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                    />
                  )}
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
