import { LoadingButton } from '@mui/lab';
import { Autocomplete, Button, Grid, TextField, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import stakeholderServices from './stakeholder-services';
import { Stakeholder, StakeholderType } from './StakeholderType';
import { Div } from '@jumbo/shared';

interface StakeholderQuickAddProps {
  setStakeholderQuickAddDisplay: (display: boolean) => void;
  create_receivable?: boolean;
  create_payable?: boolean;
  displayTitle?: string;
  setAddedStakeholder: (stakeholder: Stakeholder) => void;
}

interface FormData {
  name: string;
  type: StakeholderType | null;
  phone?: string;
  tin?: string;
  vrn?: string;
  address?: string;
  email?: string;
  ledger_code?: string;
  create_receivable: boolean;
  create_payable: boolean;
}

interface StakeholderTypeOption {
  label: StakeholderType;
}

const stakeholderTypeOptions: StakeholderTypeOption[] = [
  { label: 'Individual' },
  { label: 'Group' },
  { label: 'Sole Proprietor' },
  { label: 'Partnership' },
  { label: 'Private Limited' },
  { label: 'Public Liability' },
  { label: 'Government Institution' },
  { label: 'Non-Government Organization' }
];

const StakeholderQuickAdd: React.FC<StakeholderQuickAddProps> = ({
  setStakeholderQuickAddDisplay,
  create_receivable = false,
  create_payable = false,
  displayTitle=null,
  setAddedStakeholder
}) => {
  const validationSchema = yup.object({
    name: yup.string().required('Name is required'),
    type: yup.string().required('Stakeholder type is required').typeError('Stakeholder type is required'),
    phone: yup.string().optional(),
    tin: yup.string().optional(),
    vrn: yup.string().optional(),
    address: yup.string().optional(),
    email: yup.string().email('Please enter a valid email').optional(),
    ledger_code: yup.string().optional()
  });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      create_receivable,
      create_payable
    }
  });

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const addStakeholder = useMutation<
    { message: string; stakeholder: Stakeholder },
    any,
    FormData
  >({
    mutationFn: (data) => stakeholderServices.add(data),
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      setAddedStakeholder(data.stakeholder);
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      setStakeholderQuickAddDisplay(false);
    },
    onError: (error) => {
      error?.response?.data?.message && 
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
      
      const validationErrors = error?.response?.data?.validation_errors;
      if (validationErrors) {
        Object.keys(validationErrors).forEach((fieldName) => {
          const errorMessages = validationErrors[fieldName];
          setError(fieldName as keyof FormData, {
            type: 'manual',
            message: errorMessages.join('<br/>')
          });
        });
      }
    }
  });

  return (
    <Grid container rowSpacing={1} columnSpacing={1} paddingTop={1}>
      <Grid size={12} textAlign={'center'}>
        <Typography variant='h4'>{displayTitle ? displayTitle : `Quick Add Client`}</Typography>
      </Grid>
      <Grid size={{xs: 12, md: 6, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size='small'
            label='Name*'
            fullWidth
            error={!!errors?.name}
            helperText={errors?.name?.message}
            {...register('name')}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 6, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <Autocomplete<StakeholderTypeOption>
            size="small"
            isOptionEqualToValue={(option, value) => option.label === value.label}
            options={stakeholderTypeOptions}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Type*"
                error={!!errors?.type}
                helperText={errors?.type?.message}
              />
            )}
            onChange={(event, newValue) => {
              setValue('type', newValue ? newValue.label : null, {
                shouldDirty: true,
                shouldValidate: true
              });
            }}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size='small'
            label='Ledger Code'
            fullWidth
            {...register('ledger_code')}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size='small'
            label='Phone'
            fullWidth
            error={!!errors?.phone}
            helperText={errors?.phone?.message}
            {...register('phone')}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size='small'
            label='TIN'
            fullWidth
            error={!!errors?.tin}
            helperText={errors?.tin?.message}
            {...register('tin')}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size='small'
            label='VRN'
            fullWidth
            error={!!errors?.vrn}
            helperText={errors?.vrn?.message}
            {...register('vrn')}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size='small'
            label='Address'
            fullWidth
            {...register('address')}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size='small'
            label='Email'
            fullWidth
            error={!!errors?.email}
            helperText={errors?.email?.message}
            {...register('email')}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 12, lg: 4}} sx={{ textAlign: 'end' }}>
        <Div sx={{ mt: 0.3 }}>
          <Button size='small' onClick={() => setStakeholderQuickAddDisplay(false)}>
            Cancel
          </Button>
          <LoadingButton
            variant='contained'
            onClick={handleSubmit((data) => addStakeholder.mutate(data))}
            loading={addStakeholder.isPending}
            size='small'
            type='submit'
          >
            ADD
          </LoadingButton>
        </Div>
      </Grid>
    </Grid>
  );
};

export default StakeholderQuickAdd;