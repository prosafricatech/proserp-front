'use client'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog,LinearProgress,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import UpdatesForm from './UpdatesForm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import projectsServices from '../../project-services';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';

const EditUpdate = ({update, setOpenDialog}) => {
  const {data:updateDetails, isFetching} = useQuery({
    queryKey: ['editProjectUpdate',{id:update.id}],
    queryFn: async() => projectsServices.projectUpdateDetails(update.id)
  });

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <UpdatesForm setOpenDialog={setOpenDialog} update={updateDetails} />
  )
}

const UpdateItemAction = ({ update }) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteUpdate } = useMutation({
    mutationFn: projectsServices.deleteUpdate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['projectUpdates']});
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data.message,{variant : 'error'});
    },
  });

  const menuItems = [
    {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
    {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Update?',
          onYes: () =>{ 
            hideDialog();
            deleteUpdate(update.id)
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
        fullScreen={belowLargeScreen}
        maxWidth={'lg'} 
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <EditUpdate update={update} setOpenDialog={setOpenEditDialog} />
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
    </>
  );
};

export default UpdateItemAction;