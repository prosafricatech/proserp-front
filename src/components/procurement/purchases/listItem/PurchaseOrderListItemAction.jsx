import React, { lazy, useState } from 'react';
import {
  Tooltip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogContent,
  Box,
  Tab,
  Tabs,
  DialogActions,
  Button,
  useMediaQuery,
  DialogTitle,
  Grid,
} from '@mui/material';
import {
  AssignmentTurnedInOutlined,
  AttachmentOutlined,
  CancelOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  RestoreOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import purchaseServices from '../purchase-services';
import PurchaseOrderPDF from '../PurchaseOrderPDF';
import PDFContent from '../../../pdf/PDFContent';
import PurchaseOrderOnScreenPreview from '../PurchaseOrderOnScreenPreview';
import CloseOrReopenForm from './CloseOrReopenForm';
import PurchaseGrnsReportPDF from './purchaseGrnsReport/PurchaseGrnsReportPDF';
import PurchaseGrnsReportOnScreen from './purchaseGrnsReport/PurchaseGrnsReportOnScreen';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
const PurchaseOrderReceiveForm = lazy(() => import('./receive/PurchaseOrderReceiveForm'));
const PurchaseOrderDialogForm = lazy(() => import('../purchaseOrderForm/PurchaseOrderDialogForm'));

const PurchaseGrnsReport = ({ organization, order, setOpenPurchasesGrnsReport }) => {
  const { data: purchaseGrnsReport, isFetching } = useQuery({
    queryKey: ['PurchaseGrnsReport', { orderId: order.id }],
    queryFn: () => purchaseServices.PurchaseGrnsReport(order.id),
  });
  const [activeTab, setActiveTab] = useState(0);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <DialogTitle>
        { belowLargeScreen &&
          <Tabs value={activeTab} onChange={handleChange} aria-label="purchase order tabs">
            <Tab label="ONSCREEN"/>
            <Tab label="PDF"/>
          </Tabs>
        }
      </DialogTitle>
      <DialogContent>
        { 
          belowLargeScreen && activeTab === 0 ?
          <PurchaseGrnsReportOnScreen order={order} organization={organization} purchaseGrnsReport={purchaseGrnsReport}/>
          :
          <PDFContent fileName={`${purchaseGrnsReport.orderNo} GRNs Report`} document={<PurchaseGrnsReportPDF organization={organization} purchaseGrnsReport={purchaseGrnsReport} />} />
        }
      </DialogContent>
      {belowLargeScreen &&
        <DialogActions>
          <Box textAlign="right" marginTop={5}>
            <Button variant="outlined" size='small' color="primary" onClick={() => setOpenPurchasesGrnsReport(false)}>
              Cancel
            </Button>
          </Box>
        </DialogActions>
      }
    </>
  );
};

const EditPurchaseOrdeDialog = ({order,toggleOpen}) => {
  const { data: editOrder, isFetching } = useQuery({
    queryKey: ['editPurchaseOrder', { id: order.id }],
    queryFn: () => purchaseServices.getEditComplements(order.id),
  });

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <PurchaseOrderDialogForm toggleOpen={toggleOpen} order={editOrder} />
  )
}

const DocumentDialog = ({ order_id, organization,checkOrganizationPermission, setOpenDocumentDialog }) => {
  const { data: order, isFetching } = useQuery({
    queryKey: ['purchaseOrder', { id: order_id }],
    queryFn: () => purchaseServices.orderDetails(order_id),
  });
  const [activeTab, setActiveTab] = useState(0);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress/>;
  }

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <DialogTitle>
        {belowLargeScreen && (
          <Grid container alignItems="center" justifyContent="space-between" margin={1}>
            <Grid size={11}>
              <Tabs value={activeTab} onChange={handleChange} aria-label="purchase order tabs">
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
      </DialogTitle>
      <DialogContent>
        { belowLargeScreen && activeTab === 0 ?
            <PurchaseOrderOnScreenPreview order={order} organization={organization} />
          :
            <PDFContent fileName={order.orderNo} document={<PurchaseOrderPDF order={order} organization={organization} checkOrganizationPermission={checkOrganizationPermission} />} />
          }
      </DialogContent>
      {belowLargeScreen &&
        <DialogActions>
          <Box textAlign="right" marginTop={5}>
            <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
            Close
            </Button>
          </Box>
        </DialogActions>
      }
    </>
  );
};

const AttachDialog= ({order, setAttachDialog}) => {
  return (
    <AttachmentForm setAttachDialog={setAttachDialog} attachment_sourceNo={order.orderNo} attachmentable_type={'purchase_order'} attachment_name={'Purchase Order'} attachmentable_id={order.id}/>
  )
}

function PurchaseOrderListItemAction({ order }) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const [openReceiveDialog, setOpenReceiveDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [openPurchasesGrnsReport, setOpenPurchasesGrnsReport] = useState(false);
  const [openClose, setOpenClose] = useState(false);
  const [openReopen, setOpenReopen] = useState(false);
  const queryClient = useQueryClient();
  const {checkOrganizationPermission, authOrganization:{organization}} = useJumboAuth()
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteSale = useMutation({
    mutationFn: purchaseServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Receive Function component
  const ReceiveDialog = () => {
    const { data: orderDetails, isLoading } = useQuery({
      queryKey: ['purchaseOrderDetails', { id: order.id }],
      queryFn: () => purchaseServices.orderDetails(order.id),
    });

    if (isLoading) return <LinearProgress />;

    return (
      <PurchaseOrderReceiveForm order={orderDetails} toggleOpen={setOpenReceiveDialog} />
    );
  };

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Purchase Order will be deleted',
      onYes: () => {
        hideDialog();
        deleteSale.mutate(order);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <React.Fragment>
      <Dialog
        open={openPurchasesGrnsReport || openEditDialog || openDocumentDialog || openReceiveDialog || attachDialog || openClose || openReopen}
        fullWidth   
        fullScreen={belowLargeScreen}
        maxWidth={ (openDocumentDialog || openPurchasesGrnsReport || attachDialog || openClose || openReopen) ? 'md' : 'xl'}
        onClose={() => {
          setOpenDocumentDialog(false);
          setOpenPurchasesGrnsReport(false);
        }}
        scroll={belowLargeScreen  ? 'body' : 'paper'}
      >
        {openEditDialog && <EditPurchaseOrdeDialog order={order} toggleOpen={setOpenEditDialog} />}
        {openPurchasesGrnsReport && <PurchaseGrnsReport order={order} organization={organization} setOpenPurchasesGrnsReport={setOpenPurchasesGrnsReport}/>}
        {openDocumentDialog && <DocumentDialog order_id={order.id} organization={organization} checkOrganizationPermission={checkOrganizationPermission} setOpenDocumentDialog={setOpenDocumentDialog}/>}
        {openReceiveDialog && <ReceiveDialog/>}
        {attachDialog && <AttachDialog order={order} setAttachDialog={setAttachDialog}/>}
        {openClose && <CloseOrReopenForm order={order} setOpenDialog={setOpenClose}/>}
        {openReopen && <CloseOrReopenForm order={order} setOpenDialog={setOpenReopen} isReOpen={true}/>}
      </Dialog>

      {!order.has_payment_requisition && (checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) || order.order_date >= dayjs().startOf('date').toISOString()) && (!order.requisition_approval_id && checkOrganizationPermission(PERMISSIONS.PURCHASES_DELETE) && (order?.status === 'Pending' || order?.status === 'Instantly Received' || order?.status === 'Completed')) && (
        <Tooltip  title={`Delete ${order.orderNo}`}>
          <IconButton onClick={handleDelete}>
            <DeleteOutlined color="error" />
          </IconButton>
        </Tooltip>
      )}

      {(checkOrganizationPermission(PERMISSIONS.PURCHASES_EDIT) && (order?.status === 'Closed')) && (
        <Tooltip  title={`Re-Open ${order.orderNo}`}>
          <IconButton onClick={() => setOpenReopen(true)}>
            <RestoreOutlined />
          </IconButton>
        </Tooltip>
      )}

      {(checkOrganizationPermission(PERMISSIONS.PURCHASES_EDIT) && (order?.status !== 'Closed')) && (
        <Tooltip  title={`Close ${order.orderNo}`}>
          <IconButton onClick={() => setOpenClose(true)} color={'info'}>
            <CancelOutlined />
          </IconButton>
        </Tooltip>
      )}

      {(
        <Tooltip title={`${order.orderNo} GRNs Report`}>
          <IconButton onClick={() => setOpenPurchasesGrnsReport(true)}>
           <FontAwesomeIcon size='xs' icon={faListCheck} />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={`${order.orderNo} Attachments`}>
        <IconButton onClick={() => setAttachDialog(true)}>
          <AttachmentOutlined/>
        </IconButton>
      </Tooltip>

      {(checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) || order.order_date >= dayjs().startOf('date').toISOString()) && (!order.requisition_approval_id && checkOrganizationPermission(PERMISSIONS.PURCHASES_EDIT) && (order?.status === 'Pending' || order?.status === 'Instantly Received' || order?.status === 'Completed')) && (
        <Tooltip title={`Edit ${order.orderNo}`}>
          <IconButton onClick={() => setOpenEditDialog(true)}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {(order?.status === 'Pending' || order?.status === 'Partially Received') && checkOrganizationPermission(PERMISSIONS.PURCHASES_RECEIVE)  && (
        <Tooltip title={`Receive ${order.orderNo}`}>
          <IconButton onClick={() => setOpenReceiveDialog(true)}>
            <AssignmentTurnedInOutlined />
          </IconButton>
        </Tooltip>
      )}

      {(
        <Tooltip title={`View ${order.orderNo}`}>
          <IconButton onClick={() => setOpenDocumentDialog(true)}>
            <VisibilityOutlined />
          </IconButton>
        </Tooltip>
      )}
    </React.Fragment>
  );
}

export default PurchaseOrderListItemAction;
