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
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useDepartments } from '../departments/DepartmentsProvider';
import { Department } from '../departments/DepartmentsType';
import humanResourcesServices from '../humanResourcesServices';
import { Employee } from './EmployeesType';

interface EmployeeFormProps {
  setOpenDialog: (open: boolean) => void;
  employee?: Employee | null;
}

interface FormData extends Omit<Employee, 'id'> {
  id?: number;
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
  const { departments, isFetching } = useDepartments();
  const [departmentsData, setDepartmentsData] = useState<Department[] | []>([]);
  const [selectedDpt, setSelectedDpt] = useState<Department | null>(null);

  useEffect(() => {
    if (departments?.data.length) {
      setDepartmentsData(departments.data);
      setSelectedDpt(departments.data[0]);
    }
  }, [departments, isFetching]);

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
  const [employeeGender, setEmployeeGender] = useState(genderOptions[0]);
  const [selectedemploymentType, setSelectedEmploymentType] =
    useState<empTypesOpt | null>(null);

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
      enqueueSnackbar('Error Updating Employee', {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    employee_number: yup.string(),
    first_name: yup
      .string()
      .required('First name is required')
      .max(100, 'First name should not exceed 50 characters'),
    middle_name: yup
      .string()
      .max(100, 'Middle name should not exceed 50 characters'),
    last_name: yup
      .string()
      .required('Last name is required')
      .max(100, 'Last name should not exceed 50 characters'),
    gender: yup.string().required('Gender is required'),
    email: yup.string().email(),
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
    employment_type: yup.string().required('Employment type is required'),
    join_date: yup.string(),
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
      employee_number: employee?.employee_number || '',
      first_name: employee?.first_name || '',
      middle_name: employee?.middle_name || '',
      last_name: employee?.last_name || '',
      gender: employee?.gender || employeeGender.value,
      email: employee?.email || '',
      phone_number: employee?.phone_number || '',
      address: employee?.address || '',
      date_of_birth: employee?.date_of_birth || employeeDoB,
      national_id: employee?.national_id || '',
      passport_number: employee?.passport_number || '',
      department_id: employee?.department_id || undefined,
      employment_type: employee?.employment_type || '',
      join_date: employee?.join_date || '',
    },
  });

  const onSubmit = (data: FormData) => {
    // saveMutation?.(data);
    if (employee?.id) {
      updateEmployee(data);
    } else {
      addEmployee(data);
    }
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!employee?.id
            ? 'Add Employee'
            : `Edit Employee ${employee.first_name} ${employee.middle_name} ${employee.last_name}`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
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
                        <TextField {...params} label='Gender' />
                      )}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Email'
                  size='small'
                  fullWidth
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
                <Controller
                  name='date_of_birth'
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Date of Birth'
                      {...field}
                      value={
                        employeeDoB !== undefined
                          ? dayjs(employeeDoB)
                          : undefined
                      }
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');

                          setEmployeeDoB(formatted);
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
                  label='Adress'
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

            <Grid size={{ xs: 12, md: 4 }}>
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
            <Grid size={{ xs: 12, md: 4 }}>
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
            <Grid size={{ xs: 12, md: 4 }}>
              <Div>
                {isFetching ? (
                  <LinearProgress />
                ) : (
                  <Controller
                    name='department_id'
                    control={control}
                    rules={{ required: true }}
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
                  rules={{ required: true }}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Join Date'
                      {...field}
                      value={
                        joinDate !== undefined ? dayjs(joinDate) : undefined
                      }
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          const formatted = value.format('YYYY-MM-DD');

                          setJoinDate(formatted);
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

export default EmployeeForm;
