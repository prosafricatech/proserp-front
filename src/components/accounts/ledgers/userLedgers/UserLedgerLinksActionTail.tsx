'use client';

import React from 'react';
import { LinkOutlined } from '@mui/icons-material';
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Tooltip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import LedgerSelect from '../forms/LedgerSelect';
import LedgerSelectProvider from '../forms/LedgerSelectProvider';
import userLedgerServices from '../user-ledger-services';

type User = {
  id: number;
  name?: string;
};

type Ledger = {
  id: number;
  name?: string;
};

export default function UserLedgerLinksActionTail() {
  const { checkOrganizationPermission } = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [selectedLedger, setSelectedLedger] = React.useState<Ledger | null>(null);

  const refreshQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-ledgers'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user-ledgers-list'] });
    queryClient.invalidateQueries({ queryKey: ['user-ledger-payments-list'] });
  }, [queryClient]);

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser?.id || !selectedLedger?.id) {
        throw new Error('Please select user and ledger');
      }

      return userLedgerServices.linkUser({
        user_id: selectedUser.id,
        ledger_id: selectedLedger.id,
        type: 'imprest',
      });
    },
    onSuccess: (data: { message?: string }) => {
      refreshQueries();
      enqueueSnackbar(data?.message || 'Ledger linked successfully', { variant: 'success' });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'Failed to link user', {
        variant: 'error',
      });
    },
  });

  if (!checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_EDIT)) {
    return null;
  }

  const disabled = !selectedUser?.id || !selectedLedger?.id;

  return (
    <>
      <Tooltip title='Link User to Ledger'>
        <IconButton size='small' onClick={() => setOpenDialog(true)}>
          <LinkOutlined />
        </IconButton>
      </Tooltip>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth='xs'>
        <DialogTitle textAlign='center'>Link User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <UsersSelector
                label='Select User'
                defaultValue={null}
                onChange={(value: User | User[] | null) => {
                  const selected = Array.isArray(value) ? value[0] : value;
                  setSelectedUser(selected || null);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <LedgerSelectProvider>
                <LedgerSelect
                  label='Select Ledger'
                  defaultValue={null}
                  onChange={(value: Ledger | Ledger[] | null) => {
                    const selected = Array.isArray(value) ? value[0] : value;
                    setSelectedLedger(selected || null);
                  }}
                />
              </LedgerSelectProvider>
            </Grid>
            {selectedUser?.name && selectedLedger?.name && (
              <Grid size={{ xs: 12 }}>
                <Alert severity='warning'>
                  You are about to link <strong>{selectedUser?.name || 'selected user'}</strong> to{' '}
                  <strong>{selectedLedger?.name || 'selected ledger'}</strong>.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <LoadingButton
            size='small'
            variant='text'
            onClick={() => setOpenDialog(false)}
            disabled={linkMutation.isPending}
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            size='small'
            variant='contained'
            startIcon={<LinkOutlined />}
            onClick={() => linkMutation.mutate()}
            loading={linkMutation.isPending}
            disabled={disabled}
          >
            Link
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
