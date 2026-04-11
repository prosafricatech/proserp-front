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
import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { AllowanceType } from './AllowanceType';

interface AllowanceTypeFormProps {
  setOpenDialog: (open: boolean) => void;
  allowanceType?: AllowanceType | null;
}

interface FormData extends Omit<AllowanceType, 'id' | 'created_by'> {
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

const AllowanceTypeForm = ({
  setOpenDialog,
  allowanceType = null,
}: AllowanceTypeFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addAllowanceType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addAllowanceType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Allowance Type Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Allowance Type', {
        variant: 'error',
      });
      console.log('error adding allowance type: ', mutationError);
    },
  });

  const {
    mutate: updateAllowanceType,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateAllowanceType,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Allowance Type Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['allowanceTypes'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Allowance Type', {
        variant: 'error',
      });
      console.log('error updating allowance type: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup
      .string()
      .required('Name is required')
      .max(255, 'Name cannot exceed 255 characters'),
    code: yup.string().max(50, 'Code cannot exceed 50 characters'),
    is_taxable: yup.boolean().required(),
    description: yup.string().max(500, 'Description cannot exceed 500 characters'),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: allowanceType?.id,
      name: allowanceType?.name || '',
      code: allowanceType?.code || '',
      is_taxable: allowanceType?.is_taxable || false,
      description: allowanceType?.description || '',
    },
  });

  useEffect(() => {
    reset({
      id: allowanceType?.id,
      name: allowanceType?.name || '',
      code: allowanceType?.code || '',
      is_taxable: allowanceType?.is_taxable || false,
      description: allowanceType?.description || '',
    });
  }, [allowanceType, reset]);

  const saveMutation = useMemo(() => {
    return allowanceType?.id ? updateAllowanceType : addAllowanceType;
  }, [allowanceType?.id, updateAllowanceType, addAllowanceType]);

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
          {!allowanceType?.id ? 'Add Allowance Type' : 'Edit Allowance Type'}
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
                  name='is_taxable'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.value)}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                      label='Is Taxable'
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

export default AllowanceTypeForm;
