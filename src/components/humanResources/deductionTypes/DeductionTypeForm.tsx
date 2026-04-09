'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { DeductionType } from './DeductionType';

interface DeductionTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  deductionType?: DeductionType | null;
}

interface FormData extends Omit<DeductionType, 'id' | 'created_by'> {
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

const formatCommaSeparatedValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '';
  const numericValue = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(numericValue) ? '' : numericValue.toLocaleString('en-US');
};

const DeductionTypeForm = ({
  setOpenDialog,
  deductionType = null,
}: DeductionTypeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addDeductionType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addDeductionType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Deduction Type Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['deductionTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Deduction Type', {
        variant: 'error',
      });
      console.log('error adding deduction type: ', mutationError);
    },
  });

  const {
    mutate: updateDeductionType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateDeductionType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Deduction Type Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['deductionTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Deduction Type', {
        variant: 'error',
      });
      console.log('error updating deduction type: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required('Name is required')
      .max(255, 'Name cannot exceed 255 characters'),
    code: yup.string().max(50, 'Code cannot exceed 50 characters'),
    category: yup
      .string()
      .oneOf(['statutory', 'voluntary'])
      .required('Category is required'),
    computation_method: yup
      .string()
      .oneOf(['fixed', 'percentage_of_basic', 'percentage_of_gross'])
      .required('Computation method is required'),
    default_value: yup
      .number()
      .typeError('Default value must be a number')
      .required('Default value is required')
      .min(0, 'Default value must be 0 or greater'),
    is_pre_tax: yup.boolean().required(),
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
      id: deductionType?.id,
      name: deductionType?.name || '',
      code: deductionType?.code || '',
      category: deductionType?.category || 'statutory',
      computation_method: deductionType?.computation_method || 'fixed',
      default_value: deductionType?.default_value ?? 0,
      is_pre_tax: deductionType?.is_pre_tax || false,
      description: deductionType?.description || '',
    },
  });

  const saveMutation = useMemo(() => {
    return deductionType?.id ? updateDeductionType : addDeductionType;
  }, [deductionType?.id, updateDeductionType, addDeductionType]);

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
          {!deductionType?.id ? 'Add Deduction Type' : 'Edit Deduction Type'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
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

            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Code'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.code ||
                    !!getValidationMessage(validationErrors, 'code')
                  }
                  helperText={
                    errors.code?.message ||
                    getValidationMessage(validationErrors, 'code')
                  }
                  {...register('code')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='category'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label='Category'
                      size='small'
                      fullWidth
                      value={field.value}
                      onChange={field.onChange}
                      error={
                        !!errors?.category ||
                        !!getValidationMessage(validationErrors, 'category')
                      }
                      helperText={
                        errors.category?.message ||
                        getValidationMessage(validationErrors, 'category')
                      }
                    >
                      <MenuItem value='statutory'>Statutory</MenuItem>
                      <MenuItem value='voluntary'>Voluntary</MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='computation_method'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label='Computation Method'
                      size='small'
                      fullWidth
                      value={field.value}
                      onChange={field.onChange}
                      error={
                        !!errors?.computation_method ||
                        !!getValidationMessage(
                          validationErrors,
                          'computation_method'
                        )
                      }
                      helperText={
                        errors.computation_method?.message ||
                        getValidationMessage(
                          validationErrors,
                          'computation_method'
                        )
                      }
                    >
                      <MenuItem value='fixed'>Fixed</MenuItem>
                      <MenuItem value='percentage_of_basic'>
                        Percentage Of Basic
                      </MenuItem>
                      <MenuItem value='percentage_of_gross'>
                        Percentage Of Gross
                      </MenuItem>
                    </TextField>
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='default_value'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label='Default Value'
                      size='small'
                      fullWidth
                      value={formatCommaSeparatedValue(field.value)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/,/g, '');
                        field.onChange(raw === '' ? '' : Number(raw));
                      }}
                      error={
                        !!errors?.default_value ||
                        !!getValidationMessage(validationErrors, 'default_value')
                      }
                      helperText={
                        errors.default_value?.message ||
                        getValidationMessage(validationErrors, 'default_value')
                      }
                    />
                  )}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='is_pre_tax'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(field.value)}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label='Is Pre-tax'
                    />
                  )}
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

export default DeductionTypeForm;
