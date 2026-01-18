import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React from 'react';
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

  const [employeeGender, setEmployeeGender] = React.useState('');

  const handleChange = (event: SelectChangeEvent) => {
    setEmployeeGender(event.target.value as string);
  };

  const {
    mutate: addEmployee,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.add,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Suces Adding Employee', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Adding Employee', {
        variant: 'error',
      });
    },
  });

  const {
    mutate: updateEmployee,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.update,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Employee update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Updating EMployee', {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    first_name: yup.string().required('First name is required'),
    middle_name: yup.string().required('Middle name is required'),
    last_name: yup.string().required('Last name is required'),
    gender: yup.string().required('Gender is required'),
    email: yup.string().email().required('email is required'),
    phone_number: yup.string().required('Phone number is required'),
    address: yup.string().required('Address is required'),
    date_of_birth: yup
      .string()
      .datetime()
      .required('Date of birth is required'),
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
      gender: employee?.gender || '',
      email: employee?.email || '',
      phone_number: employee?.phone_number || '',
      address: employee?.address || '',
      date_of_birth: employee?.date_of_birth || '',
    },
  });

  const saveMutation = React.useMemo(() => {
    return employee?.user_id ? updateEmployee : addEmployee;
  }, [employee, updateEmployee, addEmployee]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!employee?.user_id
            ? 'Add Employee'
            : `Edit Employee ${employee.first_name} ${employee.middle_name} ${employee.last_name}`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='First Name'
                  placeholder='John'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.first_name ||
                    !!error?.response?.data?.validation_errors?.first_name ||
                    !!updateError?.response?.data?.validation_errors?.name
                  }
                  helperText={
                    errors.first_name?.message ||
                    error?.response?.data?.validation_errors?.name ||
                    updateError?.response?.data?.validation_errors?.name
                  }
                  {...register('first_name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Middle Name'
                  placeholder='James'
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
                  placeholder='Doe'
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
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <InputLabel id='gende-select-label'>Gender</InputLabel>
                <Select
                  fullWidth
                  labelId='gende-select-label'
                  id='gende-select'
                  value={employeeGender}
                  label='Gender'
                  onChange={handleChange}
                >
                  <MenuItem value='male'>Male</MenuItem>
                  <MenuItem value='female'>Female</MenuItem>
                </Select>
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
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Date Of Birth'
                  placeholder='18 Jan 1989'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.date_of_birth ||
                    !!error?.response?.data?.validation_errors?.date_of_birth ||
                    !!updateError?.response?.data?.validation_errors
                      ?.date_of_birth
                  }
                  helperText={
                    errors.date_of_birth?.message ||
                    error?.response?.data?.validation_errors?.date_of_birth ||
                    updateError?.response?.data?.validation_errors
                      ?.date_of_birth
                  }
                  {...register('date_of_birth')}
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
