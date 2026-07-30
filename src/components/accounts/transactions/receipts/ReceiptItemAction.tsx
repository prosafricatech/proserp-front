'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { AuthObject } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  AttachmentOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Skeleton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { Transaction } from '../TransactionTypes';
import receiptServices from './receipt-services';
import ReceiptFormDialogContent from './ReceiptFormDialogContent';
import ReceiptOnScreen from './ReceiptOnScreen';
import ReceiptInvoicePDF from './ReceiptPDF';

interface DocumentDialogProps {
  transaction: Transaction;
  authObject: AuthObject;
  setOpenDocumentDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  transaction,
  authObject,
  setOpenDocumentDialog,
}) => {
  const { data, isFetching } = useQuery({
    queryKey: ['receipt', transaction.id],
    queryFn: () => receiptServices.show(transaction.id),
  });
  const [showOnScreen, setShowOnScreen] = useState(true);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton
          variant='text'
          width={180}
          height={32}
          style={{ borderRadius: 4, marginLeft: 'auto' }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={48}
          style={{ borderRadius: 4 }}
        />
        <Skeleton
          variant='rectangular'
          width='100%'
          height={32}
          style={{ borderRadius: 4 }}
        />
      </div>
    );
  }

  return (
    <DialogContent>
      <PreviewTopBar
        fileExportGrid={
          <FileExportGrid
            exportPdf
            handlePdf={() => {
              setShowOnScreen((prev) => !prev);
            }}
          />
        }
        closeButton={
          <IconButton
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            <HighlightOff color='primary' />
          </IconButton>
        }
      />
      {showOnScreen ? (
        <ReceiptOnScreen transaction={data} authObject={authObject} />
      ) : (
        <PDFContent
          document={
            <ReceiptInvoicePDF transaction={data} authObject={authObject} />
          }
          fileName={transaction.voucherNo}
        />
      )}
      {belowLargeScreen && (
        <Box textAlign='right' marginTop={5}>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      )}
    </DialogContent>
  );
};

interface AttachDialogProps {
  transaction: Transaction;
  setAttachDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const AttachDialog: React.FC<AttachDialogProps> = ({
  transaction,
  setAttachDialog,
}) => {
  return (
    <AttachmentForm
      setAttachDialog={setAttachDialog}
      attachment_sourceNo={transaction.voucherNo}
      attachmentable_type={'receipt'}
      attachment_name={'Receipt Voucher'}
      attachmentable_id={transaction.id}
    />
  );
};

interface ReceiptItemActionProps {
  transaction: Transaction;
}

const ReceiptItemAction: React.FC<ReceiptItemActionProps> = ({
  transaction,
}) => {
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

  const deleteReceipt = useMutation({
    mutationFn: receiptServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_MASTERS_READ,
      PERMISSIONS.RECEIPTS_READ,
    ]) && {
      icon: <VisibilityOutlined />,
      title: 'View',
      action: 'open',
    }) as MenuItemProps,
    {
      icon: <AttachmentOutlined />,
      title: 'Attach',
      action: 'attach',
    } as MenuItemProps,
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
      PERMISSIONS.RECEIPTS_EDIT,
    ]) &&
    !!transaction.editable &&
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.RECEIPTS_BACKDATE,
    ]) ||
      transaction.transaction_date >= dayjs().startOf('date').toISOString())
      ? { icon: <EditOutlined />, title: 'Edit', action: 'edit' }
      : null,
    checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
      PERMISSIONS.RECEIPTS_DELETE,
    ]) &&
    !!transaction.editable &&
    (checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE,
      PERMISSIONS.RECEIPTS_BACKDATE,
    ]) ||
      transaction.transaction_date >= dayjs().startOf('date').toISOString())
      ? {
          icon: <DeleteOutlined color='error' />,
          title: 'Delete',
          action: 'delete',
        }
      : null,
  ].filter((item): item is MenuItemProps => item !== null);

  const EditReceiptDialog = () => {
    const { data: receipt, isFetching } = useQuery({
      queryKey: ['receipt', transaction.id],
      queryFn: () => receiptServices.show(transaction.id),
    });

    if (isFetching) {
      return (
        <div style={{ width: '100%', padding: '16px' }}>
          <Skeleton
            variant='text'
            width={180}
            height={32}
            style={{ borderRadius: 4, marginLeft: 'auto' }}
          />
          <Skeleton
            variant='rectangular'
            width='100%'
            height={48}
            style={{ borderRadius: 4 }}
          />
          <Skeleton
            variant='rectangular'
            width='100%'
            height={32}
            style={{ borderRadius: 4 }}
          />
        </div>
      );
    }

    return (
      <ReceiptFormDialogContent setOpen={setOpenEditDialog} receipt={receipt} />
    );
  };

  React.useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({ queryKey: ['receipt', transaction.id] });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: 'Confirm Delete?',
          content: 'If you say yes, this receipt will be deleted',
          onYes: () => {
            hideDialog();
            deleteReceipt.mutate(transaction);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
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
        {openEditDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
            PERMISSIONS.RECEIPTS_EDIT,
          ]) ? (
            <EditReceiptDialog />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDocumentDialog &&
          (checkOrganizationPermission([
            PERMISSIONS.ACCOUNTS_MASTERS_READ,
            PERMISSIONS.RECEIPTS_READ,
          ]) ? (
            <DocumentDialog
              setOpenDocumentDialog={setOpenDocumentDialog}
              transaction={transaction}
              authObject={authObject as unknown as AuthObject}
            />
          ) : (
            <UnauthorizedAccess />
          ))}
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
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
};

export default ReceiptItemAction;
