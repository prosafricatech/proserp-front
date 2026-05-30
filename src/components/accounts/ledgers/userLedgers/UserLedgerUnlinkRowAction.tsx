'use client';

import React from 'react';
import { LinkOffOutlined } from '@mui/icons-material';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import userLedgerServices from '../user-ledger-services';

interface Props {
  userLedgerId: number;
  userName?: string;
  ledgerName?: string;
}

export default function UserLedgerUnlinkRowAction({ userLedgerId, userName, ledgerName }: Props) {
  const { checkOrganizationPermission } = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openConfirm, setOpenConfirm] = React.useState(false);

  const unlinkMutation = useMutation({
    mutationFn: () => userLedgerServices.unlinkUser(userLedgerId),
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['my-ledgers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-ledgers-list'] });
      queryClient.invalidateQueries({ queryKey: ['user-ledger-payments-list'] });
      enqueueSnackbar(data?.message || 'Ledger unlinked successfully', { variant: 'success' });
      setOpenConfirm(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || error?.message || 'Failed to unlink user', {
        variant: 'error',
      });
    },
  });

  if (!checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_EDIT)) {
    return null;
  }

  return (
    <>
      <Tooltip title='Unlink user from ledger'>
        <IconButton size='small' color='error' onClick={() => setOpenConfirm(true)}>
          <LinkOffOutlined fontSize='small' />
        </IconButton>
      </Tooltip>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} fullWidth maxWidth='xs'>
        <DialogTitle textAlign='center'>Confirm Unlink</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unlink {userName || 'this user'} from {ledgerName || 'this ledger'}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <LoadingButton
            size='small'
            variant='text'
            onClick={() => setOpenConfirm(false)}
            disabled={unlinkMutation.isPending}
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            size='small'
            color='error'
            variant='contained'
            loading={unlinkMutation.isPending}
            onClick={() => unlinkMutation.mutate()}
          >
            Unlink
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
