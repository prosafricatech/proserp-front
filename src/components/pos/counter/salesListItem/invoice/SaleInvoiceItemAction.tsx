import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle, 
  LinearProgress, 
  useMediaQuery 
} from '@mui/material';
import React from 'react';
import { useSnackbar } from 'notistack';
import posServices from '../../../pos-services';
import SalesInvoiceEditForm from './SalesInvoiceEditForm';
import InvoicePDF from './InvoicePDF';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PDFContent from '@/components/pdf/PDFContent';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Theme } from '@mui/material/styles';
import { Organization } from '@/types/auth-types';
import { Invoice } from '../SaleInvoices';
import SalesInvoiceAdjustment from './saleAdjustment/form/SalesInvoiceAdjustment';

interface SaleInvoiceItemActionProps {
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  openInvoiceEditDialog: boolean;
  setOpenInvoiceEditDialog: (open: boolean) => void;
  openInvoiceDeleteDialog: boolean;
  setOpenAdjustmentDialog: (open: boolean) => void;
  openAdjustmentDialog: boolean;
  setOpenInvoiceDeleteDialog: (open: boolean) => void;
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (open: boolean) => void;
}

const DocumentDialog = ({ invoice, organization }: { invoice: Invoice; organization: Organization }) => {
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['invoices', { id: invoice.id }],
    queryFn: async () => posServices.invoiceDetails(invoice.id)
  });
  
  if (isLoading) {
    return <LinearProgress />;
  }
  
  return (
    <DialogContent>
      <PDFContent 
        fileName={`Invoice ${invoice.invoiceNo}`} 
        document={<InvoicePDF invoice={invoiceData} organization={organization}/>}
      />
    </DialogContent>
  );
};

function InvoiceAdjustment({ invoice, toggleOpen }: { invoice: Invoice; toggleOpen: (open: boolean) => void }) {
  const { data: invoiceData, isFetching } = useQuery({
    queryKey: ['invoice', { id: invoice.id }],
    queryFn: async () => posServices.invoiceDetails(invoice.id)
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <SalesInvoiceAdjustment toggleOpen={toggleOpen} invoiceData={invoiceData} />
  );
}

const EditInvoice = ({ invoice, toggleOpen }: { invoice: Invoice; toggleOpen: (open: boolean) => void }) => {
  const { data: invoiceData, isFetching } = useQuery({
    queryKey: ['invoice', { id: invoice.id }],
    queryFn: async () => posServices.invoiceDetails(invoice.id)
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <SalesInvoiceEditForm toggleOpen={toggleOpen} invoiceData={invoiceData} />
  );
};

const SaleInvoiceItemAction: React.FC<SaleInvoiceItemActionProps> = ({
  setOpenAdjustmentDialog,
  openAdjustmentDialog,
  selectedInvoice,
  setSelectedInvoice,
  openInvoiceEditDialog,
  setOpenInvoiceEditDialog,
  openInvoiceDeleteDialog,
  setOpenInvoiceDeleteDialog,
  openDocumentDialog,
  setOpenDocumentDialog
}) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery((theme as Theme).breakpoints.down('lg'));

  const { mutate: deleteInvoice } = useMutation({
    mutationFn: posServices.deleteInvoice,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['SaleInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  return (
    <React.Fragment>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openInvoiceDeleteDialog}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to Delete this Invoice?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setSelectedInvoice(null); 
              setOpenInvoiceDeleteDialog(false); 
            }} 
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedInvoice) {
                deleteInvoice(selectedInvoice.id);
                setSelectedInvoice(null);
                setOpenInvoiceDeleteDialog(false);
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
        open={openDocumentDialog || openInvoiceEditDialog || openAdjustmentDialog}
        scroll={(belowLargeScreen || !openDocumentDialog) ? 'body' : 'paper'}
        fullWidth
        fullScreen={(!!openInvoiceEditDialog || openAdjustmentDialog) && belowLargeScreen}
        maxWidth={openDocumentDialog ? 'md' : "lg"}
        onClose={() => setOpenDocumentDialog(false)}
      >
        {(openDocumentDialog && selectedInvoice) ?
          <DocumentDialog invoice={selectedInvoice} organization={organization as Organization}/>
          :
          (openAdjustmentDialog && selectedInvoice) ? 
          <InvoiceAdjustment invoice={selectedInvoice} toggleOpen={setOpenAdjustmentDialog}/> 
          :
          selectedInvoice && <EditInvoice invoice={selectedInvoice} toggleOpen={setOpenInvoiceEditDialog}/>
        }
      </Dialog>
    </React.Fragment>
  );
};

export default SaleInvoiceItemAction;