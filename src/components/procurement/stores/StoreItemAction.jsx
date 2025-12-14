'use client'
import { DeleteOutlined,EditOutlined, MoreHorizOutlined} from '@mui/icons-material';
import { Dialog,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import storeServices from './store-services';
import StoreForm from './StoreForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const StoreItemAction = ({store}) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteStore = useMutation({
    mutationFn: storeServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(dictionary.stores.form.messages.deleteSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (error) => {
      enqueueSnackbar(dictionary.stores.form.errors.messages.deleteSuccess, { variant: 'error' });
    },
  });

  const menuItems = [
    {icon: <EditOutlined/>, title: dictionary.stores.list.actionsTitle.labels.edit, action: 'edit'},
    {icon: <DeleteOutlined color='error'/>, title: dictionary.stores.list.actionsTitle.labels.delete, action: 'delete'}
  ]

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: dictionary.stores.list.dialog.showDialog.title,
          content: dictionary.stores.list.dialog.showDialog.content,
          onYes: () =>{ 
            hideDialog();
            deleteStore(store.id)
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
        maxWidth="xs" 
        fullScreen={belowLargeScreen}
      >
        <StoreForm store={store} setOpenDialog={setOpenEditDialog} />
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.stores.list.labels.actions}>
            <MoreHorizOutlined fontSize='small'/>
          </Tooltip>
      }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default StoreItemAction;
