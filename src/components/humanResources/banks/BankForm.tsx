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
import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { BankType } from './BankType';

interface BankFormProps {
  setOpenDialog: (open: boolean) => void;
  bank?: BankType | null;
}

interface FormData extends Omit<BankType, 'id' | 'created_by' | 'created_at' | 'updated_at'> {
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

const BankForm = ({ setOpenDialog, bank = null }: BankFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addBank,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addBank,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Bank Added Successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
    onError: (mutationError: any) => {
      enqueueSnackbar('Error Adding Bank', { variant: 'error' });
      console.log('error adding bank: ', mutationError);
    },
  });

  const {
    mutate: updateBank,
    isPending: updateIsPending,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateBank,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar('Bank Updated Successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
    onError: (mutationError: any) => {
      enqueueSnackbar('Error Updating Bank', { variant: 'error' });
      console.log('error updating bank: ', mutationError);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup.string().required('Name is required').max(150, 'Name cannot exceed 150 characters'),
    short_name: yup.string().nullable().max(20, 'Short name cannot exceed 20 characters'),
    swift_code: yup.string().nullable().max(20, 'Swift code cannot exceed 20 characters'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: bank?.id,
      name: bank?.name || '',
      short_name: bank?.short_name || '',
      swift_code: bank?.swift_code || '',
    },
  });

  const saveMutation = React.useMemo(() => {
    return bank?.id ? updateBank : addBank;
  }, [addBank, bank?.id, updateBank]);

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
          {!bank?.id ? 'Add Bank' : `Edit Bank ${bank.name}`}
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
                  error={!!errors?.name || !!getValidationMessage(validationErrors, 'name')}
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
                  label='Short Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.short_name ||
                    !!getValidationMessage(validationErrors, 'short_name')
                  }
                  helperText={
                    errors.short_name?.message ||
                    getValidationMessage(validationErrors, 'short_name')
                  }
                  {...register('short_name')}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
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

export default BankForm;
