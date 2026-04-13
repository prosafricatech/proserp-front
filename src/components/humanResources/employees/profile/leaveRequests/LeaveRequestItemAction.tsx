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
  TextField,
  Tooltip,
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
    'approved' | 'rejected' | 'cancelled' | null
  >(null);
  const [remarks, setRemarks] = useState('');
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
      mutationFn: humanResourcesServices.updateLeaveRequest,
      onSuccess: () => {
        setOpenStatusDialog(false);
        setStatusAction(null);
        setRemarks('');
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
        enqueueSnackbar(message, { variant: 'error' });
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
        setStatusAction('approved');
        setRemarks('');
        setOpenStatusDialog(true);
        break;
      case 'reject':
        setStatusAction('rejected');
        setRemarks('');
        setOpenStatusDialog(true);
        break;
      case 'cancel':
        setStatusAction('cancelled');
        setRemarks('');
        setOpenStatusDialog(true);
        break;
      default:
        break;
    }
  };

  const handleSubmitStatusAction = () => {
    if (!statusAction) return;

    updateLeaveRequest({
      id: leaveRequest.id,
      status: statusAction,
      review_remarks: remarks,
    });
  };

  const actionButtonLabel =
    statusAction === 'approved'
      ? 'Approve'
      : statusAction === 'rejected'
        ? 'Reject'
        : 'Cancel';

  const actionButtonColor =
    statusAction === 'approved'
      ? 'success'
      : statusAction === 'rejected'
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
          {statusAction === 'approved'
            ? 'Approve'
            : statusAction === 'rejected'
              ? 'Reject'
              : 'Cancel'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label='Remarks'
            size='small'
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1 }}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
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
