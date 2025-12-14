'use client'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import posServices from '../../pos-services';
import { HighlightOff } from '@mui/icons-material';
import DispatchPDF from './dispatch/PDFs/DispatchPDF';
import DeliveryNotePDF from './dispatch/PDFs/DeliveryNotePDF';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Organization } from '@/types/auth-types';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import PDFContent from '@/components/pdf/PDFContent';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

// Lazy loaded components
const SalesDispatchForm = React.lazy(() => import('./dispatch/SalesDispatchForm'));
const DispatchOnScreen = React.lazy(() => import('./dispatch/DispatchOnScreen'));
const DeliveryNoteOnScreen = React.lazy(() => import('./dispatch/DeliveryNoteOnScreen'));

interface DeliveryNote {
  id: string;
  deliveryNo: string;
  dispatch_date: string;
  dispatch_from: string;
  destination: string;
  driver_information?: string;
  vehicle_information?: string;
  remarks?: string;
  is_invoiced: boolean;
}

interface DocumentDialogProps {
  deliveryNote: DeliveryNote;
  organization: Organization;
  openDispatchPreview?: boolean;
  setOpenDocumentDialog: (open: boolean) => void;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({ 
  deliveryNote, 
  organization, 
  openDispatchPreview = false, 
  setOpenDocumentDialog 
}) => {
  const [thermalPrinter, setThermalPrinter] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: deliveryNoteData, isLoading } = useQuery({
    queryKey: ['deliveryNotes', { id: deliveryNote.id }],
    queryFn: async () => posServices.deliveryNoteDetails(deliveryNote.id),
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return <BackdropSpinner />;
  }

  return (
    <>
      {
        !openDispatchPreview ? (
          <DialogTitle>
            <Grid container alignItems="center" justifyContent="space-between">
              {(!belowLargeScreen || (belowLargeScreen && activeTab === 1)) && (
                <Grid size={belowLargeScreen ? 11 : 12}>
                  <Box display="flex" alignItems="center" justifyContent="flex-start">
                    <Typography variant="body1" style={{ marginRight: 8 }}>
                      A4
                    </Typography>
                    <Switch
                      checked={thermalPrinter}
                      onChange={(e) => setThermalPrinter(e.target.checked)}
                    />
                    <Typography variant="body1" style={{ marginLeft: 8 }}>
                      80mm
                    </Typography>
                  </Box>
                </Grid>
              )}

              {belowLargeScreen && (
                <Grid size={belowLargeScreen && activeTab === 0 ? 12 : 1} textAlign="right">
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      onClick={() => setOpenDocumentDialog(false)}
                    >
                      <HighlightOff color="primary" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )}

              {belowLargeScreen && (
                <Grid size={12}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                  >
                    <Tab label="On Screen" />
                    <Tab label="PDF" />
                  </Tabs>
                </Grid>
              )}
            </Grid>
          </DialogTitle>
        ) : (
          <DialogTitle>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={12}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  { belowLargeScreen &&
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      indicatorColor="primary"
                      textColor="primary"
                    >
                      <Tab label="On Screen" />
                      <Tab label="PDF" />
                    </Tabs>
                  }

                  {belowLargeScreen &&
                    <Tooltip title="Close">
                      <IconButton
                        size="small"
                        onClick={() => setOpenDocumentDialog(false)}
                      >
                        <HighlightOff color="primary" />
                      </IconButton>
                    </Tooltip>
                  }
                </Box>
              </Grid>
            </Grid>
          </DialogTitle>
        )
      }
      <DialogContent>
        <Box>
          {belowLargeScreen && activeTab === 0 ? (
            openDispatchPreview ?
              <DispatchOnScreen delivery={deliveryNoteData} organization={organization}/> :
              <DeliveryNoteOnScreen delivery={deliveryNoteData} organization={organization}/>
          ) : (
            openDispatchPreview ?
              <PDFContent fileName={`Dispatch ${deliveryNote.deliveryNo}`} document={<DispatchPDF delivery={deliveryNoteData} organization={organization}/>} /> 
              :
              <PDFContent
                key={thermalPrinter ? 'thermal' : 'a4'}
                fileName={`Delivery Note ${deliveryNote.deliveryNo}`}
                document={<DeliveryNotePDF thermalPrinter={thermalPrinter} delivery={deliveryNoteData} organization={organization} />}
              />
          )}
        {belowLargeScreen &&
          <Box textAlign="right" marginTop={5}>
            <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
            Close
            </Button>
          </Box>
        }
        </Box>
      </DialogContent>
    </>
  );
};

interface AttachDialogProps {
  deliveryNote: DeliveryNote;
  setAttachDialog: (open: boolean) => void;
}

const AttachDialog: React.FC<AttachDialogProps> = ({ deliveryNote, setAttachDialog }) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog} 
      attachment_sourceNo={deliveryNote.deliveryNo} 
      attachmentable_type={'delivery_note'} 
      attachment_name={'Delivery Note'} 
      attachmentable_id={Number(deliveryNote.id)}
    />
  );
};

interface EditDeliveryNoteProps {
  deliveryNote: DeliveryNote;
  toggleOpen: (open: boolean) => void;
}

const EditDeliveryNote: React.FC<EditDeliveryNoteProps> = ({ deliveryNote, toggleOpen }) => {
  const { data: deliveryData, isFetching } = useQuery({
    queryKey: ['deliveryNote', { id: deliveryNote.id }],
    queryFn: async () => posServices.deliveryNoteDetails(deliveryNote.id)
  });

  if (isFetching) {
    return <BackdropSpinner />;
  }

  return (
    <SalesDispatchForm toggleOpen={toggleOpen} deliveryData={deliveryData} />
  );
};

interface SaleDeliveryNotesItemActionProps {
  attachDialog: boolean;
  setAttachDialog: (open: boolean) => void;
  openDispatchPreview: boolean;
  selectedDeliveryNote: DeliveryNote | null;
  setSelectedDeliveryNote: (note: DeliveryNote | null) => void;
  openDeliveryEditDialog: boolean;
  setOpenDeliveryEditDialog: (open: boolean) => void;
  openDeliveryNoteDeleteDialog: boolean;
  setOpenDeliveryNoteDeleteDialog: (open: boolean) => void;
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (open: boolean) => void;
}

const SaleDeliveryNotesItemAction: React.FC<SaleDeliveryNotesItemActionProps> = ({
  attachDialog,
  setAttachDialog,
  openDispatchPreview,
  selectedDeliveryNote,
  setSelectedDeliveryNote,
  openDeliveryEditDialog,
  setOpenDeliveryEditDialog,
  openDeliveryNoteDeleteDialog,
  setOpenDeliveryNoteDeleteDialog,
  openDocumentDialog,
  setOpenDocumentDialog
}) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteDeliveryNote } = useMutation({
    mutationFn: posServices.deleteDeliveryNote,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['saleDeliveryNotes'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  return (
    <React.Fragment>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeliveryNoteDeleteDialog}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to Delete this Delivery Note?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => { 
              setSelectedDeliveryNote(null); 
              setOpenDeliveryNoteDeleteDialog(false); 
            }} 
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedDeliveryNote) {
                deleteDeliveryNote(selectedDeliveryNote.id);
                setSelectedDeliveryNote(null);
                setOpenDeliveryNoteDeleteDialog(false);
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
        open={openDocumentDialog || openDeliveryEditDialog || attachDialog}
        scroll={(belowLargeScreen || !openDocumentDialog) ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openDeliveryEditDialog ? 'lg' : "md"}
        onClose={() => setOpenDocumentDialog(false)}
      >
        {openDocumentDialog && selectedDeliveryNote ? (
          <DocumentDialog 
            deliveryNote={selectedDeliveryNote} 
            organization={organization as Organization} 
            openDispatchPreview={openDispatchPreview} 
            setOpenDocumentDialog={setOpenDocumentDialog}
          />
        ) : openDeliveryEditDialog && selectedDeliveryNote ? (
          <EditDeliveryNote 
            deliveryNote={selectedDeliveryNote} 
            toggleOpen={setOpenDeliveryEditDialog}
          />
        ) : attachDialog && selectedDeliveryNote ? (
          <AttachDialog 
            deliveryNote={selectedDeliveryNote} 
            setAttachDialog={setAttachDialog}
          />
        ) : null}
      </Dialog>
    </React.Fragment>
  );
};

export default SaleDeliveryNotesItemAction;