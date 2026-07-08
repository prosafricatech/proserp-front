'use client';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  ButtonGroup,
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

interface LeaveApprovalsActionTailProps {
  leaveRequest: LeaveRequestType;
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

const LeaveApprovalsActionTail = ({ leaveRequest }: LeaveApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [daysApproved, setDaysApproved] = useState<number | ''>(leaveRequest.days_requested || 1);
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [daysError, setDaysError] = useState('');

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { hasOrganizationRole } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getPendingLevel(leaveRequest);
  const pendingRoleName =
    leaveRequest?.next_approval_level?.role?.name || pendingLevel?.role?.name || '';
  const normalizedStatus = (leaveRequest.status || '').toLowerCase();

  const canApprove =
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    !['approved', 'rejected', 'cancelled'].includes(normalizedStatus);

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

  const { mutate: addApproval, isPending: isAdding } = useMutation({
    mutationFn: humanResourcesServices.addLeaveRequestApproval,
    onSuccess: () => {
      setOpenDialog(false);
      setRemarks('');
      setRemarksError('');
      setDaysError('');
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

  return (
    <>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth='sm'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle>Leave Approval</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity='info'>
              Pending level:{' '}
              {pendingLevel?.name || pendingLevel?.level_name || 'First level'}
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
          <Button onClick={() => setOpenDialog(false)} disabled={isAdding}>
            Cancel
          </Button>
          <LoadingButton
            loading={isAdding}
            variant='contained'
            color='error'
            size='small'
            onClick={() => handleDecision('rejected')}
          >
            Reject
          </LoadingButton>
          <LoadingButton
            loading={isAdding}
            variant='contained'
            size='small'
            onClick={() => handleDecision('on hold')}
          >
            Hold
          </LoadingButton>
          <LoadingButton
            loading={isAdding}
            variant='contained'
            color='success'
            size='small'
            onClick={() => handleDecision('approved')}
          >
            Approve
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {canApprove && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Leave Request'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default LeaveApprovalsActionTail;
