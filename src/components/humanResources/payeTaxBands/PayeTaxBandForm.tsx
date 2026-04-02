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
import { PayeTaxBandType } from './PayeTaxBandType';

interface PayeTaxBandFormProps {
  setOpenDialog: (open: boolean) => void;
  payeTaxBand?: PayeTaxBandType | null;
}

interface FormData extends Omit<PayeTaxBandType, 'id' | 'created_by'> {
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

const PayeTaxBandForm = ({
  setOpenDialog,
  payeTaxBand = null,
}: PayeTaxBandFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addPayeTaxBand,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addPayeTaxBand,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('PAYE Tax Band Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payeTaxBands'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding PAYE Tax Band', {
        variant: 'error',
      });
      console.log('error adding paye tax band: ', mutationError);
    },
  });

  const {
    mutate: updatePayeTaxBand,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updatePayeTaxBand,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('PAYE Tax Band Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payeTaxBands'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating PAYE Tax Band', {
        variant: 'error',
      });
      console.log('error updating paye tax band: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    min_income: yup
      .number()
      .typeError('Minimum income must be a number')
      .required('Minimum income is required')
      .min(0, 'Minimum income must be 0 or greater'),
    max_income: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === '' || originalValue === null ? null : value
      )
      .min(0, 'Maximum income must be 0 or greater')
      .optional(),
    rate_percent: yup
      .number()
      .typeError('Rate percent must be a number')
      .required('Rate percent is required')
      .min(0, 'Rate percent must be 0 or greater')
      .max(100, 'Rate percent cannot exceed 100'),
    fixed_amount: yup
      .number()
      .nullable()
      .transform((value, originalValue) =>
        originalValue === '' || originalValue === null ? null : value
      )
      .min(0, 'Fixed amount must be 0 or greater')
      .optional(),
    description: yup.string().max(500, 'Description cannot exceed 500 characters'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: payeTaxBand?.id,
      min_income: payeTaxBand?.min_income ?? 0,
      max_income: payeTaxBand?.max_income ?? null,
      rate_percent: payeTaxBand?.rate_percent ?? 0,
      fixed_amount: payeTaxBand?.fixed_amount ?? null,
      description: payeTaxBand?.description || '',
    },
  });

  const saveMutation = useMemo(() => {
    return payeTaxBand?.id ? updatePayeTaxBand : addPayeTaxBand;
  }, [payeTaxBand?.id, updatePayeTaxBand, addPayeTaxBand]);

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
          {!payeTaxBand?.id ? 'Add PAYE Tax Band' : 'Edit PAYE Tax Band'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Minimum Income'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.min_income ||
                    !!getValidationMessage(validationErrors, 'min_income')
                  }
                  helperText={
                    errors.min_income?.message ||
                    getValidationMessage(validationErrors, 'min_income')
                  }
                  {...register('min_income')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Maximum Income'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.max_income ||
                    !!getValidationMessage(validationErrors, 'max_income')
                  }
                  helperText={
                    errors.max_income?.message ||
                    getValidationMessage(validationErrors, 'max_income')
                  }
                  {...register('max_income')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Rate Percent'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.rate_percent ||
                    !!getValidationMessage(validationErrors, 'rate_percent')
                  }
                  helperText={
                    errors.rate_percent?.message ||
                    getValidationMessage(validationErrors, 'rate_percent')
                  }
                  {...register('rate_percent')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Fixed Amount'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.fixed_amount ||
                    !!getValidationMessage(validationErrors, 'fixed_amount')
                  }
                  helperText={
                    errors.fixed_amount?.message ||
                    getValidationMessage(validationErrors, 'fixed_amount')
                  }
                  {...register('fixed_amount')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Description'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.description ||
                    !!getValidationMessage(validationErrors, 'description')
                  }
                  helperText={
                    errors.description?.message ||
                    getValidationMessage(validationErrors, 'description')
                  }
                  {...register('description')}
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

export default PayeTaxBandForm;
