'use client';

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Button, DialogActions, DialogContent, DialogTitle, Grid, Alert } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import userLedgerServices from '../user-ledger-services';

type Mode = 'link' | 'unlink';

type User = {
  id: number;
  name: string;
  [key: string]: any;
};

type Ledger = {
  id: number;
  name: string;
};

type UserLedger = {
  id: number;
  user_id?: number;
  ledger_id?: number;
  type?: string;
  ledger?: { id?: number; name?: string } | null;
};

type FormValues = {
  user_id: number | null;
};

type Props = {
  mode: Mode;
  ledger: Ledger;
  toggleOpen: (open: boolean) => void;
};

const validationSchema = yup.object({
  user_id: yup.number().nullable().required('User is required').typeError('User is required'),
});

export default function UserLedgerActionForm({ mode, ledger, toggleOpen }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [selectedUserName, setSelectedUserName] = React.useState('');

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      user_id: null,
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: { user_id: number }) => {
      if (mode === 'link') {
        return userLedgerServices.linkUser({
          user_id: payload.user_id,
          ledger_id: ledger.id,
          type: 'imprest',
        });
      }

      const userLedgers = (await userLedgerServices.getUserLedgers(payload.user_id)) || [];

      const link = (userLedgers as UserLedger[]).find((entry) => {
        const entryLedgerId = entry.ledger_id ?? entry.ledger?.id;
        return Number(entryLedgerId) === Number(ledger.id) && String(entry.type || '').toLowerCase() === 'imprest';
      });

      if (!link?.id) {
        throw new Error('Selected user is not linked to this imprest ledger');
      }

      return userLedgerServices.unlinkUser(link.id);
    },
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['my-ledgers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-ledgers-list'] });
      queryClient.invalidateQueries({ queryKey: ['user-ledger-payments-list'] });
      enqueueSnackbar(
        data?.message || (mode === 'link' ? 'Ledger linked successfully' : 'Ledger unlinked successfully'),
        { variant: 'success' }
      );
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          (mode === 'link' ? 'Failed to link user to ledger' : 'Failed to unlink user from ledger'),
        { variant: 'error' }
      );
    },
  });

  const selectedUser = watch('user_id');

  const onSubmit = (payload: FormValues) => {
    if (!payload.user_id) return;
    actionMutation.mutate({ user_id: payload.user_id });
  };

  const title = mode === 'link' ? 'Link User to Imprest Ledger' : 'Unlink User from Imprest Ledger';
  const buttonLabel = mode === 'link' ? 'Link User' : 'Unlink User';
  const confirmationAction = mode === 'link' ? 'link' : 'unlink';

  return (
    <>
      <DialogTitle textAlign='center'>{title}</DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <UsersSelector
                label='Select User'
                defaultValue={null}
                frontError={errors.user_id as any}
                onChange={(value: User | User[] | null) => {
                  const selected = Array.isArray(value) ? value[0] : value;
                  setSelectedUserName(selected?.name || '');
                  setValue('user_id', selected?.id ?? null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              {selectedUserName && (
                <Alert severity='warning' sx={{ mt: 1 }}>
                  Are you sure you want to {confirmationAction} <strong>{selectedUserName}</strong> {mode === 'link' ? 'to' : 'from'}{' '}
                  <strong>{ledger.name}</strong>?
                </Alert>
              )}
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => toggleOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              size='small'
              variant='contained'
              color={mode === 'link' ? 'primary' : 'error'}
              loading={actionMutation.isPending}
              disabled={!selectedUser}
            >
              {buttonLabel}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
}
