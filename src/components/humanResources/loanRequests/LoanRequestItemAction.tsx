'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  CancelOutlined,
  CheckCircleOutlined,
  DeleteForeverOutlined,
  HighlightOffOutlined,
  PaidOutlined,
  PaymentsOutlined,
} from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import LoanDirectDecisionForm, {
  LoanDirectDecisionMode,
} from './LoanDirectDecisionForm';
import LoanDisburseForm from './LoanDisburseForm';
import LoanMarkDisbursedForm from './LoanMarkDisbursedForm';
import { LoanRequestType } from './LoanRequestType';

const LoanRequestItemAction = ({
  loanRequest,
}: {
  loanRequest: LoanRequestType;
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { organizationHasSubscribed, checkOrganizationPermission } =
    useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const hasLoanEditPermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_EDIT
  );

  const hasLoanDeletePermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_DELETE
  );

  const [decisionMode, setDecisionMode] =
    useState<LoanDirectDecisionMode | null>(null);
  const [openDisburseDialog, setOpenDisburseDialog] = useState(false);
  const [openMarkDisbursedDialog, setOpenMarkDisbursedDialog] = useState(false);

  const isDirectFlow = !loanRequest.approval_chain_id;
  const canDirectDecide =
    isDirectFlow && loanRequest.status === 'in_review' && hasLoanEditPermission;

  const canCancel =
    ['in_review', 'approved'].includes(loanRequest.status) &&
    !loanRequest.disbursed_at &&
    hasLoanEditPermission;

  const canDelete = hasLoanDeletePermission;

  const isApprovedNotDisbursed =
    loanRequest.status === 'approved' && !loanRequest.disbursed_at;

  const orgHasAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );

  const canDisburseWithLedger =
    isApprovedNotDisbursed &&
    orgHasAccountsAndFinance &&
    checkOrganizationPermission(PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE);

  const canMarkDisbursed = isApprovedNotDisbursed && !orgHasAccountsAndFinance;

  const { mutate: cancelLoanRequest, isPending: isCancelling } = useMutation({
    mutationFn: humanResourcesServices.cancelLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar('Loan request cancelled', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const { mutate: deleteLoanRequest, isPending: isDeleting } = useMutation({
    mutationFn: humanResourcesServices.deleteLoanRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showLoanRequest', loanRequest.id],
      });
      queryClient.invalidateQueries({ queryKey: ['loanRequests'] });
      enqueueSnackbar('Loan request deleted', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleCancel = () => {
    showDialog({
      title: 'Cancel Loan Request',
      content:
        loanRequest.status === 'approved'
          ? 'This stops all future recovery from payroll. Installments already deducted are not refunded. Continue?'
          : 'Are you sure you want to cancel this loan request?',
      onYes: () => {
        hideDialog();
        cancelLoanRequest({ id: loanRequest.id });
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleDelete = () => {
    showDialog({
      title: 'Delete Loan Request',
      content: 'This action cannot be undone',
      onYes: () => {
        hideDialog();
        deleteLoanRequest(loanRequest.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <>
      {decisionMode && (
        <LoanDirectDecisionForm
          open={!!decisionMode}
          mode={decisionMode}
          loanRequest={loanRequest}
          belowLargeScreen={belowLargeScreen}
          onClose={() => setDecisionMode(null)}
        />
      )}

      <LoanDisburseForm
        open={openDisburseDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenDisburseDialog(false)}
      />

      <LoanMarkDisbursedForm
        open={openMarkDisbursedDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenMarkDisbursedDialog(false)}
      />

      {canDirectDecide && (
        <>
          <Tooltip title='Approve'>
            <IconButton size='small' onClick={() => setDecisionMode('approve')}>
              <CheckCircleOutlined color='success' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Reject'>
            <IconButton size='small' onClick={() => setDecisionMode('reject')}>
              <HighlightOffOutlined color='error' />
            </IconButton>
          </Tooltip>
        </>
      )}

      {canDisburseWithLedger && (
        <Tooltip title='Disburse'>
          <IconButton size='small' onClick={() => setOpenDisburseDialog(true)}>
            <PaymentsOutlined color='success' />
          </IconButton>
        </Tooltip>
      )}

      {canMarkDisbursed && (
        <Tooltip title='Mark as Disbursed'>
          <IconButton
            size='small'
            onClick={() => setOpenMarkDisbursedDialog(true)}
          >
            <PaidOutlined color='success' />
          </IconButton>
        </Tooltip>
      )}

      {canCancel && (
        <Tooltip title='Cancel'>
          <IconButton
            size='small'
            disabled={isCancelling}
            onClick={handleCancel}
          >
            <CancelOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title='Delete'>
          <IconButton size='small' disabled={isDeleting} onClick={handleDelete}>
            <DeleteForeverOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LoanRequestItemAction;
