'use client'
import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
} from '@mui/material';
import {
  AttachmentOutlined,
  ContentCopyOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import JournalPDF from './JournalPDF';
import JournalOnScreen from './JournalOnScreen';
import JournalFormDialogContent from './JournalFormDialogContent';
import journalServices from './journal-services';
import PDFContent from '@/components/pdf/PDFContent';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { Transaction } from '../TransactionTypes';
import { AuthObject } from '@/types/auth-types';
import { MenuItemProps } from '@jumbo/types';

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
    queryKey: ['journal', transaction.id],
    queryFn: () => journalServices.show(transaction.id),
  });

  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) return <LinearProgress />;

  return (
    <DialogContent>
      {belowLargeScreen && (
        <Grid container alignItems="center" justifyContent="space-between" mb={2}>
          <Grid size={11}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
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
        <JournalOnScreen transaction={data} authObject={authObject} />
      ) : (
        <PDFContent document={<JournalPDF transaction={data} authObject={authObject} />} fileName={transaction.voucherNo} />
      )}
      {
        belowLargeScreen &&
        <Box textAlign="right" mt={5}>
          <Button variant="outlined" size="small" color="primary" onClick={() => setOpenDocumentDialog(false)}>
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

const AttachDialog: React.FC<AttachDialogProps> = ({ transaction, setAttachDialog }) => (
  <AttachmentForm
    setAttachDialog={setAttachDialog}
    attachment_sourceNo={transaction.voucherNo}
    attachmentable_type="journal_voucher"
    attachment_name="Journal Voucher"
    attachmentable_id={transaction.id}
  />
);

interface JournalItemActionProps {
  transaction: Transaction;
}

const JournalItemAction: React.FC<JournalItemActionProps> = ({ transaction }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { showDialog, hideDialog } = useJumboDialog();
  const authObject = useJumboAuth();
  const checkPermission = authObject.checkOrganizationPermission;

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);

  const { data: journalData, isFetching } = useQuery({
    queryKey: ['journal', transaction.id],
    queryFn: () => journalServices.show(transaction.id),
    enabled: openEditDialog || openDuplicateDialog,
  });

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteMutation = useMutation({
    mutationFn: journalServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ, PERMISSIONS.JOURNAL_VOUCHERS_READ]) && {
      icon: <VisibilityOutlined />,
      title: 'View',
      action: 'open',
    },
    {
      icon: <AttachmentOutlined />,
      title: 'Attach',
      action: 'attach',
    },
    checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.JOURNAL_VOUCHERS_CREATE]) && {
      icon: <ContentCopyOutlined />,
      title: 'Duplicate',
      action: 'duplicate',
    },
    checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT, PERMISSIONS.JOURNAL_VOUCHERS_EDIT]) &&
    (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE, PERMISSIONS.JOURNAL_VOUCHERS_BACKDATE]) ||
      transaction.transaction_date >= dayjs().startOf('day').toISOString()) && {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit',
    },
    checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE, PERMISSIONS.JOURNAL_VOUCHERS_DELETE]) &&
    (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE, PERMISSIONS.JOURNAL_VOUCHERS_BACKDATE]) ||
      transaction.transaction_date >= dayjs().startOf('day').toISOString()) && {
      icon: <DeleteOutlined color="error" />,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean) as MenuItemProps[];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: 'Confirm Delete?',
          content: 'If you say yes, this Journal will be deleted',
          onYes: () => {
            hideDialog();
            deleteMutation.mutate(transaction);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
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
    }
  };

  useEffect(() => {
    if (openEditDialog) {
      queryClient.invalidateQueries({ queryKey: ['journal', transaction.id] });
    }
  }, [openEditDialog, transaction.id, queryClient]);

  return (
    <>
      <Dialog
        open={openEditDialog || openDuplicateDialog || openDocumentDialog || attachDialog}
        scroll="paper"
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth={openEditDialog || openDuplicateDialog ? 'lg' : 'md'}
        onClose={() => {
          if (openDocumentDialog) setOpenDocumentDialog(false);
        }}
      >
        {openEditDialog &&
          (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT, PERMISSIONS.JOURNAL_VOUCHERS_EDIT]) ? (
            isFetching ? <LinearProgress /> : <JournalFormDialogContent journal={journalData} setOpen={setOpenEditDialog} isEdit isDuplicate={false} />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDuplicateDialog &&
          (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE, PERMISSIONS.JOURNAL_VOUCHERS_CREATE]) ? (
            isFetching ? <LinearProgress /> : <JournalFormDialogContent journal={journalData} setOpen={setOpenDuplicateDialog} isEdit={false} isDuplicate />
          ) : (
            <UnauthorizedAccess />
          ))}
        {openDocumentDialog &&
          (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ, PERMISSIONS.JOURNAL_VOUCHERS_READ]) ? (
            <DocumentDialog
              transaction={transaction}
              setOpenDocumentDialog={setOpenDocumentDialog}
              authObject={authObject as unknown as AuthObject}
            />
          ) : (
            <UnauthorizedAccess />
          ))}
        {attachDialog && <AttachDialog transaction={transaction} setAttachDialog={setAttachDialog} />}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title="Actions">
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default JournalItemAction;
