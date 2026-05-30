'use client'

import { Dialog, Tooltip } from '@mui/material'
import React, { useState } from 'react'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined, PersonAddOutlined, PersonRemoveOutlined, ViewTimelineOutlined } from '@mui/icons-material'
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog'
import ledgerServices from '../ledger-services'
import LedgerStatementDialogContent from './ledgerStatement/LedgerStatementDialogContent'
import { useSnackbar } from 'notistack'
import LedgerForm from '../forms/LedgerForm'
import UserLedgerActionForm from '../forms/UserLedgerActionForm'
import { deviceType } from '@/utilities/helpers/user-agent-helpers'
import { PERMISSIONS } from '@/utilities/constants/permissions'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { JumboDdMenu } from '@jumbo/components'
import { MenuItemProps } from '@jumbo/types'

interface Ledger {
  id: number;
  name: string;
  balance?: {
    amount: number;
  };
  [key: string]: any;
}

interface LedgerListItemActionProps {
  ledger: Ledger;
}

function LedgerListItemAction({ ledger }: LedgerListItemActionProps) {
  const { showDialog, hideDialog } = useJumboDialog();
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { checkOrganizationPermission } = useJumboAuth();
  const queryClient = useQueryClient();
  const [openEditLedgerFormDialog, setOpenEditLedgerFormDialog] = useState(false);
  const [openLinkUserFormDialog, setOpenLinkUserFormDialog] = useState(false);
  const [openUnlinkUserFormDialog, setOpenUnlinkUserFormDialog] = useState(false);
  const isMobile = deviceType() === 'mobile';

  const { mutate: deleteLedgerMutation } = useMutation({
    mutationFn: (ledger: Ledger) => ledgerServices.delete(ledger),
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['ledgers-list'] });
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
      hideDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const menuItems: MenuItemProps[] = [
    ...(ledger?.id > 10 && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_EDIT)
      ? [{ icon: <EditOutlined />, title: 'Edit', action: 'edit' } as MenuItemProps]
      : []),
    ...(ledger?.id > 10 && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_EDIT)
      ? [{ icon: <PersonAddOutlined />, title: 'Link User', action: 'link-user' } as MenuItemProps]
      : []),
    ...(ledger?.id > 10 && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_EDIT)
      ? [{ icon: <PersonRemoveOutlined color='error' />, title: 'Unlink User', action: 'unlink-user' } as MenuItemProps]
      : []),
    { icon: <ViewTimelineOutlined />, title: 'Statement', action: 'statement' } as MenuItemProps,
    ...(ledger?.balance?.amount === 0 && ledger?.id > 10 && checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_DELETE)
      ? [{ icon: <DeleteOutlined color='error' />, title: 'Delete', action: 'delete' } as MenuItemProps]
      : []),
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditLedgerFormDialog(true);
        break;
      case 'link-user':
        setOpenLinkUserFormDialog(true);
        break;
      case 'unlink-user':
        setOpenUnlinkUserFormDialog(true);
        break;
      case 'statement':
        setOpenDocumentDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Ledger',
          content: 'Are you sure you want to delete this Ledger ?',
          onYes: () => { 
            hideDialog();
            deleteLedgerMutation(ledger);
          },
          onNo: () => hideDialog(),
          variant: 'confirm'
        });
        break;
      default:
        break;
    }
  }

  return (
    <>
      <Dialog
        open={openDocumentDialog || openEditLedgerFormDialog || openLinkUserFormDialog || openUnlinkUserFormDialog}
        fullWidth
        fullScreen={isMobile}
        maxWidth={openEditLedgerFormDialog || openLinkUserFormDialog || openUnlinkUserFormDialog ? 'sm' : 'md'}
      >
        {openDocumentDialog && <LedgerStatementDialogContent ledger={ledger} setOpen={setOpenDocumentDialog} />}
        {openEditLedgerFormDialog && <LedgerForm ledger={ledger} toggleOpen={setOpenEditLedgerFormDialog} />}
        {openLinkUserFormDialog && <UserLedgerActionForm mode='link' ledger={ledger} toggleOpen={setOpenLinkUserFormDialog} />}
        {openUnlinkUserFormDialog && <UserLedgerActionForm mode='unlink' ledger={ledger} toggleOpen={setOpenUnlinkUserFormDialog} />}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  )
}

export default LedgerListItemAction;