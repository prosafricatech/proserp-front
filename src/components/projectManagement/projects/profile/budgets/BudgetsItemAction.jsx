'use client';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  ContentCopyOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@mui/icons-material';
import {
  Dialog,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import projectsServices from '../../project-services';
import BudgetsForm from './BudgetsForm';

const EditBudget = ({ budget, setOpenDialog, isDuplicate }) => {
  const { data: budgetDetails, isFetching } = useQuery({
    queryKey: ['editBudget', { id: budget.id }],
    queryFn: async () => projectsServices.getbudgetItemsDetails(budget.id),
  });

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <BudgetsForm
      budget={budgetDetails}
      setOpenDialog={setOpenDialog}
      isDuplicate={isDuplicate}
    />
  );
};

const BudgetsItemAction = ({ budget }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [duplicateBudget, setDuplicateBudget] = useState(false);

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
        maxWidth='lg'
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <EditBudget
          budget={budget}
          setOpenDialog={setOpenEditDialog}
          isDuplicate={duplicateBudget}
        />
      </Dialog>

      <Stack
        textAlign={'end'}
        direction='row'
        spacing={1}
        sx={{ mb: 1 }}
        justifyContent='flex-end'
      >
        <Tooltip title='Edit'>
          <IconButton
            color='primary'
            size='small'
            onClick={(e) => {
              e.stopPropagation();
              setDuplicateBudget(false);
              handleEdit();
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title='Duplicate'>
          <IconButton
            color='primary'
            size='small'
            onClick={(e) => {
              e.stopPropagation();
              setDuplicateBudget(true);
              handleEdit();
            }}
          >
            <ContentCopyOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title='Delete'>
          <IconButton color='error' size='small' onClick={handleDelete}>
            <DeleteOutlined />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
};

export default BudgetsItemAction;
