'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from './PayrollPeriodType';

interface PayrollPeriodFormProps {
  setOpenDialog: (open: boolean) => void;
  payrollPeriod?: PayrollPeriodType | null;
}

interface FormData {
  id?: number;
  year: number;
  month: number;
  remarks?: string | null;
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

const PayrollPeriodForm = ({
  setOpenDialog,
  payrollPeriod = null,
}: PayrollPeriodFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addPayrollPeriod,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addPayrollPeriod,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Payroll Period Added Successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Payroll Period', { variant: 'error' });
      console.log('error adding payroll period: ', mutationError);
    },
  });

  const {
    mutate: updatePayrollPeriod,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updatePayrollPeriod,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Payroll Period Updated Successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Payroll Period', { variant: 'error' });
      console.log('error updating payroll period: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    year: yup
      .number()
      .typeError('Year must be a number')
      .required('Year is required')
      .min(2000, 'Year must be 2000 or greater')
      .max(2100, 'Year must be 2100 or less'),
    month: yup
      .number()
      .typeError('Month must be a number')
      .required('Month is required')
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12'),
    remarks: yup
      .string()
      .nullable()
      .transform((value) => (value === '' ? null : value))
      .max(500, 'Remarks cannot exceed 500 characters')
      .optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: payrollPeriod?.id,
      year: payrollPeriod?.year,
      month: payrollPeriod?.month,
      remarks: payrollPeriod?.remarks ?? null,
    },
  });

  const saveMutation = useMemo(
    () => (payrollPeriod?.id ? updatePayrollPeriod : addPayrollPeriod),
    [payrollPeriod?.id, updatePayrollPeriod, addPayrollPeriod]
  );

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
          {!payrollPeriod?.id ? 'Add Payroll Period' : 'Edit Payroll Period'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Year'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.year ||
                    !!getValidationMessage(validationErrors, 'year')
                  }
                  helperText={
                    errors.year?.message ||
                    getValidationMessage(validationErrors, 'year')
                  }
                  {...register('year')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Month'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.month ||
                    !!getValidationMessage(validationErrors, 'month')
                  }
                  helperText={
                    errors.month?.message ||
                    getValidationMessage(validationErrors, 'month')
                  }
                  {...register('month')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Remarks'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.remarks ||
                    !!getValidationMessage(validationErrors, 'remarks')
                  }
                  helperText={
                    errors.remarks?.message ||
                    getValidationMessage(validationErrors, 'remarks')
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

export default PayrollPeriodForm;
