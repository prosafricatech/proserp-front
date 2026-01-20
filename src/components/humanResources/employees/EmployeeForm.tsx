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
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
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

const EmployeeForm = ({
  setOpenDialog,
  employee = null,
}: EmployeeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const [employeeGender, setEmployeeGender] = useState<string | undefined>(
    undefined
  );

  const handleChange = (event: SelectChangeEvent) => {
    setEmployeeGender(event.target.value as string);
  };

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
      console.log('data: ', data);
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
    first_name: yup
      .string()
      .required('First Name is required')
      .max(100, 'First Name is too long'),
    middle_name: yup.string().nullable(),
    last_name: yup
      .string()
      .required('Last Name is required')
      .max(100, 'Last Name is too long'),
    gender: yup
      .string()
      .required('Gender is required')
      .oneOf(['male', 'female'], 'Gender is required'),
    email: yup
      .string()
      .email()
      .nullable()
      .test(
        'unique',
        'Email already exists',
        (value) => !value || !employee?.email.includes(value)
      ),
    phone_number: yup.string().nullable().max(20, 'Phone Number is too long'),
    address: yup.string().nullable().max(500, 'Address is too long'),
    date_of_birth: yup.date().nullable(),
    user_id: yup.array().nullable(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      first_name: employee?.first_name || '',
      middle_name: employee?.middle_name || '',
      last_name: employee?.last_name || '',
      gender: employee?.gender || employeeGender,
      email: employee?.email || '',
      phone_number: employee?.phone_number || '',
      address: employee?.address || '',
      date_of_birth: employee?.date_of_birth || undefined,
      user_id: employee?.user_id || undefined,
    },
  });

  const saveMutation = React.useMemo(() => {
    return employee?.id ? updateEmployee : addEmployee;
  }, [employee, updateEmployee, addEmployee]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
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
                  label='First Name'
                  placeholder=''
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
                  placeholder=''
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
                  placeholder=''
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
                  value={
                    genderOptions.find(
                      (option) => option.value === employeeGender
                    ) || null
                  }
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setEmployeeGender(newValue?.value ?? '');
                      setValue('gender', newValue?.value ?? '', {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Gender'
                      error={!!errors.gender}
                      helperText={errors.gender?.message}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Email'
                  placeholder=''
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
                  placeholder=''
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
                  value={
                    employee?.date_of_birth
                      ? dayjs(employee.date_of_birth)
                      : null
                  }
                  onChange={(value) => {
                    if (value) {
                      setValue('date_of_birth', value?.format('YYYY-MM-DD'), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      error: !!errors.date_of_birth,
                      helperText: errors.date_of_birth?.message,
                    },
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Address'
                  placeholder=''
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
