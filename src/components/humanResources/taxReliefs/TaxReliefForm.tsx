'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { TaxReliefType } from './TaxReliefType';

interface TaxReliefFormProps {
  setOpenDialog: (open: boolean) => void;
  taxRelief?: TaxReliefType | null;
}

interface FormData extends Omit<TaxReliefType, 'id' | 'created_by'> {
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

const TaxReliefForm = ({
  setOpenDialog,
  taxRelief = null,
}: TaxReliefFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addTaxRelief,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addTaxRelief,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Tax Relief Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['taxReliefs'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Tax Relief', {
        variant: 'error',
      });
      console.log('error adding tax relief: ', mutationError);
    },
  });

  const {
    mutate: updateTaxRelief,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateTaxRelief,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Tax Relief Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['taxReliefs'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Tax Relief', {
        variant: 'error',
      });
      console.log('error updating tax relief: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required('Name is required')
      .max(255, 'Name cannot exceed 255 characters'),
    amount: yup
      .number()
      .typeError('Amount must be a number')
      .required('Amount is required')
      .min(0, 'Amount must be 0 or greater'),
    is_active: yup.boolean().required(),
    description: yup.string().max(500, 'Description cannot exceed 500 characters'),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: taxRelief?.id,
      name: taxRelief?.name || '',
      amount: taxRelief?.amount ?? 0,
      is_active: taxRelief?.is_active ?? true,
      description: taxRelief?.description || '',
    },
  });

  const saveMutation = useMemo(() => {
    return taxRelief?.id ? updateTaxRelief : addTaxRelief;
  }, [taxRelief?.id, updateTaxRelief, addTaxRelief]);

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
          {!taxRelief?.id ? 'Add Tax Relief' : 'Edit Tax Relief'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!getValidationMessage(validationErrors, 'name')
                  }
                  helperText={
                    errors.name?.message ||
                    getValidationMessage(validationErrors, 'name')
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Amount'
                  
                  size='small'
                  fullWidth
                  error={
                    !!errors?.amount ||
                    !!getValidationMessage(validationErrors, 'amount')
                  }
                  helperText={
                    errors.amount?.message ||
                    getValidationMessage(validationErrors, 'amount')
                  }
                  {...register('amount')}
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

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_active'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label='Is Active'
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

export default TaxReliefForm;
