'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Button, Grid, TextField } from '@mui/material';
import { Stack } from '@mui/system';
import { useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useOrganizationProfile } from '../OrganizationProfileProvider';

interface FormValues {
  name: string;
  description?: string;
  organization_id: string;
  role_id?: number | null;
}

interface ValidationErrors {
  [key: string]: string[];
}

interface Permission {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

interface RoleFormProp {
  isEditMode: boolean;
  isLoading: boolean;
  role: Role | null;
  handleCancelEdit?: () => void;
  handleFormSubmit: (data: FormValues) => void;
}

export const NewRoleForm = ({
  isEditMode,
  isLoading,
  role = null,
  handleCancelEdit,
  handleFormSubmit,
}: RoleFormProp) => {
  const { organization } = useOrganizationProfile();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();
  const newRoleDict = dictionary.organizations.profile.rolesTab.newRoleForm;

  const validationSchema = yup.object({
    name: yup.string().required(newRoleDict.validation.nameRequired),
    description: yup.string().optional(),
    organization_id: yup.string().required(),
  });

  const {
    handleSubmit,
    register,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      organization_id: organization?.id,
    },
  });

  useEffect(() => {
    if (isEditMode && role) {
      reset({
        organization_id: organization?.id,
        name: role.name,
        description: role.description,
        role_id: role.id,
      });
    } else {
      reset({
        organization_id: organization?.id,
        name: '',
        description: '',
        role_id: null,
      });
    }
  }, [isEditMode, role, organization, reset]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} autoComplete='off'>
      <Grid container columnSpacing={1} rowSpacing={1}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label={newRoleDict.labels.name}
            size='small'
            error={!!errors?.name}
            helperText={errors?.name?.message}
            {...register('name')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 7 }}>
          <TextField
            fullWidth
            label={newRoleDict.labels.description}
            size='small'
            error={!!errors?.description}
            helperText={errors?.description?.message}
            {...register('description')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2, lg: 1 }}>
          <Stack direction={{ xs: 'row', md: 'column' }} spacing={1}>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              fullWidth
              sx={{ display: 'flex' }}
              loading={isLoading}
            >
              {!isEditMode ? newRoleDict.buttons.add : 'Update'}
            </LoadingButton>
            {isEditMode && (
              <Button
                variant='contained'
                color='error'
                size='small'
                fullWidth
                sx={{ mb: 2 }}
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
};
