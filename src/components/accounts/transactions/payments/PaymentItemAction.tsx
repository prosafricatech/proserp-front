'use client'
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { AttachmentOutlined, ContentCopyOutlined, DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react'
import paymentServices from './payment-services';
import PaymentFormDialogContent from './PaymentFormDialogContent';
import PaymentPDF from './PaymentPDF';
import PaymentOnScreenPreview from './PaymentOnScreenPreview';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import { Transaction } from '../TransactionTypes';
import { AuthObject } from '@/types/auth-types';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';

  interface DocumentDialogProps {
    transaction: Transaction;
    authObject: AuthObject;
    setOpenDocumentDialog: React.Dispatch<React.SetStateAction<boolean>>;
  }

  const DocumentDialog: React.FC<DocumentDialogProps> = ({ transaction, authObject, setOpenDocumentDialog }) => {
    const { data, isFetching } = useQuery({
      queryKey: ['payment', transaction.id],
      queryFn: () => paymentServices.show(transaction.id),
    });
    const [activeTab, setActiveTab] = useState(0);
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    if (isFetching) {
      return <LinearProgress />;
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    };

    return (
      <DialogContent>
        {belowLargeScreen && (
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid size={11}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="Payment View Tabs"
              >
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
        {belowLargeScreen && activeTab === 0 ?
          <PaymentOnScreenPreview transaction={data} authObject={authObject} /> 
          :
          <PDFContent
            fileName={transaction.voucherNo}
            document={<PaymentPDF transaction={data} authObject={authObject} />}
          />
        }
        {
          belowLargeScreen &&
          <Box textAlign="right" marginTop={5}>
            <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
              Close
            </Button>
          </Box>
        }
      </DialogContent>
    );
  };

const AttachDialog= ({transaction, setAttachDialog}:{ transaction: Transaction, setAttachDialog: React.Dispatch<React.SetStateAction<boolean>>}) => {
  return (
    <AttachmentForm setAttachDialog={setAttachDialog} attachment_sourceNo={transaction.voucherNo} attachmentable_type={'payment'} attachment_name={'Payment'} attachmentable_id={transaction.id}/>
  )
}

function PaymentItemAction({transaction}:{transaction: Transaction}) {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false)
  const {showDialog,hideDialog} = useJumboDialog();
  const {enqueueSnackbar} = useSnackbar();
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const authObject = useJumboAuth();
  const queryClient = useQueryClient();

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const checkOrganizationPermission = authObject.checkOrganizationPermission;
  
  const deletePayment = useMutation({
    mutationFn: paymentServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    (checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ, PERMISSIONS.PAYMENTS_READ]) && {icon: <VisibilityOutlined/>, title: "View", action: "open"}),
    {icon: <AttachmentOutlined/>, title: "Attach", action: "attach"},
    (checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.PAYMENTS_CREATE]) && {icon: <ContentCopyOutlined/>, title: "Duplicate", action: "duplicate"}),
    (!transaction.requisition_approval_id && checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT, PERMISSIONS.PAYMENTS_EDIT]) && 
      (checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE, PERMISSIONS.PAYMENTS_BACKDATE]) || 
      transaction.transaction_date >= dayjs().startOf('date').toISOString())) && 
      {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
    (!transaction.requisition_approval_id && checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE, PERMISSIONS.PAYMENTS_DELETE]) && 
      (checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE, PERMISSIONS.PAYMENTS_BACKDATE]) || 
      transaction.transaction_date >= dayjs().startOf('date').toISOString())) && 
      {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
  ].filter(Boolean) as MenuItemProps[];

  const EditPaymentDialog = () => {
    const { data: payment, isFetching } = useQuery({
      queryKey: ['payment', transaction.id],
      queryFn: () => paymentServices.show(transaction.id),
    });
    if(isFetching){
      return <LinearProgress/>;
    }
    return (
      <PaymentFormDialogContent setOpen={setOpenEditDialog} payment={payment} />
    );
  }

  const DuplicatePaymentDialog = () => {
    const { data: payment, isFetching } = useQuery({
      queryKey: ['payment', transaction.id],
      queryFn: () => paymentServices.show(transaction.id),
    });

    if (isFetching) {
      return <LinearProgress />;
    }

    return (
      <PaymentFormDialogContent 
        setOpen={setOpenDuplicateDialog} 
        payment={payment} 
        isDuplicate={true}
      />
    );
  }

  React.useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({ queryKey: ['payment', transaction.id] });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: 'Confirm Delete?',
          content: 'If you say yes, this payment will be deleted',
          onYes: () => {
            hideDialog();
            deletePayment.mutate(transaction);
          },
          onNo: () => hideDialog(),
          variant: 'confirm'
        });
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'duplicate':
        setOpenDuplicateDialog(true);
        break;
      case 'attach':
        setAttachDialog(true);
        break;
      case 'open':
        setOpenDocumentDialog(true);
        break;
      default:
        break;
    }
  }

  return (
    <React.Fragment>
    <Dialog
      open={openEditDialog || openDuplicateDialog || openDocumentDialog || attachDialog}
      scroll={'paper'}
      fullScreen={belowLargeScreen}
      fullWidth
      onClose={() => {
        if (openDocumentDialog) setOpenDocumentDialog(false);
      }}
      maxWidth={openEditDialog || openDuplicateDialog ? 'lg' : 'md'}
    >
      {openEditDialog && (
        checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT, PERMISSIONS.PAYMENTS_EDIT]) ? 
          <EditPaymentDialog/> : 
          <UnauthorizedAccess/>
      )}
      {openDuplicateDialog && (
        checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.PAYMENTS_CREATE]) ? 
          <DuplicatePaymentDialog/> : 
          <UnauthorizedAccess/>
      )}
      {openDocumentDialog && (
        checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ, PERMISSIONS.PAYMENTS_READ]) ? 
          <DocumentDialog 
            transaction={transaction} 
            authObject={authObject as unknown as AuthObject} 
            setOpenDocumentDialog={setOpenDocumentDialog}
          /> : 
          <UnauthorizedAccess/>
      )}
      {attachDialog && <AttachDialog transaction={transaction} setAttachDialog={setAttachDialog}/>}
    </Dialog>
      
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined/>
          </Tooltip>
      }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
}

export default PaymentItemAction