'use client';

import React from 'react';
import { CheckCircleOutlineOutlined, DeleteOutlined, EditOutlined, MoreHorizOutlined, UndoOutlined } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Tooltip, useMediaQuery, LinearProgress } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { JumboDdMenu } from '@jumbo/components';
import { MenuItemProps } from '@jumbo/types';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import ImprestRetirementForm from './form/ImprestRetirementForm';

interface ImprestRetirementApprovalActionProps {
  retirement: any;
  approvedRequisition: any;
}

function ImprestRetirementApprovalAction({ retirement, approvedRequisition }: ImprestRetirementApprovalActionProps) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const { checkOrganizationPermission } = useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openUpdateDialog, setOpenUpdateDialog] = React.useState(false);
  const [openApprovalDialog, setOpenApprovalDialog] = React.useState(false);
  const [remarksDialogMode, setRemarksDialogMode] = React.useState<'reject' | 'revoke' | null>(null);
  const [remarks, setRemarks] = React.useState('');

  const statusRaw = String(retirement?.status || '').toLowerCase();
  const statusLabelRaw = String(retirement?.status_label || '').toLowerCase();
  const approvalStatusRaw = String(retirement?.approval?.status || '').toLowerCase();

  const isPendingApproval =
    statusRaw === 'submitted' &&
    (approvalStatusRaw === 'pending' || !approvalStatusRaw || statusLabelRaw.includes('pending'));
  const isApproved = approvalStatusRaw === 'approved' || statusLabelRaw.includes('approved');
  const isRejected = approvalStatusRaw === 'rejected' || statusLabelRaw.includes('rejected');
  const isDraftLike = statusRaw === 'draft' || statusRaw === 'suspended';
  const canApproveRetirement = checkOrganizationPermission([PERMISSIONS.IMPREST_RETIREMENT_APPROVE]);

  const { data: retirementDetails, isFetching: isFetchingRetirementDetails } = useQuery({
    queryKey: ['imprestRetirementDetails', { id: retirement?.id }, 'imprest-retirement-update'],
    queryFn: async () => imprestRetirementServices.show(retirement?.id),
    enabled: !!retirement?.id && (!!openUpdateDialog || !!openApprovalDialog),
  });

  const { mutate: approveRetirement, isPending } = useMutation({
    mutationFn: imprestRetirementServices.approve,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement approved', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      setOpenApprovalDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to approve retirement', {
        variant: 'error',
      });
    },
  });

  const { mutate: deleteRetirement, isPending: isDeletingRetirement } = useMutation({
    mutationFn: imprestRetirementServices.delete,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement draft deleted', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete retirement draft', {
        variant: 'error',
      });
    },
  });

  const { mutate: revokeRetirementApproval, isPending: isRevokingApproval } = useMutation({
    mutationFn: imprestRetirementServices.revokeApproval,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement approval revoked', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      setRemarksDialogMode(null);
      setRemarks('');
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to revoke retirement approval', {
        variant: 'error',
      });
    },
  });

  const menuItems: MenuItemProps[] = [
    ...(isDraftLike
      ? [
          { icon: <EditOutlined />, title: 'Update Draft', action: 'update-draft' } as MenuItemProps,
        ]
      : []),
    ...(isPendingApproval
      && canApproveRetirement
      ? [
          { icon: <CheckCircleOutlineOutlined color="success" />, title: 'Approval', action: 'retirement-approval' } as MenuItemProps,
        ]
      : []),
    ...(isRejected
      && canApproveRetirement
      ? [
          { icon: <EditOutlined color="warning" />, title: 'Edit Approval Decision', action: 'retirement-approval' } as MenuItemProps,
        ]
      : []),
    ...(isApproved && canApproveRetirement
      ? [{ icon: <UndoOutlined color="warning" />, title: 'Revoke Approval', action: 'revoke' } as MenuItemProps]
      : []),
    ...(isDraftLike
      ? [{ icon: <DeleteOutlined color="error" />, title: 'Delete Draft', action: 'delete-draft' } as MenuItemProps]
      : []),
  ];

  const handleApprove = async () => {
    await approveRetirement({
      imprest_retirement_id: retirement.id,
      status: 'approved',
      approval_date: dayjs().format('YYYY-MM-DD'),
      remarks: null,
    });
  };

  const handleDeleteDraft = () => {
    showDialog({
      title: 'Delete Draft',
      content: `Delete draft ${retirement?.retirementNo || `#${retirement?.id}`}?`,
      variant: 'confirm',
      onYes: async () => {
        hideDialog();
        await deleteRetirement(retirement.id);
      },
      onNo: () => hideDialog(),
    });
  };

  const handleSubmitRemarksAction = async () => {
    if (remarksDialogMode === 'reject' && !remarks.trim()) {
      enqueueSnackbar('Remarks are required for rejection', { variant: 'error' });
      return;
    }

    if (remarksDialogMode === 'reject') {
      await approveRetirement({
        imprest_retirement_id: retirement.id,
        status: 'rejected',
        approval_date: dayjs().format('YYYY-MM-DD'),
        remarks: remarks.trim(),
      });
      setRemarksDialogMode(null);
      setRemarks('');
      return;
    }

    if (remarksDialogMode === 'revoke') {
      const approvalId = retirement?.approval?.id;
      if (!approvalId) {
        enqueueSnackbar('Approval reference not found for revoke', { variant: 'error' });
        return;
      }

      await revokeRetirementApproval({
        approvalId,
        remarks: remarks.trim(),
      });
    }
  };

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'update-draft':
        setOpenUpdateDialog(true);
        break;
      case 'delete-draft':
        handleDeleteDraft();
        break;
      case 'approve':
      case 'retirement-approval':
        setOpenApprovalDialog(true);
        break;
      case 'revoke':
        setRemarks('');
        setRemarksDialogMode('revoke');
        break;
      default:
        break;
    }
  };

  if (menuItems.length === 0) return null;

  return (
    <>
      <Dialog
        open={openUpdateDialog}
        maxWidth="lg"
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={() => setOpenUpdateDialog(false)}
      >
        {isFetchingRetirementDetails ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementForm
            toggleOpen={setOpenUpdateDialog}
            approvedRequisition={approvedRequisition}
            existingRetirementDetails={retirementDetails}
            preferredRetirementId={retirement?.id}
          />
        )}
      </Dialog>

      <Dialog
        open={openApprovalDialog}
        maxWidth="lg"
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={() => setOpenApprovalDialog(false)}
      >
        {isFetchingRetirementDetails ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementForm
            toggleOpen={setOpenApprovalDialog}
            approvedRequisition={approvedRequisition}
            existingRetirementDetails={retirementDetails}
            preferredRetirementId={retirement?.id}
            reviewMode
            onApprove={handleApprove}
            onReject={() => {
              setRemarks('');
              setRemarksDialogMode('reject');
            }}
            approveLoading={isPending}
            rejectLoading={isPending || isRevokingApproval}
          />
        )}
      </Dialog>

      <Dialog
        open={!!remarksDialogMode}
        onClose={() => {
          setRemarksDialogMode(null);
          setRemarks('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle textAlign="center">
          {remarksDialogMode === 'reject' ? 'Reject Retirement' : 'Revoke Retirement Approval'}
        </DialogTitle>
        <DialogContent>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1 }}
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required={remarksDialogMode === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            onClick={() => {
              setRemarksDialogMode(null);
              setRemarks('');
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color={remarksDialogMode === 'reject' ? 'error' : 'warning'}
            onClick={handleSubmitRemarksAction}
            disabled={isPending || isRevokingApproval}
          >
            {remarksDialogMode === 'reject' ? 'Reject' : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title="Retirement Actions">
            <MoreHorizOutlined fontSize="small" />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
}

export default React.memo(ImprestRetirementApprovalAction);
