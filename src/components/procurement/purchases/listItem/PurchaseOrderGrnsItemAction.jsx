'use client'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react'
import grnServices from '../../grns/grn-services';
import { useCurrencySelect } from '../../../masters/Currencies/CurrencySelectProvider';
import PDFContent from '../../../pdf/PDFContent';
import GrnPDF from '../../grns/GrnPDF';
import purchaseServices from '../purchase-services';
import { useSnackbar } from 'notistack';
import { useContext } from 'react';
import { listItemContext } from './PurchaseOrderListItem';
import GrnOnScreenPreview from '../../grns/GrnOnScreenPreview';
import { HighlightOff } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';

const DocumentDialog = ({ orderGrn, organization, checkOrganizationPermission, setOpenDocumentDialog }) => {
    const { currencies } = useCurrencySelect();
    const baseCurrency = currencies.find((currency) => !!currency?.is_base);
    
    const { data: grn, isFetching } = useQuery({
      queryKey: ['grns', { id: orderGrn.id }],
      queryFn: () => grnServices.grnDetails(orderGrn.id),
    });

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
    
    const [activeTab, setActiveTab] = useState(0);
  
    if (isFetching) {
      return <LinearProgress />;
    }
  
    const handleTabChange = (e, newValue) => {
      setActiveTab(newValue);
    };
  
    return (
      <DialogContent>
        {belowLargeScreen && (
          <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
            <Grid size={11}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="grn tabs">
                  <Tab label="ONSCREEN" />
                  <Tab label="PDF" />
                </Tabs>
            </Grid>
            <Grid size={1} textAlign="right">
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  onClick={() => setOpenDocumentDialog(false)}
                >
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}
        { belowLargeScreen && activeTab === 0 ?
            <GrnOnScreenPreview grn={grn} baseCurrency={baseCurrency} organization={organization} checkOrganizationPermission={checkOrganizationPermission}/>
          :
            <PDFContent fileName={grn.grnNo} document={<GrnPDF grn={grn} baseCurrency={baseCurrency} organization={organization} checkOrganizationPermission={checkOrganizationPermission}/>}/>
          }
        {belowLargeScreen &&
          <Box textAlign="right" marginTop={5}>
            <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
            Close
            </Button>
          </Box>
        }
      </DialogContent>
    );
  };

const AttachDialog = ({orderGrn, setAttachDialog}) => {
    return (
      <AttachmentForm setAttachDialog={setAttachDialog} attachment_sourceNo={orderGrn.grnNo} attachmentable_type={'grn'} attachment_name={'Grn'} attachmentable_id={orderGrn.id}/>
    )
}

function PurchaseOrderGrnsItemAction() {
    const {authOrganization,checkOrganizationPermission} = useJumboAuth();
    const {organization} = authOrganization;
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const {attachDialog, setAttachDialog, setExpanded,expanded,openDialog,setSelectedOrderGrn,selectedOrderGrn,setOpenDialog,openDocumentDialog,setOpenDocumentDialog} = useContext(listItemContext);

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: unReceiveGrn }  = useMutation({
    mutationFn: purchaseServices.unReceiveOrderGrn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      setExpanded(prev => !prev);
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  return (
    <React.Fragment>
      {/* Confirmation Dialog */}
        <Dialog open={openDialog}>
            <DialogTitle>Unreceive Confirmation</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to unreceive this Grn?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { setSelectedOrderGrn(null); setOpenDialog(false); }} color="primary">
                    Cancel
                </Button>
                <Button
                  onClick={() => {
                  if (selectedOrderGrn) {
                    unReceiveGrn(selectedOrderGrn.id);
                    setSelectedOrderGrn(null);
                    setOpenDialog(false);
                  }
                  }}
                  color="primary"
                >
                  Yes
                </Button>
            </DialogActions>
        </Dialog>

        {/* PDF Dialog */}
        <Dialog
          open={openDocumentDialog || attachDialog}
          scroll={(belowLargeScreen || !openDocumentDialog) ? 'body' : 'paper'}
          fullWidth
          fullScreen={belowLargeScreen}
          maxWidth="md"
          onClose={() => setOpenDocumentDialog(false)}
        >
          {selectedOrderGrn && openDocumentDialog && (
            <DocumentDialog orderGrn={selectedOrderGrn} checkOrganizationPermission={checkOrganizationPermission} setOpenDocumentDialog={setOpenDocumentDialog} organization={organization} />
          )}
          {selectedOrderGrn && attachDialog && <AttachDialog orderGrn={selectedOrderGrn} setAttachDialog={setAttachDialog}/>}
        </Dialog>
    </React.Fragment>
  )
}

export default PurchaseOrderGrnsItemAction