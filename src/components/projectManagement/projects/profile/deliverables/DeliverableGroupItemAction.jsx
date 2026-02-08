'use client'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
  PlaylistAddCheck,
} from '@mui/icons-material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import DeliverablesForm from './DeliverablesForm';
import DeliverableGroupForm from './DeliverableGroupForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import projectsServices from '../../project-services';
import { JumboDdMenu } from '@jumbo/components';

function DeliverableGroupItemAction({ group, isAccDetails }) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteDeliverableGroup = useMutation({
    mutationFn: projectsServices.deleteDeliverableGroup,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectDeliverableGroups'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete', {
        variant: 'error',
      });
    },
  });

  const menuItems = [
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    !(group.children.length > 0 || group.deliverables.length > 0) && {
      icon: <DeleteOutlined color="error" />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean); // ✅ filter to remove false entries

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Deliverable Group?',
          onYes: () => {
            hideDialog();
            deleteDeliverableGroup.mutate(group);
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
    <React.Fragment>
      {/* Dialog for editing & adding deliverables */}
      <Dialog
        open={openEditDialog || openDialog}
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth="md"
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && (
          <DeliverableGroupForm
            deliverableGroup={group}
            setOpenDialog={setOpenEditDialog}
          />
        )}
        {openDialog && (
          <DeliverablesForm setOpenDialog={setOpenDialog} group={group} />
        )}
      </Dialog>

      {!isAccDetails && (
        <JumboDdMenu
          icon={
            <Tooltip title="Actions">
              <MoreHorizOutlined />
            </Tooltip>
          }
          menuItems={menuItems}
          onClickCallback={handleItemAction}
        />
      )}

      {/* Add Deliverable (for account details view) */}
      {!!isAccDetails && (
        <Tooltip title={'Add Deliverable'}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <PlaylistAddCheck />
          </IconButton>
        </Tooltip>
      )}
    </React.Fragment>
  );
}

export default DeliverableGroupItemAction;
