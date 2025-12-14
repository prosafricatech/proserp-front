'use client'
import React, { useContext, useState } from 'react';
import { 
  Box, 
  Chip, 
  Dialog, 
  Grid, 
  IconButton, 
  Tooltip, 
  Typography, 
  useMediaQuery 
} from '@mui/material';
import { 
  EditOutlined, 
  PlaylistAddOutlined, 
  RemoveDoneOutlined, 
  RestoreOutlined 
} from '@mui/icons-material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { approvalChainsListItemContext } from './ApprovalChainsListItem';
import ApprovalStatusSelector from './ApprovalStatusSelector';
import ApprovalChainLevelDialog from './form/ApprovalChainLevelDialog';
import approvalChainsServices from './approvalChainsServices';
import { ApprovalChainLevel } from './ApprovalChainType';

function ApprovalChainLevels() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddLevelDialog, setOpenAddLevelDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { 
    approvalChainLevels = [], 
    queryParams, 
    setQueryParams, 
    approvalChain,
    setSelectedApprovalChainLevel
  } = useContext(approvalChainsListItemContext);

  const [selectedApprovalChainLevel, setSelectedLevel] = useState<ApprovalChainLevel | null>(null);

  const handleMutationSuccess = (data: { message: string }) => {
    enqueueSnackbar(data.message, { variant: 'success' });
    queryClient.invalidateQueries({ queryKey: ['approvalChainLevels'] });
  };

  const handleMutationError = (error: any) => {
    enqueueSnackbar(
      error?.response?.data?.message || 'An error occurred', 
      { variant: 'error' }
    );
  };

  const activateLevel = useMutation({
    mutationFn: approvalChainsServices.activateLevel,
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  const deactivateLevel = useMutation({
    mutationFn: approvalChainsServices.deactivateLevel,
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  const showConfirmationDialog = (
    title: string,
    content: string,
    onConfirm: () => void
  ) => {
    showDialog({
      title,
      content,
      onYes: () => {
        hideDialog();
        onConfirm();
      },
      onNo: hideDialog,
      variant: 'confirm',
    });
  };

  const handleActivationLevel = (level: ApprovalChainLevel) => {
    showConfirmationDialog(
      'Confirm Activation?',
      'If you click yes, this Level will be Activated',
      () => activateLevel.mutate(level)
    );
  };

  const handleDeactivationLevel = (level: ApprovalChainLevel) => {
    showConfirmationDialog(
      'Confirm Deactivation?',
      'If you click yes, this Level will be Deactivated',
      () => deactivateLevel.mutate(level.id)
    );
  };

  const handleEditClick = (level: ApprovalChainLevel) => {
    setSelectedLevel(level);
    setSelectedApprovalChainLevel(level);
    setOpenEditDialog(true);
  };

  return (
    <>
      <Grid container spacing={2} alignItems="center" padding={1}>
        <Grid size={{xs: 12, md: 10}}>
          {approvalChainLevels.length > 0 && (
            <Typography variant="body1">Chain Levels</Typography>
          )}
        </Grid>

        <Grid size={{xs: 12, md: 2}} container justifyContent="flex-end" alignItems="center">
          <Grid size={11}>
            <ApprovalStatusSelector
              value={queryParams.status}
              onChange={(status) => setQueryParams(prev => ({ ...prev, status }))}
            />
          </Grid>

          {approvalChain?.status === 'active' && (
            <Grid size={1}>
              <Tooltip title="Add Level">
                <IconButton onClick={() => setOpenAddLevelDialog(true)}>
                  <PlaylistAddOutlined />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
      </Grid>

      {approvalChainLevels.map((level) => (
        <Grid
          key={level.id}
          sx={{
            cursor: 'pointer',
            borderTop: 2,
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
            paddingX: 1,
          }}
          columnSpacing={2}
          paddingTop={1}
          alignItems="center"
          container
        >
          <Grid size={{xs: 6, md: 4}}>
            <Tooltip title="Role Name">
              <Typography>{level?.role?.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 3}}>
            <Tooltip title="Label">
              <Typography>{level.label}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 4}} display="flex" alignItems={{ md: 'end' }} justifyContent={{ md: 'end' }}>
            <Tooltip title="Status">
              <Chip
                size="small"
                label={level.status}
                color={level.status === 'active' ? 'success' : 'warning'}
              />
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 1}}>
            <Box display="flex" flexDirection="row" justifyContent="flex-end">
              {approvalChain.status === 'active' && level.status === 'active' && (
                <Tooltip title="Deactivate Level">
                  <IconButton onClick={() => handleDeactivationLevel(level)}>
                    <RemoveDoneOutlined color="error" />
                  </IconButton>
                </Tooltip>
              )}
              {approvalChain.status === 'active' && level.status !== 'active' && (
                <Tooltip title="Activate Level">
                  <IconButton onClick={() => handleActivationLevel(level)}>
                    <RestoreOutlined />
                  </IconButton>
                </Tooltip>
              )}
              {approvalChain.status === 'active' && level.status === 'active' && (
                <Tooltip title="Edit Level">
                  <IconButton onClick={() => handleEditClick(level)}>
                    <EditOutlined />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
        </Grid>
      ))}

      <Dialog
        open={openEditDialog || openAddLevelDialog}
        fullWidth   
        fullScreen={belowLargeScreen}
        maxWidth={'md'}
        scroll={belowLargeScreen  ? 'body' : 'paper'}
      >
        {openEditDialog && selectedApprovalChainLevel && (
          <ApprovalChainLevelDialog
            approvalChainLevel={selectedApprovalChainLevel}
            toggleOpen={setOpenEditDialog}
          />
        )}
        {openAddLevelDialog && <ApprovalChainLevelDialog approvalChain={approvalChain} toggleOpen={setOpenAddLevelDialog} />}
      </Dialog>
    </>
  );
}

export default ApprovalChainLevels;