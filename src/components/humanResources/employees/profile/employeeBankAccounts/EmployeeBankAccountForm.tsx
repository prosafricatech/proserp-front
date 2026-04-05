'use client';

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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeeBankAccountType } from './EmployeeBankAccountType';

interface EmployeeBankAccountFormProps {
  setOpenDialog: (open: boolean) => void;
  account?: EmployeeBankAccountType | null;
  employeeId?: number;
}

interface FormData extends Omit<EmployeeBankAccountType, 'id' | 'created_by'> {
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

const EmployeeBankAccountForm = ({
  setOpenDialog,
  account = null,
  employeeId,
}: EmployeeBankAccountFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addEmployeeBankAccount,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeBankAccount,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Bank Account Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeBankAccounts'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Bank Account', {
        variant: 'error',
      });
    },
  });

  const {
    mutate: updateEmployeeBankAccount,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeBankAccount,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Bank Account Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeBankAccounts'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Bank Account', {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    bank_name: yup
      .string()
      .required('Bank name is required')
      .max(100, 'Bank name cannot exceed 100 characters'),
    branch: yup.string().max(100, 'Branch cannot exceed 100 characters'),
    account_number: yup
      .string()
      .required('Account number is required')
      .max(50, 'Account number cannot exceed 50 characters'),
    account_name: yup
      .string()
      .required('Account name is required')
      .max(200, 'Account name cannot exceed 200 characters'),
    swift_code: yup.string().max(20, 'Swift code cannot exceed 20 characters'),
    is_primary: yup.boolean().required(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: account?.id,
      employee_id: account?.employee_id,
      bank_name: account?.bank_name || '',
      branch: account?.branch || '',
      account_number: account?.account_number || '',
      account_name: account?.account_name || '',
      swift_code: account?.swift_code || '',
      is_primary: account?.is_primary || false,
    },
  });

  useEffect(() => {
    if (employeeId) {
      setValue('employee_id', employeeId);
    }
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return account?.id ? updateEmployeeBankAccount : addEmployeeBankAccount;
  }, [account?.id, updateEmployeeBankAccount, addEmployeeBankAccount]);

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
          {!account?.id ? 'Add Bank Account' : 'Edit Bank Account'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Bank Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.bank_name ||
                    !!getValidationMessage(validationErrors, 'bank_name')
                  }
                  helperText={
                    errors.bank_name?.message ||
                    getValidationMessage(validationErrors, 'bank_name')
                  }
                  {...register('bank_name')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Branch'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.branch ||
                    !!getValidationMessage(validationErrors, 'branch')
                  }
                  helperText={
                    errors.branch?.message ||
                    getValidationMessage(validationErrors, 'branch')
                  }
                  {...register('branch')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Account Number'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.account_number ||
                    !!getValidationMessage(validationErrors, 'account_number')
                  }
                  helperText={
                    errors.account_number?.message ||
                    getValidationMessage(validationErrors, 'account_number')
                  }
                  {...register('account_number')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Account Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.account_name ||
                    !!getValidationMessage(validationErrors, 'account_name')
                  }
                  helperText={
                    errors.account_name?.message ||
                    getValidationMessage(validationErrors, 'account_name')
                  }
                  {...register('account_name')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='SWIFT Code'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.swift_code ||
                    !!getValidationMessage(validationErrors, 'swift_code')
                  }
                  helperText={
                    errors.swift_code?.message ||
                    getValidationMessage(validationErrors, 'swift_code')
                  }
                  {...register('swift_code')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_primary'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label='Set as Primary Account'
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

export default EmployeeBankAccountForm;