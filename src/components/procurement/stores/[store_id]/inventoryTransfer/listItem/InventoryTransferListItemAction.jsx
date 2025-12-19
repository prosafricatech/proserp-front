'use client'
import React, { useState } from 'react';
import {
  AssignmentTurnedInOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Tooltip,
  Tabs,
  Tab,
  Box,
  Button,
  useMediaQuery,
  DialogActions,
  Grid,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import inventoryTransferServices from '../inventoryTransfer-services';
import InventoryTransferForm from '../form/InventoryTransferForm';
import InventoryTransferPDF from '../InventoryTransferPDF';
import InventoryTransferReceiveForm from '../form/InventoryTransferReceiveForm';
import InventoryTransferOnScreen from '../InventoryTransferOnScreen';
import { useStoreProfile } from '../../StoreProfileProvider';
import dayjs from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const InventoryTransferListItemAction = ({ transfer }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openReceiveDialog, setOpenReceiveDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization: { organization } } = useJumboAuth();
  const authObject = useJumboAuth();
  const checkOrganizationPermission = authObject.checkOrganizationPermission;
  const { activeStore } = useStoreProfile();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteTransfers = useMutation({
    mutationFn: inventoryTransferServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTransfers'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const ActionDialog = ({ actionType }) => {
    const [activeTab, setActiveTab] = useState(0);

    const {
      data: transferDetails,
      isLoading,
    } = useQuery({
      queryKey: ['inventoryTransfer', { id: transfer.id }],
      queryFn: () => inventoryTransferServices.transferDetails(transfer.id),
    });

    if (isLoading) {
      return <LinearProgress />;
    }

    const handleChangeTab = (_, newValue) => {
      setActiveTab(newValue);
    };

    return (
      <>
        {actionType === 'openEditForm' ? (
          <InventoryTransferForm transfer={transferDetails} toggleOpen={setOpenEditDialog} />
        ) : (
          <DialogContent>
            {belowLargeScreen && (
              <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
                <Grid item xs={11}>
                  <Tabs value={activeTab} onChange={handleChangeTab}>
                    <Tab label="ONSCREEN" />
                    <Tab label="PDF" />
                  </Tabs>
                </Grid>
                <Grid item xs={1} textAlign="right">
                  <Tooltip title="Close">
                    <IconButton size="small" onClick={() => setOpenDocumentDialog(false)}>
                      <HighlightOff color="primary" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            )}

            {belowLargeScreen && activeTab === 0 ? (
              <InventoryTransferOnScreen transfer={transferDetails} organization={organization} />
            ) : (
              <PDFContent
                document={<InventoryTransferPDF organization={organization} transfer={transferDetails} />}
                fileName={transferDetails.transferNo}
              />
            )}
          </DialogContent>
        )}

        <DialogActions>
          {belowLargeScreen && actionType !== 'openEditForm' && (
            <Box textAlign="right" marginTop={5}>
              <Button variant="outlined" size="small" color="primary" onClick={() => setOpenDocumentDialog(false)}>
                Close
              </Button>
            </Box>
          )}
        </DialogActions>
      </>
    );
  };

  const ReceiveDialog = () => {
    const { data: transferDetails, isLoading } = useQuery({
      queryKey: ['inventoryTransfer', { id: transfer.id }],
      queryFn: () => inventoryTransferServices.transferDetails(transfer.id),
    });

    if (isLoading) {
      return <LinearProgress />;
    }

    return <InventoryTransferReceiveForm transfer={transferDetails} toggleOpen={setOpenReceiveDialog} />;
  };

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Inventory Transfer will be deleted',
      onYes: () => {
        hideDialog();
        deleteTransfers.mutate(transfer);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleOpenEditForm = () => {
    setOpenEditDialog(true);
  };

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog || openReceiveDialog}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="md"
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {openEditDialog && <ActionDialog actionType="openEditForm" />}
        {openDocumentDialog && <ActionDialog actionType="openDocument" />}
        {openReceiveDialog && <ReceiveDialog />}
      </Dialog>

      <Tooltip title={`View ${transfer.transferNo}`}>
        <IconButton onClick={() => setOpenDocumentDialog(true)}>
          <VisibilityOutlined />
        </IconButton>
      </Tooltip>

      {(checkOrganizationPermission(PERMISSIONS.INVENTORY_TRANSFERS_BACKDATE) ||
        transfer.transfer_date >= dayjs().startOf('date').toISOString()) &&
        transfer.external_transfer === null &&
        activeStore.id === transfer.source_store_id &&
        (transfer.status === 'Pending' || transfer.status === 'Completed') && (
          <Tooltip title={`Edit ${transfer.transferNo}`}>
            <IconButton onClick={handleOpenEditForm}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
        )}

      {(activeStore.id !== transfer.source_store_id &&
        (transfer.status === 'Pending' || transfer.status === 'Partially Received')) && (
        <Tooltip title={`Receive ${transfer.transferNo}`}>
          <IconButton onClick={() => setOpenReceiveDialog(true)}>
            <AssignmentTurnedInOutlined />
          </IconButton>
        </Tooltip>
      )}

      {(checkOrganizationPermission(PERMISSIONS.INVENTORY_TRANSFERS_BACKDATE) ||
        transfer.transfer_date >= dayjs().startOf('date').toISOString()) &&
        !transfer.external_transfer &&
        activeStore.id === transfer.source_store_id &&
        (transfer.status === 'Pending' || !['Fully Received', 'Partially Received'].includes(transfer.status)) && (
          <Tooltip title={`Delete ${transfer.transferNo}`}>
            <IconButton onClick={handleDelete}>
              <DeleteOutlined color="error" />
            </IconButton>
          </Tooltip>
        )}
    </>
  );
};

export default InventoryTransferListItemAction;
