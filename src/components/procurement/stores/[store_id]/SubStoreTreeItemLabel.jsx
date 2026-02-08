import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { DeleteOutlined, EditOutlined, MoreVertOutlined } from '@mui/icons-material'
import { Tooltip, Typography } from '@mui/material'
import { useSnackbar } from 'notistack';
import React from 'react'
import storeServices from '../store-services';
import StoreForm from '../StoreForm';
import { useStoreProfile } from './StoreProfileProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JumboDdMenu } from '@jumbo/components';
import { Div } from '@jumbo/shared';

function SubStoreTreeItemLabel({store}) {
    const {showDialog,hideDialog} = useJumboDialog();
    const queryClient = useQueryClient();
    const {storeArrays: {storeIds,selectOptions},setActiveStore} = useStoreProfile();
    const {enqueueSnackbar} = useSnackbar();
    const isMain = String(store.id) === String(storeIds[0]) ;
    const menuItems = !isMain ? [
        {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
        {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
    ] : [];

    const deleteStore = useMutation({
        mutationFn: storeServices.delete,
        onSuccess: (data) => {
            enqueueSnackbar(data?.message, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['showStore'] });
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
        },
    });

    const handleItemAction = (menuItem) => {
        switch (menuItem.action) {
          case 'delete':
            showDialog({
              title : `Confirm Delete ${store.name}?`,
              content: 'If you say yes, this store will be deleted provided it is not related to any transaction',
              onYes: () => {
                hideDialog();
                deleteStore.mutate(store.id);
              },
              onNo: () => hideDialog(),
              variant: 'confirm'
            })
            break;
          case 'edit':
            showDialog({
                content: <StoreForm store={store} parentOptions={selectOptions} setOpenDialog={hideDialog}/>
            })
            break;
            default:
            break;
        }
    }
    
  return (
    <Div
        sx={{
            display: 'flex',
            alignItems: 'center',
        }}
        onClick={() => setActiveStore(store)}
    >
        <Tooltip title={store.name}>
            <Typography variant='body2'
                sx={{fontWeight: 'inherit', flexGrow: 1}}
                noWrap
            >
                {store.name}
            </Typography>
        </Tooltip>
        <JumboDdMenu
            icon={
                    <Tooltip title='Actions'>
                        <MoreVertOutlined/>
                    </Tooltip>
                }
            menuItems={menuItems}
            onClickCallback={handleItemAction}
        />
    </Div>
  )
}

export default SubStoreTreeItemLabel