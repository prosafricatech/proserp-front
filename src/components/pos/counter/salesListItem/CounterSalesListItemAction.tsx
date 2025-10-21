import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
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
import React, { Suspense, useState } from 'react';
import { 
  AttachmentOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  HighlightOff, 
  ReceiptLongOutlined, 
  VisibilityOutlined 
} from '@mui/icons-material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import posServices from '../../pos-services';
import dayjs from 'dayjs';
import SalePDF from '../SalePDF';
import { SalesOrder } from '../SalesOrderType';
import { Organization, User } from '@/types/auth-types';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import PDFContent from '@/components/pdf/PDFContent';
import { useCounter } from '../CounterProvider';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

const SaleReceipt = React.lazy(() => import('../saleReceipt/SaleReceipt'));
const SaleDialogForm = React.lazy(() => import('../saleForm/SaleDialogForm'));
const SalePreviewOnscreen = React.lazy(() => import('../../onScreenPreviews/SalePreviewOnscreen'));
const ReceiptPreviewOnScreen = React.lazy(() => import('../../onScreenPreviews/ReceiptPreviewOnScreen'));

interface DocumentDialogContentProps {
  organization: Organization;
  saleId?: number;
  setOpenDocumentDialog: (open: boolean) => void;
}

const DocumentDialogContent: React.FC<DocumentDialogContentProps> = ({ 
  organization, 
  saleId, 
  setOpenDocumentDialog 
}) => {
  const [thermalPrinter, setThermalPrinter] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [pdfKey, setPdfKey] = useState(0); // Force remount when changing format
  
  const { data: sale, isFetching } = useQuery({
    queryKey: ['sale', { id: saleId }],
    queryFn: () => posServices.saleDetails(saleId),
  });

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setThermalPrinter(false); // Reset format when switching tabs
    setPdfKey(prev => prev + 1); // Force PDF remount
  };

  const handleThermalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThermalPrinter(e.target.checked);
    setPdfKey(prev => prev + 1); // Force PDF remount when changing format
  };

  if (isFetching) return <BackdropSpinner />;
  if (!sale) return null;

  return (
    <>
      {belowLargeScreen && (
        <DialogTitle sx={{ p: 2 }}>
          <Grid container alignItems="center">
            <Grid size={11}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab label="ONSCREEN" />
                <Tab label="PDF" />
              </Tabs>
            </Grid>
            <Grid size={1} textAlign="right">
              <IconButton 
                size="small" 
                onClick={() => setOpenDocumentDialog(false)}
              >
                <HighlightOff />
              </IconButton>
            </Grid>
          </Grid>
        </DialogTitle>
      )}

      <DialogContent dividers>
        {belowLargeScreen && activeTab === 0 ? (
          <Suspense fallback={<BackdropSpinner />}>
            <SalePreviewOnscreen organization={organization} sale={sale}/>
          </Suspense>
        ) : (
          <Box sx={{ minHeight: '300px' }}>
            <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
              <Typography variant="body2">A4</Typography>
              <Switch 
                checked={thermalPrinter}
                onChange={handleThermalToggle}
                color="primary"
                sx={{ mx: 1 }}
              />
              <Typography variant="body2">80mm</Typography>
            </Box>
            
            <Suspense fallback={<BackdropSpinner />}>
              <PDFContent
                key={`pdf-${pdfKey}`}
                fileName={`${sale.saleNo}_${thermalPrinter ? '80mm' : 'A4'}`}
                document={
                  <SalePDF 
                    thermalPrinter={thermalPrinter} 
                    organization={organization} 
                    sale={sale} 
                  />
                }
              />
            </Suspense>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          variant="outlined"
          onClick={() => setOpenDocumentDialog(false)}
          sx={{ mt: 1, mb: 1 }}
        >
          Close
        </Button>
      </DialogActions>
    </>
  );
};

interface AttachDialogProps {
  sale: SalesOrder;
  setAttachDialog: (open: boolean) => void;
}

const AttachDialog: React.FC<AttachDialogProps> = ({ sale, setAttachDialog }) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog} 
      attachment_sourceNo={sale.saleNo} 
      attachmentable_type={'sale'} 
      attachment_name={'Sale'} 
      attachmentable_id={sale.id as number}
    />
  );
};

interface ReceiptProps {
  organization: Organization;
  saleId?: number;
  user: User;
  setOpenReceiptDialog: (open: boolean) => void;
}

const Receipt: React.FC<ReceiptProps> = ({ 
  organization, 
  saleId, 
  user, 
  setOpenReceiptDialog 
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { data: sale, isFetching } = useQuery({
    queryKey: ['sale', { id: saleId }],
    queryFn: () => posServices.saleDetails(saleId)
  });
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isFetching) {
    return <BackdropSpinner />;
  }

  if (!sale) return null;

  return (
    <Box>
      {belowLargeScreen &&
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Onscreen" />
          <Tab label="Receipt" />
        </Tabs>
      }
      <Suspense fallback={<BackdropSpinner />}>
        {belowLargeScreen && activeTab === 0 ? 
          <ReceiptPreviewOnScreen 
            setOpenReceiptDialog={setOpenReceiptDialog} 
            organization={organization} 
            sale={sale} 
          />
          :
          <SaleReceipt 
            organization={organization} 
            setOpenReceiptDialog={setOpenReceiptDialog} 
            sale={sale} 
            user={user} 
          />
        }
      </Suspense>
    </Box>
  );
};

interface EditSalesProps {
  saleId?: number;
  toggleOpen: (open: boolean) => void;
}

const EditSales: React.FC<EditSalesProps> = ({ saleId, toggleOpen }) => {
  const { data: sale, isFetching } = useQuery({
    queryKey: ['sale', { id: saleId }],
    queryFn: () => posServices.saleDetails(saleId)
  });

  if (isFetching) {
    return <BackdropSpinner />;
  }

  if (!sale) return null;

  return (
    <Suspense fallback={<BackdropSpinner />}>
      <SaleDialogForm toggleOpen={toggleOpen} sale={sale} />
    </Suspense>
  );
};

interface CounterSalesListItemActionProps {
  sale: SalesOrder;
  openDispatchDialog?: boolean;
  setOpenDispatchDialog?: (open: boolean) => void;
}

const CounterSalesListItemAction: React.FC<CounterSalesListItemActionProps> = ({ 
  sale
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [attachDialog, setAttachDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  const queryClient = useQueryClient();
  const { 
    authOrganization, 
    checkOrganizationPermission, 
    authUser
  } = useJumboAuth();

  const organization = authOrganization?.organization;
  const user = authUser?.user;
  const {activeCounter} = useCounter();

  const deleteSale = useMutation({
    mutationFn: posServices.deleteSale,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['counterSales'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Sale will be deleted',
      onYes: () => {
        hideDialog();
        deleteSale.mutate(sale);
      },
      onNo: () => hideDialog(),
      variant: 'confirm'
    });
  };

  return (
    <React.Fragment>
      <Dialog
        open={openEditDialog || openDocumentDialog || openReceiptDialog || attachDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openDocumentDialog || attachDialog ? 'md' : openReceiptDialog ? 'sm' : 'lg'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => {
          setOpenReceiptDialog(false);
          setOpenDocumentDialog(false);
          setOpenEditDialog(false);
          setAttachDialog(false);
        }}
      >
        {openEditDialog && (
          checkOrganizationPermission([PERMISSIONS.SALES_EDIT]) ? 
            <EditSales saleId={sale.id} toggleOpen={setOpenEditDialog} /> : 
            <UnauthorizedAccess/>
        )}
        {openDocumentDialog && (
          checkOrganizationPermission(PERMISSIONS.SALES_READ) ? 
            <DocumentDialogContent 
              organization={organization as Organization} 
              saleId={sale.id} 
              setOpenDocumentDialog={setOpenDocumentDialog}
            /> : 
            <UnauthorizedAccess/>
        )}
        {attachDialog && <AttachDialog sale={sale} setAttachDialog={setAttachDialog}/>}
        {openReceiptDialog && (
          checkOrganizationPermission(PERMISSIONS.SALES_CREATE) ? 
            <Receipt 
              setOpenReceiptDialog={setOpenReceiptDialog} 
              organization={organization as Organization}
              saleId={sale.id} 
              user={user as User}
            /> : 
            <UnauthorizedAccess/>
        )}
      </Dialog>

      {!!sale.is_instant_sale && !sale.is_invoiced && (checkOrganizationPermission(PERMISSIONS.SALES_CREATE)) && sale.status === 'Complete' && (
        <Tooltip title={`Receipt ${sale.saleNo}`}>
          <IconButton onClick={() => setOpenReceiptDialog(true)}>
            <ReceiptLongOutlined/>
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={`View ${sale.saleNo}`}>
        <IconButton onClick={() => setOpenDocumentDialog(true)}>
          <VisibilityOutlined/>
        </IconButton>
      </Tooltip>

      <Tooltip title={`${sale.saleNo} Attachments`}>
        <IconButton onClick={() => setAttachDialog(true)}>
          <AttachmentOutlined/>
        </IconButton>
      </Tooltip>

      {activeCounter?.id !== 'all' && checkOrganizationPermission(PERMISSIONS.SALES_EDIT) && !sale.vfd_receipt && !sale.is_invoiced && (
        <Tooltip title={`Edit ${sale.saleNo}`}>
          <IconButton onClick={() => setOpenEditDialog(true)}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {checkOrganizationPermission(PERMISSIONS.SALES_DELETE) && (
        checkOrganizationPermission(PERMISSIONS.SALES_BACKDATE) || 
        sale.transaction_date >= dayjs().startOf('date').toISOString() || 
        sale.status === 'Pending' || 
        sale.status === 'Ordered'
      ) && !sale.vfd_receipt && !sale.is_invoiced && !(
        sale.status === 'Partially Fulfilled' || 
        sale.status === 'Fulfilled' || 
        sale.status === 'Over Fulfilled'
      ) && (
        <Tooltip title={`Delete ${sale.saleNo}`}>
          <IconButton onClick={handleDelete}>
            <DeleteOutlined color="error" />
          </IconButton>
        </Tooltip>
      )}
    </React.Fragment>
  );
};

export default React.memo(CounterSalesListItemAction);