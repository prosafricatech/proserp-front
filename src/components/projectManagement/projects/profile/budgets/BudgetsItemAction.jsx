'use client'
import React, { useState } from 'react';
import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Dialog, Skeleton, Tooltip, useMediaQuery, IconButton, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import BudgetsForm from './BudgetsForm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import projectsServices from '../../project-services';

const EditBudget = ({ budget, setOpenDialog }) => {
  const { data: budgetDetails, isFetching } = useQuery({
    queryKey: ['editBudget', { id: budget.id }],
    queryFn: async () => projectsServices.getbudgetItemsDetails(budget.id),
  });

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <BudgetsForm budget={budgetDetails} setOpenDialog={setOpenDialog} />
  );
};

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

  const handleEdit = () => {
    setOpenEditDialog(true);
  };

  const handleDelete = () => {
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
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="lg"
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <EditBudget budget={budget} setOpenDialog={setOpenEditDialog} />
      </Dialog>

      <Stack textAlign={'end'} direction="row" spacing={1} sx={{ mb: 1 }} justifyContent="flex-end">
        <Tooltip title="Edit">
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" size="small" onClick={handleDelete}>
            <DeleteOutlined />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
};

export default BudgetsItemAction;
