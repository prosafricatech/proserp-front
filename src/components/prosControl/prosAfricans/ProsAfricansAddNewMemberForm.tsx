import { yupResolver } from '@hookform/resolvers/yup'
import { Grid, LinearProgress, TextField } from '@mui/material'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab'
import prosAfricansServices from './prosAfricansServices'
import { ProsAfricansAddNewMemberQueue } from './addQueue/ProsAfricansAddNewMemberQueue'
import { useQuery } from '@tanstack/react-query'

interface Role {
  id: string;
  name: string;
  [key: string]: any;
}

interface User {
  id?: string;
  name: string;
  email: string;
  roles?: Role[];
  selectedRoles?: Role[] | number[];
}

interface FormData {
  email: string;
}

function ProsAfricansAddNewMemberForm() {
    const [addNewProsAfrican, setAddNewProsAfrican] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Hooks definitions
    const { enqueueSnackbar } = useSnackbar();

    // ValidationSchema
    const validationSchema = yup.object({
        email: yup.string()
          .required('Email is required')
          .matches(
            /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
            { message: 'Invalid email format' },
          ),
    });

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            email: '',
        }
    });

    const { data: ProsAfricansroles = [], isLoading: isLoadingRoles, isFetching: isFetchingRoles } = useQuery<Role[]>({
        queryKey: ['prosAfricansRoles'],
        queryFn: prosAfricansServices.roles
    });

    if (isLoadingRoles || isFetchingRoles) {
        return <LinearProgress/>;
    }
      
    const checkMember = async (data: FormData) => {
        const { email } = data;
        
        try {
            setLoading(true);
            const response = await prosAfricansServices.checkMember(email);
      
            // Check if the response contains the message indicating that the user is already a ProsAfrican
            if (response.message === "This user is already a ProsAfrican") {
                enqueueSnackbar(response.message, { variant: 'error' });
                reset();
            } else {
                // if not a member continue
                const user: User = {
                    ...response,
                    roles: ProsAfricansroles,
                    selectedRoles: [],
                };
      
                if (addNewProsAfrican.some(obj => obj.email === user.email)) {
                    enqueueSnackbar('User is already in the queued list', { variant: 'error' });
                } else {
                    setAddNewProsAfrican(prev => [...prev, user]);
                    reset();
                }
            }
        } catch (error: any) {
            // Handle errors
            if (error?.response) {
                if (error.response.status === 404) {
                    const user: User = {
                        name: 'Not Registered',
                        email: email,
                    };
      
                    let message;
                    if (addNewProsAfrican.some(obj => obj.email === user.email)) {
                        message = 'User is already in the queued list';
                        reset();
                    } else {
                        message = 'No user with that email was found.';
                        reset();
                    }
      
                    enqueueSnackbar(message, { variant: 'info' });
                } else {
                    enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
                    reset();
                }
            } else {
                enqueueSnackbar('Something went wrong', { variant: 'error' });
                reset();
            }
        } finally {
            setLoading(false);
        }
    };
      

    return (
        <form onSubmit={handleSubmit(checkMember)}>
            <Grid container columnSpacing={1} paddingRight={1}>
                <Grid size={{ xs: 10 }}>
                    <TextField
                        label='Email'
                        fullWidth
                        size='small'
                        error={!!errors?.email}
                        helperText={errors?.email?.message}
                        {...register('email')}
                    />
                </Grid>
                <Grid size={{ xs: 2 }}>
                    <LoadingButton 
                        size='small'
                        variant='contained'
                        type='submit'
                        sx={{ mb: 4, display: 'flex' }}
                        loading={loading}
                    >
                        Add
                    </LoadingButton>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <ProsAfricansAddNewMemberQueue 
                        addNewProsAfrican={addNewProsAfrican as any}
                        setAddNewProsAfrican={setAddNewProsAfrican as any}
                    />
                </Grid>
            </Grid>
        </form>
    );
}

export default ProsAfricansAddNewMemberForm;