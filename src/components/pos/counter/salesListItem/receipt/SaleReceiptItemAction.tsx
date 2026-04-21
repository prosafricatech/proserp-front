'use client'
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
import SaleReceiptForm from './SaleReceiptForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PDFContent from '@/components/pdf/PDFContent';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import ReceiptPDF from '@/components/accounts/transactions/receipts/ReceiptPDF';
import { Organization } from '@/types/auth-types';

interface Receipt {
  id: string;
  voucherNo: string;
  transaction_date: string;
  narration?: string;
  debit_ledger?: {
    name: string;
  };
  amount: number;
  currency: {
    code: string;
  };
}

interface DocumentDialogProps {
  receipt: Receipt;
  organization?: Organization;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({ receipt }) => {
  const authObject = useJumboAuth();

  const { data: receiptData, isLoading } = useQuery({
    queryKey: ['receipts', { id: receipt.id }],
    queryFn: async () => posServices.receiptDetails(receipt.id)
  });
  
  if (isLoading) {
    return <LinearProgress />;
  }
  
  return (
    <DialogContent>
      <PDFContent 
        fileName={`Receipt ${receipt.voucherNo}`} 
        document={<ReceiptPDF transaction={receiptData} authObject={authObject as any}/>}
      />
    </DialogContent>
  );
};

interface AttachDialogProps {
  receipt: Receipt;
  setAttachDialog: (open: boolean) => void;
}

const AttachDialog: React.FC<AttachDialogProps> = ({ receipt, setAttachDialog }) => {
  return (
    <AttachmentForm 
      setAttachDialog={setAttachDialog} 
      attachment_sourceNo={receipt.voucherNo} 
      attachmentable_type={'receipt'} 
      attachment_name={'Receipt'} 
      attachmentable_id={Number(receipt.id)}
    />
  );
};

interface EditReceiptProps {
  receipt: Receipt;
  toggleOpen: (open: boolean) => void;
}

const EditReceipt: React.FC<EditReceiptProps> = ({ receipt, toggleOpen }) => {
  const { data: receiptData, isFetching } = useQuery({
    queryKey: ['receipt', { id: receipt.id }],
    queryFn: async () => posServices.receiptDetails(receipt.id)
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <SaleReceiptForm toggleOpen={toggleOpen} sale={receiptData} />
  );
};

interface SaleReceiptItemActionProps {
  attachDialog: boolean;
  setAttachDialog: (open: boolean) => void;
  selectedReceipt: Receipt | null;
  setSelectedReceipt: (receipt: Receipt | null) => void;
  openReceiptEditDialog: boolean;
  setOpenReceiptEditDialog: (open: boolean) => void;
  openReceiptDeleteDialog: boolean;
  setOpenReceiptDeleteDialog: (open: boolean) => void;
  openDocumentDialog: boolean;
  setOpenDocumentDialog: (open: boolean) => void;
}

const SaleReceiptItemAction: React.FC<SaleReceiptItemActionProps> = ({
  attachDialog,
  setAttachDialog,
  selectedReceipt,
  setSelectedReceipt,
  openReceiptEditDialog,
  setOpenReceiptEditDialog,
  openReceiptDeleteDialog,
  setOpenReceiptDeleteDialog,
  openDocumentDialog,
  setOpenDocumentDialog
}) => {
  const { authOrganization } = useJumboAuth();
  const organization  = authOrganization;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteReceipt } = useMutation({
    mutationFn: posServices.deleteReceipt,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['SaleReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  return (
    <React.Fragment>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openReceiptDeleteDialog}>
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to Delete this Receipt?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setSelectedReceipt(null); 
              setOpenReceiptDeleteDialog(false);
            }} 
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedReceipt) {
                deleteReceipt(selectedReceipt.id);
                setSelectedReceipt(null);
                setOpenReceiptDeleteDialog(false);
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
        open={openDocumentDialog || openReceiptEditDialog || attachDialog}
        scroll={(belowLargeScreen || !openDocumentDialog) ? 'body' : 'paper'}
        fullWidth
        fullScreen={(!!openReceiptEditDialog || attachDialog) && belowLargeScreen}
        maxWidth={'md'}
        onClose={() => setOpenDocumentDialog(false)}
      >
        {openDocumentDialog && selectedReceipt && (
          <DocumentDialog receipt={selectedReceipt} organization={organization as any}/>
        )}
        {openReceiptEditDialog && selectedReceipt && (
          <EditReceipt receipt={selectedReceipt} toggleOpen={setOpenReceiptEditDialog}/>
        )}
        {attachDialog && selectedReceipt && (
          <AttachDialog receipt={selectedReceipt} setAttachDialog={setAttachDialog}/>
        )}
      </Dialog>
    </React.Fragment>
  );
};

export default SaleReceiptItemAction;