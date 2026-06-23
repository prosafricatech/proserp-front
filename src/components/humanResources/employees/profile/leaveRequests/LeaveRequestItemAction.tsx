'use client';

import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  CheckCircleOutline,
  DeleteOutlined,
  EditOutlined,
  HighlightOffOutlined,
  MoreHorizOutlined,
  RemoveCircleOutline,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveRequestForm from './LeaveRequestForm';
import { LeaveRequestType } from './LeaveRequestType';

const EditLeaveRequest = ({
  leaveRequest,
  setOpenEditDialog,
}: {
  leaveRequest: LeaveRequestType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: leaveRequestData, isFetching } = useQuery({
    queryKey: ['showLeaveRequest', leaveRequest.id],
    queryFn: () => humanResourcesServices.showLeaveRequest(leaveRequest.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <LeaveRequestForm
      leaveRequest={leaveRequestData || leaveRequest}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
        }
      }}
    />
  );
};

const LeaveRequestItemAction = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestType;
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [statusAction, setStatusAction] = useState<
    'approve' | 'reject' | 'cancel' | null
  >(null);
  const [remarks, setRemarks] = useState('');
  const [daysApproved, setDaysApproved] = useState<number | ''>('');
  const [detailedLeaveRequest, setDetailedLeaveRequest] =
    useState<LeaveRequestType | null>(null);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteLeaveRequest } = useMutation({
    mutationFn: humanResourcesServices.deleteLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      enqueueSnackbar('Leave Request Deleted Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const { mutate: updateLeaveRequest, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: (payload: any) => {
        if (payload.action === 'chain') {
          return humanResourcesServices.addLeaveRequestApproval(payload.data);
        }

        if (payload.action === 'approve') {
          return humanResourcesServices.approveLeaveRequest(payload.data);
        }

        if (payload.action === 'reject') {
          return humanResourcesServices.rejectLeaveRequest(payload.data);
        }

        return humanResourcesServices.cancelLeaveRequest(payload.id);
      },
      onSuccess: () => {
        setOpenStatusDialog(false);
        setStatusAction(null);
        setRemarks('');
        setDaysApproved('');
        setDetailedLeaveRequest(null);
        queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
        enqueueSnackbar('Leave Request Status Updated Successfully', {
          variant: 'success',
        });
      },
      onError: (error: any) => {
        let message = 'Something went wrong';

        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as any).response?.data?.message === 'string'
        ) {
          message = (error as any).response.data.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        error.response?.data?.validation_errors
          ? enqueueSnackbar(
              String(
                Object.values(error.response?.data?.validation_errors || {})?.flat?.()?.[0] ||
                  message
              ),
              { variant: 'error' }
            )
          : enqueueSnackbar(message, { variant: 'error' });
      },
    });

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit',
    },
    {
      icon: <CheckCircleOutline color='success' />,
      title: 'Approve',
      action: 'approve',
    },
    {
      icon: <HighlightOffOutlined color='error' />,
      title: 'Reject',
      action: 'reject',
    },
    {
      icon: <RemoveCircleOutline color='warning' />,
      title: 'Cancel',
      action: 'cancel',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Leave Request?',
          onYes: () => {
            hideDialog();
            deleteLeaveRequest(leaveRequest.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'approve':
        setStatusAction('approve');
        setRemarks('');
        setDaysApproved(leaveRequest.days_requested);
        setDetailedLeaveRequest(null);
        setOpenStatusDialog(true);
        humanResourcesServices
          .showLeaveRequest(leaveRequest.id)
          .then((data: any) => {
            const detail = data?.data || data;
            setDetailedLeaveRequest(detail);
            setDaysApproved(getMaxDaysApproved(detail));
          })
          .catch(() => undefined);
        break;
      case 'reject':
        setStatusAction('reject');
        setRemarks('');
        setDaysApproved('');
        setDetailedLeaveRequest(null);
        setOpenStatusDialog(true);
        humanResourcesServices
          .showLeaveRequest(leaveRequest.id)
          .then((data: any) => setDetailedLeaveRequest(data?.data || data))
          .catch(() => undefined);
        break;
      case 'cancel':
        setStatusAction('cancel');
        setRemarks('');
        setOpenStatusDialog(true);
        break;
      default:
        break;
    }
  };

  const activeLeaveRequest = detailedLeaveRequest || leaveRequest;
  const hasApprovalChain = Boolean(activeLeaveRequest.approval_chain_id);
  const getPendingLevel = (request: LeaveRequestType) => {
    const levels = request.approval_chain?.levels || [];
    const approvedLevelIds = new Set(
      (request.approvals || [])
        .filter((approval) => approval.status === 'approved')
        .map((approval) => Number(approval.chain_level_id || approval.approval_chain_level_id))
    );

    return levels.find((level) => !approvedLevelIds.has(Number(level.id))) || levels[0];
  };

  function getMaxDaysApproved(request: LeaveRequestType) {
    const approvedDays = (request.approvals || [])
      .filter((approval) => approval.status === 'approved' && approval.days_approved != null)
      .map((approval) => Number(approval.days_approved));

    return approvedDays.length
      ? approvedDays[approvedDays.length - 1]
      : Number(request.days_requested || 0);
  }

  const handleSubmitStatusAction = () => {
    if (!statusAction) return;

    if (statusAction === 'cancel') {
      updateLeaveRequest({ action: 'cancel', id: leaveRequest.id });
      return;
    }

    if (hasApprovalChain) {
      updateLeaveRequest({
        action: 'chain',
        data: {
          leave_request_id: leaveRequest.id,
          chain_level_id: getPendingLevel(activeLeaveRequest)?.id,
          status: statusAction === 'approve' ? 'approved' : 'rejected',
          days_approved: statusAction === 'approve' ? Number(daysApproved) : undefined,
          remarks,
        },
      });
      return;
    }

    if (statusAction === 'approve') {
      updateLeaveRequest({
        action: 'approve',
        data: {
          id: leaveRequest.id,
          days_approved: daysApproved === '' ? undefined : Number(daysApproved),
          remarks,
        },
      });
      return;
    }

    updateLeaveRequest({
      action: 'reject',
      data: {
        id: leaveRequest.id,
        remarks,
      },
    });
  };

  const actionButtonLabel =
    statusAction === 'approve'
      ? 'Approve'
      : statusAction === 'reject'
        ? 'Reject'
        : 'Cancel';

  const actionButtonColor =
    statusAction === 'approve'
      ? 'success'
      : statusAction === 'reject'
        ? 'error'
        : 'error';

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        {openEditDialog && (
          <EditLeaveRequest
            leaveRequest={leaveRequest}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
      </Dialog>

      <Dialog
        open={openStatusDialog}
        fullWidth
        maxWidth='sm'
        onClose={() => {
          if (!isUpdatingStatus) {
            setOpenStatusDialog(false);
            setStatusAction(null);
            setRemarks('');
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          {statusAction === 'approve'
            ? 'Approve'
            : statusAction === 'reject'
              ? 'Reject'
              : 'Cancel'}
        </DialogTitle>
        <DialogContent>
          {hasApprovalChain && statusAction !== 'cancel' && (
            <Typography variant='body2' color='text.secondary' mb={2}>
              Approval level:{' '}
              {getPendingLevel(activeLeaveRequest)?.name ||
                getPendingLevel(activeLeaveRequest)?.level_name ||
                'Next level'}
            </Typography>
          )}
          {statusAction === 'approve' && (
            <TextField
              label='Days Approved'
              size='small'
              fullWidth
              type='number'
              sx={{ mt: 1 }}
              value={daysApproved}
              inputProps={{ min: 0, max: getMaxDaysApproved(activeLeaveRequest), step: 0.5 }}
              helperText={`Maximum: ${getMaxDaysApproved(activeLeaveRequest)}`}
              onChange={(event) => setDaysApproved(event.target.value === '' ? '' : Number(event.target.value))}
            />
          )}
          {hasApprovalChain && statusAction !== 'cancel' && (
            <TextField
              select
              label='Decision'
              size='small'
              fullWidth
              sx={{ mt: 2 }}
              value={statusAction === 'approve' ? 'approved' : 'rejected'}
              onChange={(event) =>
                setStatusAction(event.target.value === 'approved' ? 'approve' : 'reject')
              }
            >
              <MenuItem value='approved'>Approved</MenuItem>
              <MenuItem value='rejected'>Rejected</MenuItem>
            </TextField>
          )}
          <TextField
            label='Remarks'
            size='small'
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            helperText={statusAction === 'approve' ? 'Optional when approving' : 'Required'}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenStatusDialog(false);
              setStatusAction(null);
              setRemarks('');
            }}
            disabled={isUpdatingStatus}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color={actionButtonColor}
            size='small'
            onClick={handleSubmitStatusAction}
            disabled={isUpdatingStatus || !statusAction}
          >
            {actionButtonLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default LeaveRequestItemAction;
