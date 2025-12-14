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
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import SalesInvoiceAdjustment from './form/SalesInvoiceAdjustment';
import { HighlightOff } from '@mui/icons-material';
import AdjustmentOnScreen from './AdjustmentOnScreen';
import AdjustmentPDF from './AdjustmentPDF';
import posServices from '@/components/pos/pos-services';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

interface Adjustment {
  id: number;
  voucherNo?: string;
  type: 'debit' | 'credit';
}

interface DocumentDialogProps {
  selectedAdjustment: Adjustment;
  type: 'debit' | 'credit';
  authObject: any;
  setOpenDocumentDialog: (val: boolean) => void;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  selectedAdjustment,
  type,
  authObject,
  setOpenDocumentDialog,
}) => {
  const { data: adjustmentData, isFetching } = useQuery({
    queryKey: ['adjustmentsDetails', { id: selectedAdjustment.id, type }],
    queryFn: () => posServices.invoiceAdjustmentDetails(selectedAdjustment.id, type),
  });

  const [activeTab, setActiveTab] = useState(0);

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!adjustmentData) return null;

  return (
    <DialogContent>
      {belowLargeScreen && (
        <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
          <Grid size={11}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="Adjustments View Tabs">
              <Tab label="ONSCREEN" />
              <Tab label="PDF" />
            </Tabs>
          </Grid>

          <Grid size={1} textAlign="right">
            <Tooltip title="Close">
              <IconButton size="small" onClick={() => setOpenDocumentDialog(false)}>
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      )}
      {belowLargeScreen && activeTab === 0 ? (
        <AdjustmentOnScreen adjustment={adjustmentData} authObject={authObject} />
      ) : (
        <PDFContent
          fileName={`Adjustment ${adjustmentData.voucherNo}`}
          document={<AdjustmentPDF adjustment={adjustmentData} authObject={authObject} />}
        />
      )}
      <Box textAlign="right" marginTop={5}>
        <Button variant="outlined" size="small" color="primary" onClick={() => setOpenDocumentDialog(false)}>
          Close
        </Button>
      </Box>
    </DialogContent>
  );
};

interface EditSaleAdjustmentProps {
  adjustment: Adjustment;
  toggleOpen: (val: boolean) => void;
  type: 'debit' | 'credit';
}

const EditSaleAdjustment: React.FC<EditSaleAdjustmentProps> = ({ adjustment, toggleOpen, type }) => {
  const { data: adjustmentData, isFetching } = useQuery({
    queryKey: ['adjustmentdetails', { id: adjustment.id }],
    queryFn: () => posServices.invoiceAdjustmentDetails(adjustment.id, type),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  if (!adjustmentData) return null;

  return (
    <StakeholderSelectProvider>
      <SalesInvoiceAdjustment toggleOpen={toggleOpen} invoiceData={adjustmentData} isEdit={true} />
    </StakeholderSelectProvider>
  );
};

interface SaleAdjustmentActionProps {
  selectedAdjustment: Adjustment | null;
  setSelectedAdjustment: (adj: Adjustment | null) => void;
  openAdjustmentEditDialog: boolean;
  setOpenAdjustmentEditDialog: (val: boolean) => void;
  openAdjustmentDeleteDialog: boolean;
  setOpenAdjustmentDeleteDialog: (val: boolean) => void;
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (val: boolean) => void;
}

const SaleAdjustmentAction: React.FC<SaleAdjustmentActionProps> = ({
  selectedAdjustment,
  setSelectedAdjustment,
  openAdjustmentEditDialog,
  setOpenAdjustmentEditDialog,
  openAdjustmentDeleteDialog,
  setOpenAdjustmentDeleteDialog,
  openDocumentDialog,
  setOpenDocumentDialog,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const authObject = useJumboAuth();

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteSaleInvoiceAdjustment = useMutation({
    mutationFn: (payload: { id: number; type: string }) => posServices.deleteSaleInvoiceAdjustment(payload),
    onSuccess: (data: any) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['SaleInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['SaleAdjustments'] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentdetails'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message ?? 'Error deleting adjustment', { variant: 'error' });
    },
  });

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openAdjustmentDeleteDialog}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to Delete this Adjustment?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedAdjustment(null);
              setOpenAdjustmentDeleteDialog(false);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedAdjustment) {
                deleteSaleInvoiceAdjustment.mutate({
                  id: selectedAdjustment.id,
                  type: selectedAdjustment.type,
                });
                setSelectedAdjustment(null);
                setOpenAdjustmentDeleteDialog(false);
              }
            }}
            color="primary"
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAdjustmentEditDialog || openDocumentDialog}
        scroll={belowLargeScreen || !openDocumentDialog ? 'body' : 'paper'}
        fullWidth
        fullScreen={(!!openAdjustmentEditDialog || openDocumentDialog) && belowLargeScreen}
        maxWidth={openDocumentDialog ? 'md' : 'lg'}
      >
        {openAdjustmentEditDialog && selectedAdjustment && (
          <EditSaleAdjustment
            adjustment={selectedAdjustment}
            toggleOpen={setOpenAdjustmentEditDialog}
            type={selectedAdjustment?.type}
          />
        )}
        {openDocumentDialog && selectedAdjustment && (
          <DocumentDialog
            type={selectedAdjustment?.type}
            setOpenDocumentDialog={setOpenDocumentDialog}
            selectedAdjustment={selectedAdjustment}
            authObject={authObject}
          />
        )}
      </Dialog>
    </>
  );
};

export default SaleAdjustmentAction;
