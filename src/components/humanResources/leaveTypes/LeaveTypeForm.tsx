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
import { LeaveType } from './LeaveTypesType';

interface LeaveTypeFormProp {
  setOpenDialog: (open: boolean) => void;
  leaveType?: LeaveType | null;
}

interface FormData extends Omit<LeaveType, 'id'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    days_per_year?: number;
  };
}

const LeaveTypeForm = ({ setOpenDialog, leaveType }: LeaveTypeFormProp) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addLeaveType,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addLeaveType,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Leave Type', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Adding Leave Type', {
        variant: 'error',
      });
      console.log('error adding leave type: ', error);
    },
  });

  const {
    mutate: updateLeaveType,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateLeaveType,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Leave Type update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Updating Leave Type', {
        variant: 'error',
      });
      console.log('error updating leave type: ', error);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup.string().required('name is required'),
    days_per_year: yup
      .number()
      .required('days per year is required')
      .min(1, 'Days per year must be greater than 0'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: leaveType?.id,
      name: leaveType?.name || '',
      days_per_year: leaveType?.days_per_year || 1,
    },
  });

  const saveMutation = React.useMemo(() => {
    return leaveType?.id ? updateLeaveType : addLeaveType;
  }, [leaveType, updateLeaveType, addLeaveType]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!leaveType?.id
            ? 'Add Leave Type'
            : `Edit Leave Type ${leaveType.name}`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Name'
                  placeholder='Leave Type Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!error?.response?.data?.validation_errors?.name ||
                    !!updateError?.response?.data?.validation_errors?.name
                  }
                  helperText={
                    errors.name?.message ||
                    error?.response?.data?.validation_errors?.name ||
                    updateError?.response?.data?.validation_errors?.name
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Days Per Year'
                  placeholder='Days Per Year'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.days_per_year ||
                    !!error?.response?.data?.validation_errors?.days_per_year ||
                    !!updateError?.response?.data?.validation_errors
                      ?.days_per_year
                  }
                  helperText={
                    errors.days_per_year?.message ||
                    error?.response?.data?.validation_errors?.days_per_year ||
                    updateError?.response?.data?.validation_errors
                      ?.days_per_year
                  }
                  {...register('days_per_year')}
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

export default LeaveTypeForm;
