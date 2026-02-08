'use client'
import React, { useState } from 'react';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import BudgetsForm from './BudgetsForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import projectsServices from '../../project-services';
import { JumboDdMenu } from '@jumbo/components';

const BudgetsItemAction = ({ budget }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // React Query v5 mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: (id) => projectsServices.deleteBudget(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectBudgets'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems = [
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    { icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete' },
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Budget?',
          onYes: () => {
            hideDialog();
            deleteBudgetMutation.mutate(budget.id);
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
        fullScreen={belowLargeScreen}
        maxWidth="md"
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <BudgetsForm budget={budget} setOpenDialog={setOpenEditDialog} />
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title="Actions">
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default BudgetsItemAction;
