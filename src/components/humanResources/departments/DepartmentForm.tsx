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
import { Department } from './DepartmentsType';

interface DepartmentFormProp {
  setOpenDialog: (open: boolean) => void;
  department?: Department | null;
}

interface FormData extends Omit<Department, 'id'> {
  id?: number;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
  };
}

const DepartmentForm = ({
  setOpenDialog,
  department = null,
}: DepartmentFormProp) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    mutate: addDepartment,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addDepartment,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Department', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Adding Department', {
        variant: 'error',
      });
      console.log('error adding department: ', error);
    },
  });

  const {
    mutate: updateDepartment,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updateDepartment,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Department update success', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      enqueueSnackbar('Error Updating Department', {
        variant: 'error',
      });
      console.log('error updating department: ', error);
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup.string().required('name is required'),
    code: yup.string(),
    description: yup.string(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: department?.id,
      name: department?.name || '',
      code: department?.code || '',
      description: department?.description || '',
    },
  });

  const saveMutation = React.useMemo(() => {
    return department?.id ? updateDepartment : addDepartment;
  }, [department, updateDepartment, addDepartment]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!department?.id
            ? 'Add Department'
            : `Edit Department ${department.name}`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Name'
                  placeholder='Department Name'
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Code'
                  placeholder='Department Code'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.code ||
                    !!error?.response?.data?.validation_errors?.code ||
                    !!updateError?.response?.data?.validation_errors?.code
                  }
                  helperText={
                    errors.code?.message ||
                    error?.response?.data?.validation_errors?.code ||
                    updateError?.response?.data?.validation_errors?.code
                  }
                  {...register('code')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Description'
                  placeholder='Department Description'
                  size='small'
                  multiline
                  minRows={2}
                  fullWidth
                  error={
                    !!errors?.description ||
                    !!error?.response?.data?.validation_errors?.description ||
                    !!updateError?.response?.data?.validation_errors
                      ?.description
                  }
                  helperText={
                    errors.description?.message ||
                    error?.response?.data?.validation_errors?.description ||
                    updateError?.response?.data?.validation_errors?.description
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

export default DepartmentForm;
