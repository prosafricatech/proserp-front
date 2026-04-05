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
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useEmployees } from '../../EmployeesProvider';
import { Employee } from '../../EmployeesType';
import humanResourcesServices from '../../../humanResourcesServices';
import { NextOfKinType } from './NextOfKinType';

interface NextOfKinFormProps {
  setOpenDialog: (open: boolean) => void;
  nextOfKin?: NextOfKinType | null;
  employeeId?: number;
}

interface FormData extends Omit<NextOfKinType, 'id' | 'created_by'> {
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

const NextOfKinForm = ({
  setOpenDialog,
  nextOfKin = null,
  employeeId,
}: NextOfKinFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addEmployeeNextOfKin,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addEmployeeNextOfKin,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Next Of Kin Added Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeNextOfKins'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Adding Next Of Kin', {
        variant: 'error',
      });
    },
  });

  const {
    mutate: updateEmployeeNextOfKin,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateEmployeeNextOfKin,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Next Of Kin Updated Successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['employeeNextOfKins'] });
    },
    onError: (mutationError) => {
      enqueueSnackbar('Error Updating Next Of Kin', {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    employee_id: yup.number().required('Employee is required'),
    name: yup
      .string()
      .required('Name is required')
      .max(200, 'Name cannot exceed 200 characters'),
    relationship: yup
      .string()
      .required('Relationship is required')
      .max(50, 'Relationship cannot exceed 50 characters'),
    phone: yup.string().max(20, 'Phone cannot exceed 20 characters'),
    email: yup
      .string()
      .email('Email is invalid')
      .max(150, 'Email cannot exceed 150 characters'),
    address: yup.string().max(500, 'Address cannot exceed 500 characters'),
    is_primary: yup.boolean().required(),
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: nextOfKin?.id,
      employee_id: nextOfKin?.employee_id,
      name: nextOfKin?.name || '',
      relationship: nextOfKin?.relationship || '',
      phone: nextOfKin?.phone || '',
      email: nextOfKin?.email || '',
      address: nextOfKin?.address || '',
      is_primary: nextOfKin?.is_primary || false,
    },
  });

  // Pre-fill employee_id when rendered inside the Employee Profile
  useEffect(() => {
    if (employeeId) {
      setValue('employee_id', employeeId);
    }
  }, [employeeId, setValue]);

  const saveMutation = useMemo(() => {
    return nextOfKin?.id ? updateEmployeeNextOfKin : addEmployeeNextOfKin;
  }, [nextOfKin?.id, updateEmployeeNextOfKin, addEmployeeNextOfKin]);

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
          {!nextOfKin?.id ? 'Add Employee Next Of Kin' : 'Edit Employee Next Of Kin'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={1}>
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
                  label='Relationship'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.relationship ||
                    !!getValidationMessage(validationErrors, 'relationship')
                  }
                  helperText={
                    errors.relationship?.message ||
                    getValidationMessage(validationErrors, 'relationship')
                  }
                  {...register('relationship')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Phone'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.phone ||
                    !!getValidationMessage(validationErrors, 'phone')
                  }
                  helperText={
                    errors.phone?.message ||
                    getValidationMessage(validationErrors, 'phone')
                  }
                  {...register('phone')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Email'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.email ||
                    !!getValidationMessage(validationErrors, 'email')
                  }
                  helperText={
                    errors.email?.message ||
                    getValidationMessage(validationErrors, 'email')
                  }
                  {...register('email')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Address'
                  size='small'
                  fullWidth
                  multiline
                  minRows={2}
                  error={
                    !!errors?.address ||
                    !!getValidationMessage(validationErrors, 'address')
                  }
                  helperText={
                    errors.address?.message ||
                    getValidationMessage(validationErrors, 'address')
                  }
                  {...register('address')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
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
                      label='Set as Primary Contact'
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

export default NextOfKinForm;
