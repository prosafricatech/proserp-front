'use client';

import { DeleteOutlined, MoreHorizOutlined} from '@mui/icons-material';
import { Dialog,Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import currencyServices from './currency-services';
import { Currency } from './CurrencyType';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const CurrencyItemAction = ({currency}:{currency: Currency}) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary()

  const { mutate: deleteCurrency } = useMutation({
    mutationFn: currencyServices.delete,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const menuItems = [
    {icon: currency.id !== 1 && <DeleteOutlined color='error'/>, title: currency.id !== 1 && dictionary.currencies.list.actionTittle.delete, action: currency.id !== 1 && 'delete'}
  ]

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: dictionary.currencies.list.dialog.showdialog.title,
          content: dictionary.currencies.list.dialog.showdialog.content ,
          onYes: () =>{ 
            hideDialog();
            deleteCurrency(currency.id)
          },
          onNo: () => hideDialog(),
          variant:'confirm'
        });
        break;
        default:
        break;
    }
  }

  return (
    <>
        <Dialog
          open={openEditDialog}
          fullWidth
          maxWidth="md" 
        >
          {/* <CurrencyForm currency={currency} setOpenDialog={setOpenEditDialog} /> */}
        </Dialog>
        <JumboDdMenu
          icon={
            <Tooltip title={dictionary.currencies.list.labels.actions}>
              <MoreHorizOutlined fontSize='small'/>
            </Tooltip>
        }
          menuItems={menuItems}
          onClickCallback={handleItemAction}
        />
    </>
  );
};

export default CurrencyItemAction;
