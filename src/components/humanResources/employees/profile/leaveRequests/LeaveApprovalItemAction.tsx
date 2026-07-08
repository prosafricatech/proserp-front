'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { DeleteOutlined, EditOutlined, FactCheckOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import { LeaveRequestType } from './LeaveRequestType';

interface LeaveApprovalItemActionProps {
  leaveRequest: LeaveRequestType;
  approval: NonNullable<LeaveRequestType['approvals']>[number];
  approvals: NonNullable<LeaveRequestType['approvals']>;
}

const getPendingLevel = (leaveRequest: LeaveRequestType) => {
  const levels = leaveRequest.approval_chain?.levels || [];
  const approvedLevelIds = new Set(
    (leaveRequest.approvals || [])
      .filter((a) => a.status === 'approved')
      .map((a) => Number(a.chain_level_id || a.approval_chain_level_id))
  );
  return levels.find((level) => !approvedLevelIds.has(Number(level.id)));
};

const LeaveApprovalItemAction = ({
  leaveRequest,
  approval,
  approvals,
}: LeaveApprovalItemActionProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [daysApproved, setDaysApproved] = useState<number | ''>(leaveRequest.days_requested || 1);
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [daysError, setDaysError] = useState('');
  const [editStatus, setEditStatus] = useState<'approved' | 'rejected' | 'on hold'>('approved');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authUser, hasOrganizationRole } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getPendingLevel(leaveRequest);
  const pendingRoleName =
    leaveRequest?.next_approval_level?.role?.name || pendingLevel?.role?.name || '';
  const isLatestApproval = approvals[approvals.length - 1]?.id === approval?.id;
  const normalizedApprovalStatus = (approval?.status || '').toLowerCase();

  const { mutate: addApproval, isPending: isAdding } = useMutation({
    mutationFn: humanResourcesServices.addLeaveRequestApproval,
    onSuccess: () => {
      setOpenDialog(false);
      setRemarks('');
      setRemarksError('');
      setDaysError('');
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['showLeaveRequest', leaveRequest.id] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar('Leave approval recorded', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const canNextApprove =
    isLatestApproval &&
    normalizedApprovalStatus === 'approved' &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName));

  const canEdit =
    isLatestApproval && (approval as any)?.creator?.id === authUser?.user?.id;

  const canDelete =
    isLatestApproval &&
    (approval as any)?.creator?.id === authUser?.user?.id;

  const handleSaveEdit = () => {
    if (daysApproved === '' || Number(daysApproved) <= 0) {
      setDaysError('Days approved is required');
      return;
    }
    setRemarksError('');
    setDaysError('');
    updateApproval({
      days_approved: Number(daysApproved),
      remarks,
      status: editStatus,
    });
  };

  const handleDecisionClick = (status: 'approved' | 'rejected' | 'on hold') => {
    if (isEditMode) {
      // In edit mode, update the approval
      if (status === 'approved' && (daysApproved === '' || Number(daysApproved) <= 0)) {
        setDaysError('Days approved is required');
        return;
      }
      if (!remarks.trim()) {
        setRemarksError('Remarks are required');
        return;
      }
      setRemarksError('');
      setDaysError('');
      updateApproval({
        days_approved: Number(daysApproved),
        remarks,
        status,
      });
    } else {
      // In create mode, use the existing flow
      handleDecision(status);
    }
  };

  const handleDecision = (status: 'approved' | 'rejected' | 'on hold') => {
    if ((status === 'rejected' || status === 'on hold') && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }
    if (status === 'approved' && (daysApproved === '' || Number(daysApproved) <= 0)) {
      setDaysError('Days approved is required');
      return;
    }
    setRemarksError('');
    setDaysError('');
    addApproval({
      leave_request_id: leaveRequest.id,
      chain_level_id: pendingLevel?.id,
      status,
      days_approved: status === 'approved' ? Number(daysApproved) : undefined,
      remarks,
    });
  };

  const { mutate: deleteApproval, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => humanResourcesServices.deleteLeaveRequestApproval(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['showLeaveRequest', leaveRequest.id] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar(data?.message || 'Approval deleted', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const { mutate: updateApproval, isPending: isUpdating } = useMutation({
    mutationFn: (data: any) => humanResourcesServices.updateLeaveRequestApproval(approval.id!, data),
    onSuccess: (data: any) => {
      setOpenDialog(false);
      setIsEditMode(false);
      setRemarks('');
      setRemarksError('');
      setDaysError('');
      queryClient.invalidateQueries({ queryKey: ['showLeaveRequest', leaveRequest.id] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar(data?.message || 'Approval updated', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Approval will be deleted',
      onYes: () => {
        hideDialog();
        deleteApproval(approval.id!);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <>
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setIsEditMode(false);
          setRemarks('');
          setRemarksError('');
          setDaysError('');
        }}
        fullWidth
        maxWidth='sm'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle>
          Leave Approval {isEditMode ? '— Edit' : '— Next Level'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Always show alert section */}
            <Alert severity='info'>
              {isEditMode ? 'Editing Approval' : 'Pending level:'} {' '}
              {isEditMode ? '' : pendingLevel?.name || pendingLevel?.level_name || 'Next level'}
            </Alert>

            <TextField
              label='Days Approved'
              size='small'
              fullWidth
              value={daysApproved}
              error={!!daysError}
              helperText={daysError}
              onChange={(e: any) => {
                setDaysError('');
                setDaysApproved(e.target.value === '' ? '' : sanitizedNumber(e.target.value));
              }}
            />
            <TextField
              label='Remarks'
              size='small'
              fullWidth
              multiline
              minRows={2}
              value={remarks}
              error={!!remarksError}
              helperText={remarksError}
              onChange={(e: any) => {
                setRemarksError('');
                setRemarks(e.target.value);
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              setIsEditMode(false);
              setRemarks('');
              setRemarksError('');
              setDaysError('');
              setDaysApproved(leaveRequest.days_requested || 1);
              setEditStatus('approved');
            }} 
            disabled={isAdding || isUpdating}
          >
            Cancel
          </Button>
          <LoadingButton
            loading={isAdding || isUpdating}
            variant='contained'
            color='error'
            size='small'
            onClick={() => handleDecisionClick('rejected')}
          >
            Reject
          </LoadingButton>
          <LoadingButton
            loading={isAdding || isUpdating}
            variant='contained'
            size='small'
            onClick={() => handleDecisionClick('on hold')}
          >
            Hold
          </LoadingButton>
          <LoadingButton
            loading={isAdding || isUpdating}
            variant='contained'
            color='success'
            size='small'
            onClick={() => handleDecisionClick('approved')}
          >
            Approve
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {canEdit && (
        <Tooltip title='Edit'>
          <IconButton
            onClick={() => {
              setDaysApproved(approval?.days_approved || leaveRequest.days_requested || 1);
              setRemarks(approval?.remarks || '');
              setEditStatus((approval?.status || 'approved') as any);
              setIsEditMode(true);
              setOpenDialog(true);
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canNextApprove && (
        <Tooltip title='Approve'>
          <IconButton 
            onClick={() => {
              setRemarks('');
              setDaysApproved(leaveRequest.days_requested || 1);
              setOpenDialog(true);
            }}
          >
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title='Delete'>
          <IconButton onClick={handleDelete} disabled={isDeleting}>
            <DeleteOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LeaveApprovalItemAction;
