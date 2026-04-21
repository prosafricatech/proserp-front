'use client'
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { 
  AttachmentOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  HighlightOff, 
  MoreHorizOutlined,
  VisibilityOutlined 
} from '@mui/icons-material';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogContent, 
  Grid, 
  IconButton, 
  LinearProgress, 
  Tab, 
  Tabs, 
  Tooltip, 
  useMediaQuery 
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import TransferFormDialogContent from './TransferFormDialogContent';
import fundTransferServices from './fund-transfer-services';
import TransferInvoicePDF from './TransferPDF';
import TransferOnScreen from './TransferOnScreen';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { MenuItemProps } from '@jumbo/types';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { Transaction } from '../TransactionTypes';
import { AuthObject } from '@/types/auth-types';

interface DocumentDialogProps {
  transaction: Transaction;
  authObject: AuthObject;
  setOpenDocumentDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({ 
  transaction, 
  authObject, 
  setOpenDocumentDialog 
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ['transfer', transaction.id],
    queryFn: () => fundTransferServices.show(transaction.id),
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
              aria-label="transfer View Tabs"
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
      {belowLargeScreen && activeTab === 0 ? (
        <TransferOnScreen transaction={data} authObject={authObject} /> 
      ) : (
        <PDFContent
          document={<TransferInvoicePDF transaction={data} authObject={authObject} />}
          fileName={transaction.voucherNo}
        />
      )}
      {
        belowLargeScreen &&
        <Box textAlign="right" marginTop={5}>
          <Button 
            variant="outlined" 
            size="small" 
            color="primary" 
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      }
    </DialogContent>
  );
};

interface AttachDialogProps {
  transaction: Transaction;
  setAttachDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const AttachDialog: React.FC<AttachDialogProps> = ({ transaction, setAttachDialog }) => {
  return (
    <AttachmentForm 
      setAttachDialog={setAttachDialog} 
      attachment_sourceNo={transaction.voucherNo} 
      attachmentable_type={'fund_transfer'} 
      attachment_name={'Fund Transfer'} 
      attachmentable_id={transaction.id}
    />
  );
};

interface TransferItemActionProps {
  transaction: Transaction;
}

const TransferItemAction: React.FC<TransferItemActionProps> = ({ transaction }) => {
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const queryClient = useQueryClient();
  const authObject = useJumboAuth();
  const checkOrganizationPermission = authObject.checkOrganizationPermission;

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteTransfer = useMutation({
    mutationFn: fundTransferServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    (checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ, PERMISSIONS.FUND_TRANSFERS_READ]) && { 
      icon: <VisibilityOutlined/>, 
      title: 'View', 
      action: 'open' 
    }) as MenuItemProps,
    { 
      icon: <AttachmentOutlined/>, 
      title: "Attach", 
      action: "attach" 
    } as MenuItemProps,
    checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT, PERMISSIONS.FUND_TRANSFERS_EDIT]) && 
      !!transaction.editable &&
      (checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE, PERMISSIONS.FUND_TRANSFERS_BACKDATE]) || 
      transaction.transaction_date >= dayjs().startOf('date').toISOString()) ? 
      { icon: <EditOutlined/>, title: 'Edit', action: 'edit' } : null,
    checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE, PERMISSIONS.FUND_TRANSFERS_DELETE]) && 
      !!transaction.editable &&
      (checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE, PERMISSIONS.FUND_TRANSFERS_BACKDATE]) || 
      transaction.transaction_date >= dayjs().startOf('date').toISOString()) ? 
      { icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete' } : null
  ].filter((item): item is MenuItemProps => item !== null);

  const EditTransferDialog = () => {
    const { data: transfer, isFetching } = useQuery({
      queryKey: ['fundTransfer', transaction.id],
      queryFn: () => fundTransferServices.show(transaction.id),
    });
    
    if (isFetching) {
      return <LinearProgress/>;
    }
    
    return (
      <TransferFormDialogContent setOpen={setOpenEditDialog} transfer={transfer} />
    );
  };

  React.useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({ queryKey: ['fundTransfer', transaction.id] });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: 'Confirm Delete?',
          content: 'If you say yes, this transfer will be deleted',
          onYes: () => {
            hideDialog();
            deleteTransfer.mutate(transaction);
          },
          onNo: () => hideDialog(),
          variant: 'confirm'
        });
        break;
      case 'edit':
        setOpenEditDialog(true);
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
  };

  return (
    <React.Fragment>
      <Dialog
        open={openEditDialog || openDocumentDialog || attachDialog}
        scroll={'paper'}
        onClose={() => {
          if (openDocumentDialog) setOpenDocumentDialog(false);
        }}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openEditDialog ? 'lg' : 'md'}
      >
        {openEditDialog && (
          checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT, PERMISSIONS.FUND_TRANSFERS_EDIT]) ? 
            <EditTransferDialog/> : 
            <UnauthorizedAccess/>
        )}
        {openDocumentDialog && (
          checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ, PERMISSIONS.FUND_TRANSFERS_READ]) ? 
            <DocumentDialog 
              setOpenDocumentDialog={setOpenDocumentDialog} 
              transaction={transaction} 
              authObject={authObject as unknown as AuthObject}
            /> : 
            <UnauthorizedAccess/>
        )}
        {attachDialog && (
          <AttachDialog 
            transaction={transaction} 
            setAttachDialog={setAttachDialog}
          />
        )}
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
};

export default TransferItemAction;