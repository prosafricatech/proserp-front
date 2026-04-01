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
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { FormEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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

  useEffect(() => {
    const date = new Date();
    const dayjsDate = dayjs(date).toISOString().split('T')[0];
    setEmployeeDoB(dayjsDate);
    setJoinDate(dayjsDate);
  }, []);

  const [employeeDoB, setEmployeeDoB] = useState<string | undefined>('');
  const [joinDate, setJoinDate] = useState<string | undefined>('');
  const [employeeGender, setEmployeeGender] = useState(genderOptions[0].value);
  const [selectedemploymentType, setSelectedEmploymentType] =
    useState<empTypesOpt | null>(null);

  const handleChange = (event: SelectChangeEvent) => {
    setEmployeeGender(event.target.value as string);
  };

  useEffect(() => {
    setValue('gender', employeeGender);
  }, [employeeGender]);

  const {
    mutate: addEmployee,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployee,
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
    email: yup.string().email().required('email is required'),
    phone_number: yup.string().required('Phone number is required'),
    address: yup.string().required('Address is required'),
    date_of_birth: yup.date().required('Date of birth is required'),
    national_id: yup
      .string()
      .max(50, 'National ID should not exceed 50 characters'),
    passport_number: yup
      .string()
      .max(50, 'Passport number should not exceed 50 characters'),
    department_id: yup.number(),
    employment_type: yup.string(),
    join_date: yup.date(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      employee_number: employee?.employee_number || '',
      first_name: employee?.first_name || '',
      middle_name: employee?.middle_name || '',
      last_name: employee?.last_name || '',
      gender: employee?.gender || employeeGender,
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

  const saveMutation = React.useMemo(() => {
    return employee?.id ? updateEmployee : addEmployee;
  }, [employee, updateEmployee, addEmployee]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  const submitForm = (e: FormEvent) => {
    e.preventDefault();
    const formdata = getValues();
    const user_id = authUser?.user.id;
    const newData = { ...formdata, user_id: user_id };
    console.log('newData: ', newData);
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
        {/* <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}> */}
        <form autoComplete='off' onSubmit={(e) => submitForm(e)}>
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
                <Autocomplete
                  size='small'
                  options={genderOptions}
                  isOptionEqualToValue={(option, value) =>
                    option.label === value.label
                  }
                  getOptionLabel={(option) => option.label}
                  value={genderOptions[0]}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setEmployeeGender(newValue.value);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label='Gender' />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Email'
                  placeholder='example@gmail.com'
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
                  placeholder='0712345678'
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
                <DatePicker
                  label='Date of Birth'
                  value={dayjs(employeeDoB)}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      const formatted = value.format('YYYY-MM-DD');
                      console.log('formatted: ', formatted);

                      setEmployeeDoB(formatted);
                      setValue('date_of_birth', formatted);
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
                  label='Adress'
                  placeholder='Dar es salaam, Tanzania'
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
                  <Autocomplete
                    size='small'
                    options={departmentsData}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option?.name || ''}
                    value={selectedDpt}
                    onChange={(event, newValue) => {
                      setSelectedDpt(newValue);
                      if (newValue !== null) {
                        setValue('department_id', newValue.id || null);
                      } else {
                        setValue('department_id', undefined);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label='Department' />
                    )}
                  />
                )}
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete
                  size='small'
                  options={employmentTypesOptions}
                  isOptionEqualToValue={(option, value) =>
                    option.label === value.label
                  }
                  getOptionLabel={(option) => option.label}
                  value={selectedemploymentType}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setSelectedEmploymentType(newValue);
                      setValue('employment_type', newValue.value);
                    } else {
                      setSelectedEmploymentType(null);
                      setValue('employment_type', '');
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label='Employment Type' />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DatePicker
                  label='Join Date'
                  value={dayjs(joinDate)}
                  onChange={(value: Dayjs | null) => {
                    if (value) {
                      const formatted = value.format('YYYY-MM-DD');
                      console.log('formatted: ', formatted);

                      setJoinDate(formatted);
                      setValue('join_date', formatted);
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
