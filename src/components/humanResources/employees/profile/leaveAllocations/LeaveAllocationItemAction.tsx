'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
} from '@mui/icons-material';
import { Dialog, LinearProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveAllocationForm from './LeaveAllocationForm';
import { LeaveAllocationType } from './LeaveAllocationType';

const EditLeaveAllocation = ({
  leaveAllocation,
  setOpenEditDialog,
}: {
  leaveAllocation: LeaveAllocationType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: leaveAllocationData, isFetching } = useQuery({
    queryKey: ['showLeaveAllocation', leaveAllocation.id],
    queryFn: () =>
      humanResourcesServices.showLeaveAllocation(leaveAllocation.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <LeaveAllocationForm
      leaveAllocation={leaveAllocationData || leaveAllocation}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
        }
      }}
    />
  );
};

const LeaveAllocationItemAction = ({
  leaveAllocation,
}: {
  leaveAllocation: LeaveAllocationType;
}) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteLeaveAllocation } = useMutation({
    mutationFn: humanResourcesServices.deleteLeaveAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
      enqueueSnackbar('Leave Allocation Deleted Successfully', {
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
    ...(checkOrganizationPermission(PERMISSIONS.LEAVE_ALLOCATIONS_EDIT)
      ? [
          {
            icon: <EditOutlined />,
            title: 'Edit',
            action: 'edit',
          },
        ]
      : []),
    ...(checkOrganizationPermission(PERMISSIONS.LEAVE_ALLOCATIONS_DELETE)
      ? [
          {
            icon: <DeleteOutlined color='error' />,
            title: 'Delete',
            action: 'delete',
          },
        ]
      : []),
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Leave Allocation?',
          onYes: () => {
            hideDialog();
            deleteLeaveAllocation(leaveAllocation.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        {openEditDialog && (
          <EditLeaveAllocation
            leaveAllocation={leaveAllocation}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
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

export default LeaveAllocationItemAction;
