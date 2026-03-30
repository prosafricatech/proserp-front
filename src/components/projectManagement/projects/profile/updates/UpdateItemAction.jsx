'use client'
import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Dialog, Skeleton, useMediaQuery, IconButton, Stack, Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import UpdatesForm from './UpdatesForm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import projectsServices from '../../project-services';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const EditUpdate = ({update, setOpenDialog, setIsUpdateFormOpen}) => {
  const {data:updateDetails, isFetching} = useQuery({
    queryKey: ['editProjectUpdate',{id:update.id}],
    queryFn: async() => projectsServices.projectUpdateDetails(update.id)
  });

  if(isFetching){
    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <UpdatesForm setOpenDialog={setOpenDialog} update={updateDetails} setIsUpdateFormOpen={setIsUpdateFormOpen} />
  )
}

const UpdateItemAction = ({ update, setIsUpdateFormOpen }) => {
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
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

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this Update?',
      onYes: () => {
        hideDialog();
        deleteUpdate(update.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth  
        fullScreen={belowLargeScreen}
        maxWidth={'lg'} 
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <EditUpdate update={update} setOpenDialog={setOpenEditDialog} setIsUpdateFormOpen={setIsUpdateFormOpen} />
      </Dialog>
      <Stack textAlign={'end'} direction="row" spacing={1} sx={{ mb: 1 }} justifyContent="flex-end">
        <Tooltip title="Edit">
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpenEditDialog(true);
            }}
          >
          <EditOutlined />
        </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" size="small" onClick={handleDelete}>
            <DeleteOutlined />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
};

export default UpdateItemAction;