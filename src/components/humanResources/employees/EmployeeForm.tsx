'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import * as yup from 'yup';
import { useDepartments } from '../departments/DepartmentsProvider';
import { Department } from '../departments/DepartmentsType';
import humanResourcesServices from '../humanResourcesServices';
import { Employee } from './EmployeesType';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';

interface EmployeeFormProps {
  setOpenDialog: (open: boolean) => void;
  employee?: Employee | null;
}

interface FormData extends Omit<Employee, 'id'> {
  id?: number;
  basic_salary?: number | null;
  contract_start_date?: string | null;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    symbol?: string;
  };
}

interface empTypesOpt {
  label: string;
  value: string;
}

const EmployeeForm = ({
  setOpenDialog,
  employee = null,
}: EmployeeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authUser } = useJumboAuth();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const { departments, isFetching } = useDepartments();
  const [departmentsData, setDepartmentsData] = useState<Department[] | []>([]);
  const [selectedDpt, setSelectedDpt] = useState<Department | null>(null);

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const employmentTypesOptions: empTypesOpt[] = [
    { label: 'Full Time', value: 'full_time' },
    { label: 'Part Time', value: 'part_time' },
    { label: 'Casual', value: 'casual' },
  ];

  const [employeeDoB, setEmployeeDoB] = useState<string | undefined>(undefined);
  const [joinDate, setJoinDate] = useState<string | undefined>(undefined);
  const [contractStartDate, setContractStartDate] = useState<string | undefined>(undefined);
  const [employeeGender, setEmployeeGender] = useState(genderOptions[0]);
  const [selectedemploymentType, setSelectedEmploymentType] =
    useState<empTypesOpt | null>(null);
  
  const normalizedDateOfBirth = employee?.date_of_birth
    ? dayjs(employee.date_of_birth).format('YYYY-MM-DD')
    : '';
  const normalizedJoinDate = employee?.join_date
    ? dayjs(employee.join_date).format('YYYY-MM-DD')
    : '';
  const normalizedContractStartDate = employee?.contract_start_date
    ? dayjs(employee.contract_start_date).format('YYYY-MM-DD')
    : '';

  useEffect(() => {
    if (departments?.data.length) {
      setDepartmentsData(departments.data);

      if (employee?.department_id) {
        setSelectedDpt(
          departments.data.find(
            (department: Department) => department.id === employee.department_id
          ) ?? null
        );
      } else {
        setSelectedDpt(null);
      }
    }
  }, [departments, isFetching, employee?.department_id]);

  useEffect(() => {
    setValue('gender', employeeGender.value);
  }, [employeeGender]);

  const {
    mutate: addEmployee,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const user_id = authUser?.user.id;
      const newData = { ...data, user_id: user_id };
      const response = await humanResourcesServices.addEmployee(newData);
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
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const {
    mutate: updateEmployee,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      const newData = { ...data, id: employee?.id };
      return humanResourcesServices.updateEmployee(newData);
    },
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Employee update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    employee_number: yup.string(),
    first_name: yup
      .string()
      .required('First name is required')
      .max(100, 'First name should not exceed 100 characters'),
    middle_name: yup
      .string()
      .max(100, 'Middle name should not exceed 100 characters'),
    last_name: yup
      .string()
      .required('Last name is required')
      .max(100, 'Last name should not exceed 100 characters'),
    gender: yup.string().required('Gender is required'),
    email: yup.string().email('Invalid email format'),
    phone_number: yup.string(),
    address: yup.string(),
    date_of_birth: yup.string(),
    national_id: yup
      .string()
      .max(50, 'National ID should not exceed 50 characters'),
    passport_number: yup
      .string()
      .max(50, 'Passport number should not exceed 50 characters'),
    department_id: yup.number(),
    cost_center_id: yup.number().nullable().optional(),
    payable_ledger_id: yup.number().nullable().optional(),
    create_payable: yup.boolean().optional(),
    payable_ledger_name: yup.string().nullable().optional(),
    employment_type: yup.string().required('Employment type is required'),
    join_date: yup.string(),
    basic_salary: yup
      .number()
      .nullable()
      .transform((value, originalValue) => {
        // Handle empty string or undefined as null
        if (originalValue === '' || originalValue === undefined || originalValue === null) {
          return null;
        }
        return Number(value);
      })
      .min(0, 'Basic salary must be greater than or equal to 0')
      .typeError('Basic salary must be a number'),
    contract_start_date: yup.string().nullable(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      employee_number: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: employeeGender.value,
      email: '',
      phone_number: '',
      address: '',
      date_of_birth: '',
      national_id: '',
      passport_number: '',
      department_id: undefined,
      cost_center_id: null,
      payable_ledger_id: null,
      create_payable: false,
      payable_ledger_name: '',
      employment_type: '',
      join_date: '',
      basic_salary: null,
      contract_start_date: null,
    },
  });

  // Watch the create_payable field to conditionally show/hide the payable_ledger_name
  const createPayable = useWatch({
    control,
    name: 'create_payable',
  });

  useEffect(() => {
    const resolvedGender =
      genderOptions.find((option) => option.value === employee?.gender) ??
      genderOptions[0];
    const resolvedEmploymentType =
      employmentTypesOptions.find(
        (option) => option.value === employee?.employment_type
      ) ?? null;

    setEmployeeGender(resolvedGender);
    setSelectedEmploymentType(resolvedEmploymentType);
    setEmployeeDoB(normalizedDateOfBirth || undefined);
    setJoinDate(normalizedJoinDate || undefined);
    setContractStartDate(normalizedContractStartDate || undefined);

    reset({
      employee_number: employee?.employee_number || '',
      first_name: employee?.first_name || '',
      middle_name: employee?.middle_name || '',
      last_name: employee?.last_name || '',
      gender: resolvedGender.value,
      email: employee?.email || '',
      phone_number: employee?.phone_number || '',
      address: employee?.address || '',
      date_of_birth: normalizedDateOfBirth,
      national_id: employee?.national_id || '',
      passport_number: employee?.passport_number || '',
      department_id: employee?.department_id || undefined,
      cost_center_id: employee?.cost_center_id ?? null,
      payable_ledger_id: employee?.payable_ledger_id ?? null,
      create_payable: false,
      payable_ledger_name: '',
      employment_type: resolvedEmploymentType?.value || '',
      join_date: normalizedJoinDate,
      basic_salary: employee?.basic_salary ?? null,
      contract_start_date: normalizedContractStartDate || null,
    });
  }, [employee, normalizedDateOfBirth, normalizedJoinDate, normalizedContractStartDate, reset]);

  const onSubmit = (data: FormData) => {
    if (employee?.id) {
      updateEmployee(data);
    } else {
      addEmployee(data);
    }
  };

  // Helper to format currency display
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '';
    return value.toLocaleString();
  };

  // Helper to parse currency input
  const parseCurrency = (value: string) => {
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!employee?.id
            ? 'Add Employee'
            : `Edit ${employee.first_name} ${employee.middle_name} ${employee.last_name}`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={1}>
            {/* Personal Information Section */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontSize: '1.1rem' }}>
                Personal Information
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='First Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.first_name ||
                    !!error?.response?.data?.validation_errors?.first_name ||
                    !!updateError?.response?.data?.validation_errors?.first_name
                  }
                  helperText={
                    errors.first_name?.message ||
                    error?.response?.data?.validation_errors?.first_name ||
                    updateError?.response?.data?.validation_errors?.first_name
                  }
                  {...register('first_name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Middle Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.middle_name ||
                    !!error?.response?.data?.validation_errors?.middle_name ||
                    !!updateError?.response?.data?.validation_errors
                      ?.middle_name
                  }
                  helperText={
                    errors.middle_name?.message ||
                    error?.response?.data?.validation_errors?.middle_name ||
                    updateError?.response?.data?.validation_errors?.middle_name
                  }
                  {...register('middle_name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Last Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.last_name ||
                    !!error?.response?.data?.validation_errors?.last_name ||
                    !!updateError?.response?.data?.validation_errors?.last_name
                  }
                  helperText={
                    errors.last_name?.message ||
                    error?.response?.data?.validation_errors?.last_name ||
                    updateError?.response?.data?.validation_errors?.last_name
                  }
                  {...register('last_name')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Employee Number'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.employee_number ||
                    !!error?.response?.data?.validation_errors
                      ?.employee_number ||
                    !!updateError?.response?.data?.validation_errors
                      ?.employee_number
                  }
                  helperText={
                    errors.employee_number?.message ||
                    error?.response?.data?.validation_errors?.employee_number ||
                    updateError?.response?.data?.validation_errors
                      ?.employee_number
                  }
                  {...register('employee_number')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='gender'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      size='small'
                      options={genderOptions}
                      isOptionEqualToValue={(option, value) =>
                        option.label === value.label
                      }
                      getOptionLabel={(option) => option.label}
                      {...field}
                      value={employeeGender}
                      onChange={(event, newValue) => {
                        field.onChange(newValue?.value);
                        newValue && setEmployeeGender(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label='Gender' 
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
                  name='date_of_birth'
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Date of Birth'
                      {...field}
                      value={employeeDoB ? dayjs(employeeDoB) : null}
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');
                          setEmployeeDoB(formatted);
                          field.onChange(formatted);
                        } else {
                          setEmployeeDoB(undefined);
                          field.onChange('');
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

            {/* Contact Information Section */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontSize: '1.1rem' }}>
                Contact Information
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Email'
                  size='small'
                  fullWidth
                  type='email'
                  error={
                    !!errors?.email ||
                    !!error?.response?.data?.validation_errors?.email ||
                    !!updateError?.response?.data?.validation_errors?.email
                  }
                  helperText={
                    errors.email?.message ||
                    error?.response?.data?.validation_errors?.email ||
                    updateError?.response?.data?.validation_errors?.email
                  }
                  {...register('email')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Phone Number'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.phone_number ||
                    !!error?.response?.data?.validation_errors?.phone_number ||
                    !!updateError?.response?.data?.validation_errors
                      ?.phone_number
                  }
                  helperText={
                    errors.phone_number?.message ||
                    error?.response?.data?.validation_errors?.phone_number ||
                    updateError?.response?.data?.validation_errors?.phone_number
                  }
                  {...register('phone_number')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Address'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.address ||
                    !!error?.response?.data?.validation_errors?.address ||
                    !!updateError?.response?.data?.validation_errors?.address
                  }
                  helperText={
                    errors.address?.message ||
                    error?.response?.data?.validation_errors?.address ||
                    updateError?.response?.data?.validation_errors?.address
                  }
                  {...register('address')}
                />
              </Div>
            </Grid>

            {/* Identification Section */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontSize: '1.1rem' }}>
                Identification
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='National ID'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.national_id ||
                    !!error?.response?.data?.validation_errors?.national_id ||
                    !!updateError?.response?.data?.validation_errors
                      ?.national_id
                  }
                  helperText={
                    errors.national_id?.message ||
                    error?.response?.data?.validation_errors?.national_id ||
                    updateError?.response?.data?.validation_errors?.national_id
                  }
                  {...register('national_id')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Passport Number'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.passport_number ||
                    !!error?.response?.data?.validation_errors
                      ?.passport_number ||
                    !!updateError?.response?.data?.validation_errors
                      ?.passport_number
                  }
                  helperText={
                    errors.passport_number?.message ||
                    error?.response?.data?.validation_errors?.passport_number ||
                    updateError?.response?.data?.validation_errors
                      ?.passport_number
                  }
                  {...register('passport_number')}
                />
              </Div>
            </Grid>

            {/* Employment Details Section */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontSize: '1.1rem' }}>
                Employment Details
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                {isFetching ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='department_id'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Autocomplete
                        size='small'
                        options={departmentsData}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        getOptionLabel={(option) => option?.name || ''}
                        {...field}
                        value={selectedDpt}
                        onChange={(event, newValue) => {
                          setSelectedDpt(newValue);
                          field.onChange(newValue ? newValue.id : null);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label='Department'
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
                  name='employment_type'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      size='small'
                      options={employmentTypesOptions}
                      isOptionEqualToValue={(option, value) =>
                        option.label === value.label
                      }
                      getOptionLabel={(option) => option.label}
                      {...field}
                      value={selectedemploymentType}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          setSelectedEmploymentType(newValue);
                        } else {
                          setSelectedEmploymentType(null);
                        }
                        field.onChange(newValue ? newValue.value : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Employment Type'
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
                  name='join_date'
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Join Date'
                      {...field}
                      value={joinDate ? dayjs(joinDate) : null}
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');
                          setJoinDate(formatted);
                          field.onChange(formatted);
                        } else {
                          setJoinDate(undefined);
                          field.onChange('');
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

            {/* New Payroll-Ready Fields */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontSize: '1.1rem' }}>
                Payroll & Contract Settings
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='basic_salary'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label='Basic Salary'
                      size='small'
                      fullWidth
                      value={field.value !== null && field.value !== undefined ? formatCurrency(field.value) : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const cleaned = value.replace(/,/g, '');
                        const num = parseFloat(cleaned);
                        field.onChange(isNaN(num) ? null : num);
                      }}
                      onBlur={() => {
                        if (field.value !== null && field.value !== undefined) {
                          const formatted = formatCurrency(field.value);
                          // We need to set the displayed value, but keep the number in form state
                          const input = document.querySelector('input[name="basic_salary_display"]') as HTMLInputElement;
                          if (input) {
                            input.value = formatted;
                          }
                        }
                      }}
                      error={
                        !!errors?.basic_salary ||
                        !!error?.response?.data?.validation_errors?.basic_salary ||
                        !!updateError?.response?.data?.validation_errors?.basic_salary
                      }
                      helperText={
                        errors.basic_salary?.message ||
                        error?.response?.data?.validation_errors?.basic_salary ||
                        updateError?.response?.data?.validation_errors?.basic_salary
                      }
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='contract_start_date'
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Contract Start Date'
                      {...field}
                      value={contractStartDate ? dayjs(contractStartDate) : null}
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');
                          setContractStartDate(formatted);
                          field.onChange(formatted);
                        } else {
                          setContractStartDate(undefined);
                          field.onChange(null);
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
                  name='cost_center_id'
                  control={control}
                  render={({ field }) => (
                    <CostCenterSelector
                      multiple={false}
                      label='Cost Center'
                      defaultValue={(employee as any)?.cost_center || null}
                      onChange={(value) => {
                        const selected = Array.isArray(value) ? value[0] : value;
                        field.onChange(selected?.id || null);
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>

            {/* Accounting Section */}
            <Grid size={12}>
              <Div sx={{ mt: 2, mb: 1, fontSize: '1.1rem' }}>
                Accounting Settings
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <LedgerSelect
                  frontError={errors.payable_ledger_id}
                  defaultValue={
                    ungroupedLedgerOptions.find(
                      (ledger) => ledger.id === employee?.payable_ledger_id
                    ) || null
                  }
                  allowedGroups={['Accounts Payable']}
                  onChange={(newValue) => {
                    if (Array.isArray(newValue)) return;
                    setValue('payable_ledger_id', newValue ? newValue.id : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  label='Payable Account'
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='create_payable'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(event) => {
                            field.onChange(event.target.checked);
                            // If unchecked, clear the payable_ledger_name
                            if (!event.target.checked) {
                              setValue('payable_ledger_name', '');
                            }
                          }}
                        />
                      }
                      label='Auto-create payable account'
                    />
                  )}
                />
              </Div>
            </Grid>

            {/* Payable Ledger Name - Show only when create_payable is true */}
            {createPayable && (
              <Grid size={{ xs: 12, md: 12 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    label='Payable Ledger Name'
                    size='small'
                    fullWidth
                    placeholder='e.g., Payable - Jane Doe'
                    error={
                      !!errors?.payable_ledger_name ||
                      !!error?.response?.data?.validation_errors
                        ?.payable_ledger_name ||
                      !!updateError?.response?.data?.validation_errors
                        ?.payable_ledger_name
                    }
                    helperText={
                      errors.payable_ledger_name?.message ||
                      error?.response?.data?.validation_errors
                        ?.payable_ledger_name ||
                      updateError?.response?.data?.validation_errors
                        ?.payable_ledger_name
                    }
                    {...register('payable_ledger_name')}
                  />
                </Div>
              </Grid>
            )}
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
              {employee?.id ? 'Update' : 'Create'}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeeForm;