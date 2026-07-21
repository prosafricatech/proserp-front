'use client';

import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { LoanRequestType } from './LoanRequestType';

interface LoanDisburseFormProps {
  open: boolean;
  belowLargeScreen: boolean;
  loanRequest: LoanRequestType;
  onClose: () => void;
}

const LoanDisburseForm = ({
  open,
  belowLargeScreen,
  loanRequest,
  onClose,
}: LoanDisburseFormProps) => {
  const [creditLedgerId, setCreditLedgerId] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setCreditLedgerId(0);
  }, [open]);

  const { mutate: disburse, isPending } = useMutation({
    mutationFn: humanResourcesServices.disburseLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar('Loan disbursed', { variant: 'success' });
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleSubmit = () => {
    if (!creditLedgerId) return;
    disburse({ id: loanRequest.id, credit_ledger_id: creditLedgerId });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xs'
      fullScreen={belowLargeScreen}
      scroll={belowLargeScreen ? 'body' : 'paper'}
    >
      <DialogTitle>Disburse Loan</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity='info' variant='outlined'>
            Select the bank or cash account this loan will be paid out from.
          </Alert>
          <LedgerSelectProvider>
            <LedgerSelect
              label='Bank or Cash Account'
              allowedGroups={[
                'Current Assets',
                'Current Liabilities',
                'Cash and Cash Equivalents',
                'Banks',
                'Accounts Payable',
                'Accounts Receivable',
              ]}
              onChange={(ledger: any) => setCreditLedgerId(ledger?.id || 0)}
            />
          </LedgerSelectProvider>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <LoadingButton
          loading={isPending}
          variant='contained'
          color='success'
          size='small'
          disabled={!creditLedgerId}
          onClick={handleSubmit}
        >
          Disburse
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default LoanDisburseForm;
