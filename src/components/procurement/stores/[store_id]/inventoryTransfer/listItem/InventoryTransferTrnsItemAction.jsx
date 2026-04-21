'use client'
import React, { useContext, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { HighlightOff } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { listItemContext } from './InventoryTransferListItem';
import inventoryTransferServices from '../inventoryTransfer-services';
import InventoryTransferTrnOnScreen from '../InventoryTransferTrnOnScreen';
import InventoryTransferTrnPDF from '../InventoryTransferTrnPDF';
import PDFContent from '@/components/pdf/PDFContent';

// --- Extracted Component ---
const DocumentDialog = ({ transferTrn, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const { authOrganization } = useJumboAuth();
  const belowLargeScreen = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const { data: trn, isPending } = useQuery({
    queryKey: ['trns', { id: transferTrn.id }],
    queryFn: () => inventoryTransferServices.trnDetails(transferTrn.id),
  });

  const handleChangeTab = (_, newValue) => setActiveTab(newValue);

  return (
    <>
      <DialogTitle>
        {belowLargeScreen && (
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={11}>
              <Tabs value={activeTab} onChange={handleChangeTab}>
                <Tab label="ONSCREEN" />
                <Tab label="PDF" />
              </Tabs>
            </Grid>
            <Grid item xs={1} textAlign="right">
              <Tooltip title="Close">
                <IconButton size="small" onClick={onClose}>
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}
      </DialogTitle>

      <DialogContent>
        {isPending ? (
          <LinearProgress />
        ) : belowLargeScreen && activeTab === 0 ? (
          <InventoryTransferTrnOnScreen trn={trn} organization={authOrganization.organization} />
        ) : (
          <PDFContent
            fileName={trn.trnNo}
            document={<InventoryTransferTrnPDF trn={trn} organization={authOrganization.organization} />}
          />
        )}
      </DialogContent>

      {belowLargeScreen && (
        <DialogActions>
          <Box textAlign="right" width="100%">
            <Button variant="outlined" size="small" onClick={onClose}>
              Close
            </Button>
          </Box>
        </DialogActions>
      )}
    </>
  );
};

// --- Main Component ---
const InventoryTransferTrnsItemAction = () => {
  const {
    openDialog, setOpenDialog,
    selectedInventoryTrn, setSelectedInventoryTrn,
    openDocumentDialog, setOpenDocumentDialog,
    setExpanded,
  } = useContext(listItemContext);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const belowLargeScreen = useMediaQuery(useJumboTheme().theme.breakpoints.down('lg'));

  const unReceiveTrn = useMutation({
    mutationFn: inventoryTransferServices.unReceiveTrn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryTrns'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      setExpanded(prev => !prev);
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Something went wrong.', { variant: 'error' });
    },
  });

  const handleConfirmUnreceive = () => {
    if (selectedInventoryTrn) {
      unReceiveTrn.mutate(selectedInventoryTrn.id);
      setOpenDialog(false);
      setSelectedInventoryTrn(null);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInventoryTrn(null);
  };

  return (
    <>
      {/* Unreceive Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Unreceive Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unreceive this transaction?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmUnreceive}>Yes</Button>
        </DialogActions>
      </Dialog>

      {/* PDF / Onscreen Dialog */}
      <Dialog
        open={openDocumentDialog}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth="md"
        onClose={() => setOpenDocumentDialog(false)}
      >
        {selectedInventoryTrn && (
          <DocumentDialog
            transferTrn={selectedInventoryTrn}
            onClose={() => setOpenDocumentDialog(false)}
          />
        )}
      </Dialog>
    </>
  );
};

export default InventoryTransferTrnsItemAction;
