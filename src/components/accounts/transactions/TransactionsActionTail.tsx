'use client'
import { AddOutlined } from '@mui/icons-material'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React, { useEffect, useState } from 'react'
import PaymentFormDialogContent from './payments/PaymentFormDialogContent'
import ReceiptFormDialogContent from './receipts/ReceiptFormDialogContent';
import TransferFormDialogContent from './tranfers/TransferFormDialogContent';
import JournalFormDialogContent from './journals/JournalFormDialogContent';
import { TransactionTypes } from './TransactionTypes';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';

function TransactionsActionTail({type}:{type: TransactionTypes}) {
  const [openDialog, setOpenDialog] = useState(false);
  const {checkOrganizationPermission} = useJumboAuth();
  const [mounted, setMounted] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if(!checkOrganizationPermission([
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
    PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_EDIT,
    PERMISSIONS.PAYMENTS_DELETE,
    PERMISSIONS.FUND_TRANSFERS_READ,
    PERMISSIONS.FUND_TRANSFERS_CREATE,
    PERMISSIONS.FUND_TRANSFERS_DELETE,
    PERMISSIONS.FUND_TRANSFERS_EDIT,
    PERMISSIONS.RECEIPTS_READ,
    PERMISSIONS.RECEIPTS_EDIT,
    PERMISSIONS.RECEIPTS_CREATE,
    PERMISSIONS.RECEIPTS_DELETE,
    PERMISSIONS.JOURNAL_VOUCHERS_READ,
    PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
    PERMISSIONS.JOURNAL_VOUCHERS_DELETE,
    PERMISSIONS.JOURNAL_VOUCHERS_EDIT
  ])){
    return <UnauthorizedAccess/>
  }

  let dialogContent;
  if(type === 'payments'){
    dialogContent = <PaymentFormDialogContent setOpen={setOpenDialog} />
  } else if(type === 'receipts') {
    dialogContent = <ReceiptFormDialogContent setOpen={setOpenDialog}/>
  } else if(type === 'transfers') {
    dialogContent = <TransferFormDialogContent setOpen={setOpenDialog}/>
  } else if(type === 'journal_vouchers') {
    dialogContent = <JournalFormDialogContent setOpen={setOpenDialog}/>
  }

  return (
    <React.Fragment>
      <Tooltip title={'New'}>
        <IconButton size='small' onClick={() => setOpenDialog(true)}>
          <AddOutlined />
        </IconButton>
      </Tooltip>
      <Dialog fullWidth fullScreen={belowLargeScreen} open={openDialog} scroll={'paper'} maxWidth='lg'>
        {dialogContent}
      </Dialog>
    </React.Fragment>
  )
}

export default TransactionsActionTail