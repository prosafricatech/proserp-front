import { LoadingButton } from '@mui/lab'
import * as yup from "yup";
import React from 'react'
import { Grid, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup'
import prosAfricansServices from '../prosAfricansServices';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FormData {
  name: string;
  description: string;
}

function NewProsAfricanRoleForm() {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    const validationSchema = yup.object({
        name: yup
            .string()
            .required('Role name required'),
        description: yup
            .string()
            .optional()
    });

    // Initialize react-hook-form
    const { handleSubmit, register, setError, formState: { errors } } = useForm<FormData>({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
            name: '',
            description: '',
        }
    });

    const addRole = useMutation({
        mutationFn: prosAfricansServices.addRole,
        onSuccess: (data) => {
            enqueueSnackbar(data.message, {
                variant: 'success',
            });
            queryClient.invalidateQueries({ queryKey: ['prosAfricansRoles'] });
        },
        onError: (error: any) => {
            if (error?.response?.data && error?.response?.status === 400 && error?.response?.data?.validation_errors) {
                const validationErrors = error.response.data.validation_errors;
                
                // Pass errors to the Fields
                Object.keys(validationErrors).forEach((fieldName) => {
                    const errorMessages = validationErrors[fieldName];
                    // Assuming you have the corresponding field in the form with the same `fieldName`
                    setError(fieldName as keyof FormData, {
                        type: 'manual',
                        message: errorMessages.join('<br/>') // Join multiple error messages if needed
                    });
                });
            } else {
                if (error?.response?.data?.message) {
                    enqueueSnackbar(
                        error.response.data.message,
                        { variant: 'error' }
                    );
                }
            }
        }
    });

    return (
        <form onSubmit={handleSubmit((data) => addRole.mutate(data))} autoComplete='off'>
            <Grid container columnSpacing={1} rowSpacing={1}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        fullWidth
                        label="Name"
                        size="small"
                        error={!!errors?.name}
                        helperText={errors?.name?.message}
                        {...register('name')}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 7 }}>
                    <TextField
                        fullWidth
                        label="Description"
                        size="small"
                        error={!!errors?.description}
                        helperText={errors?.description?.message}
                        {...register('description')}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 2, lg: 1 }}>
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        size="small"
                        fullWidth
                        sx={{ mb: 2, display: 'flex' }}
                        loading={addRole.isPending}
                    >
                        Add
                    </LoadingButton>
                </Grid>
            </Grid>
        </form>
    );
}

export default NewProsAfricanRoleForm;