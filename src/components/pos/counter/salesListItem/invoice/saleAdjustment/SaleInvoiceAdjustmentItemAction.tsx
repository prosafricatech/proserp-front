'use client'
import React, { useState } from 'react';
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
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { MenuItemProps } from '@jumbo/types';
import { Transaction, TransactionTypes } from '@/components/accounts/transactions/TransactionTypes';
import SalesInvoiceAdjustment from './form/SalesInvoiceAdjustment';
import posServices from '@/components/pos/pos-services';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import AdjustmentOnScreen from './AdjustmentOnScreen';
import PDFContent from '@/components/pdf/PDFContent';
import AdjustmentPDF from './AdjustmentPDF';

interface SaleInvoiceAdjustmentItemActionProps {
  transaction: Transaction;
  type: TransactionTypes
}

interface EditAdjustmentProps {
  transaction: Transaction;
  toggleOpen: (open: boolean) => void;
  type: TransactionTypes;
}

const DocumentDialog = ({ transaction, type, authObject, setOpenDocumentDialog }: any) => {
  const {
    data: adjustmentData,
    isFetching,
  } = useQuery({
    queryKey: ["adjustmentdetails", transaction.id, type],
    queryFn: () => posServices.invoiceAdjustmentDetails(transaction.id, type),
  });
  const [activeTab, setActiveTab] = useState(0);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleTabChange = (event: any, newValue: any) => {
    setActiveTab(newValue);
  };

  return (
    <DialogContent>
      {belowLargeScreen && (
        <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
          <Grid size={11}>
            <Tabs
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="Adjustments View Tabs"
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
        <AdjustmentOnScreen adjustment={adjustmentData} authObject={authObject} /> 
        :
        <PDFContent fileName={`Adjustment ${adjustmentData.voucherNo}`} document={<AdjustmentPDF adjustment={adjustmentData} authObject={authObject}/>}/>
      }
      <Box textAlign="right" marginTop={5}>
        <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
          Close
        </Button>
      </Box>
    </DialogContent>
  );
};

const EditAdjustment: React.FC<EditAdjustmentProps> = ({ transaction, toggleOpen, type }) => {
  const {
    data: invoiceData,
    isFetching,
  } = useQuery({
    queryKey: ["adjustmentdetails", transaction.id, type],
    queryFn: () => posServices.invoiceAdjustmentDetails(transaction.id, type),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return( 
    <StakeholderSelectProvider>
        <SalesInvoiceAdjustment toggleOpen={toggleOpen} invoiceData={invoiceData} isEdit={true}/>;
    </StakeholderSelectProvider>
    )
};

const SaleInvoiceAdjustmentItemAction: React.FC<SaleInvoiceAdjustmentItemActionProps> = ({ transaction, type }) => {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { showDialog, hideDialog } = useJumboDialog();
    const authObject = useJumboAuth();
    const checkPermission = authObject.checkOrganizationPermission;
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);

    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const deleteMutation = useMutation({
        mutationFn: posServices.deleteSaleInvoiceAdjustment,
        onSuccess: (data) => {
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
        },
    });

    const menuItems: MenuItemProps[] = [
        checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ]) && {
          icon: <VisibilityOutlined />,
          title: 'View',
          action: 'open',
        },
        checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT]) && {
            icon: <EditOutlined />,
            title: 'Edit',
            action: 'edit',
        },
        checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE]) && {
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
            content: 'If you say yes, this Adjustment will be deleted',
            onYes: () => {
                hideDialog();
                deleteMutation.mutate({
                    id: transaction.id,
                    type: type,
                });
            },
            onNo: () => hideDialog(),
            variant: 'confirm',
            });
            break;
        case 'edit':
            setOpenEditDialog(true);
            break;
        case 'open':
          setOpenDocumentDialog(true);
          break;
         default:
          break;
        }
    };

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog}
        scroll="paper"
        fullScreen={belowLargeScreen}
        fullWidth
        maxWidth={openEditDialog ? 'lg' : 'md'}
      >
        {openEditDialog &&
          (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT]) ? (
            <EditAdjustment transaction={transaction} type={type} toggleOpen={setOpenEditDialog}/>
          ) : (
            <UnauthorizedAccess />
          ))}
          {openDocumentDialog && (checkPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ]) ? <DocumentDialog type={type} setOpenDocumentDialog={setOpenDocumentDialog} transaction={transaction} authObject={authObject}/> : <UnauthorizedAccess/>)}
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

export default SaleInvoiceAdjustmentItemAction;
