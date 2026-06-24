// components/humanResources/payrollRuns/PayrollRunActions.tsx
'use client';

import { Stack, Tooltip, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';
import {
  RefreshOutlined,
  SendOutlined,
  DeleteOutlined,
  CheckCircleOutline,
  AccountBalanceWalletOutlined,
  PaidOutlined,
} from '@mui/icons-material';
import { useState } from 'react';

interface PayrollRunActionsProps {
  isDraft: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isPosted: boolean;
  hasChain: boolean;
  onRefresh: () => void;
  onAction: (action: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  isApproving: boolean;
  isPosting: boolean;
  isPaying: boolean;
  isRefetching: boolean;
  runLabel?: string;
}

export const PayrollRunActions = ({
  isDraft,
  isSubmitted,
  isApproved,
  isPosted,
  hasChain,
  onRefresh,
  onAction,
  isLoading,
  isSubmitting,
  isDeleting,
  isApproving,
  isPosting,
  isPaying,
  isRefetching,
  runLabel = 'this run',
}: PayrollRunActionsProps) => {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    action: string | null;
    title: string;
    message: string;
    confirmText: string;
    color: 'primary' | 'success' | 'error' | 'warning';
  }>({
    open: false,
    action: null,
    title: '',
    message: '',
    confirmText: '',
    color: 'primary',
  });

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'submit':
        setDialogState({
          open: true,
          action: 'submit',
          title: 'Submit Payroll Run',
          message: `Are you sure you want to submit "${runLabel}" for approval? This will save all payslips.`,
          confirmText: 'Submit',
          color: 'primary',
        });
        break;
      case 'delete':
        setDialogState({
          open: true,
          action: 'delete',
          title: 'Delete Payroll Run',
          message: `Are you sure you want to delete "${runLabel}"? This action cannot be undone.`,
          confirmText: 'Delete',
          color: 'error',
        });
        break;
      case 'approve':
        setDialogState({
          open: true,
          action: 'approve',
          title: hasChain ? 'Approve Level' : 'Approve Payroll Run',
          message: hasChain 
            ? `Are you sure you want to approve this level for "${runLabel}"?`
            : `Are you sure you want to approve "${runLabel}"? This action cannot be undone.`,
          confirmText: 'Approve',
          color: 'success',
        });
        break;
      case 'post':
        setDialogState({
          open: true,
          action: 'post',
          title: 'Post Transactions',
          message: `Are you sure you want to post transactions for "${runLabel}"? This will create journal entries in the general ledger.`,
          confirmText: 'Post',
          color: 'primary',
        });
        break;
      case 'pay':
        setDialogState({
          open: true,
          action: 'pay',
          title: 'Pay Employees',
          message: `Are you sure you want to pay employees for "${runLabel}"? This will create payment vouchers.`,
          confirmText: 'Pay',
          color: 'success',
        });
        break;
      default:
        break;
    }
  };

  const handleConfirm = () => {
    if (dialogState.action) {
      onAction(dialogState.action);
    }
    setDialogState({ ...dialogState, open: false });
  };

  const handleClose = () => {
    setDialogState({ ...dialogState, open: false });
  };

  return (
    <>
      <Stack direction="row" spacing={0.5} mb={2} justifyContent="flex-end" alignItems="center" flexWrap="wrap" useFlexGap>

        {isDraft && (
          <>
            <Tooltip title="Submit for Approval">
              <IconButton 
                size="small" 
                onClick={() => handleActionClick('submit')} 
                disabled={isSubmitting} 
                color="primary"
              >
                {isSubmitting ? <CircularProgress size={18} /> : <SendOutlined fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Run">
              <IconButton 
                size="small" 
                onClick={() => handleActionClick('delete')} 
                disabled={isDeleting} 
                color="error"
              >
                {isDeleting ? <CircularProgress size={18} /> : <DeleteOutlined fontSize="small" />}
              </IconButton>
            </Tooltip>
          </>
        )}

        {isSubmitted && (
          <Tooltip title={hasChain ? 'Approve Level' : 'Approve'}>
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('approve')} 
              disabled={isApproving} 
              color="success"
            >
              {isApproving ? <CircularProgress size={18} /> : <CheckCircleOutline fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {isApproved && (
          <Tooltip title="Post Transactions">
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('post')} 
              disabled={isPosting} 
              color="primary"
            >
              {isPosting ? <CircularProgress size={18} /> : <AccountBalanceWalletOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {isPosted && (
          <Tooltip title="Pay Employees">
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('pay')} 
              disabled={isPaying} 
              color="success"
            >
              {isPaying ? <CircularProgress size={18} /> : <PaidOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogState.open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            {dialogState.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {dialogState.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color={dialogState.color}
            size="small"
            disabled={
              (dialogState.action === 'submit' && isSubmitting) ||
              (dialogState.action === 'delete' && isDeleting) ||
              (dialogState.action === 'approve' && isApproving) ||
              (dialogState.action === 'post' && isPosting) ||
              (dialogState.action === 'pay' && isPaying)
            }
          >
            {dialogState.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};