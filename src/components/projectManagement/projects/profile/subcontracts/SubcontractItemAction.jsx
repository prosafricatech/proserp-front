'use client'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog,LinearProgress,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import SubcontractForm from './SubcontractForm';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import projectsServices from '../../project-services';
import { JumboDdMenu } from '@jumbo/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const EditSubContract = ({subContract,setOpenDialog}) => {
  const {data:SubContractDetails,isFetching} = useQuery({
    queryKey: ['SubContractDetails',{id:subContract.id}],
    queryFn: async() => projectsServices.getSubContractDetails(subContract.id)
  });

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <SubcontractForm setOpenDialog={setOpenDialog} subContract={SubContractDetails} />
  )
}

const SubcontractItemAction = ({subContract}) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();

  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // React Query v5 syntax for useMutation
  const { mutate: deleteSubContract } = useMutation({
    mutationFn: projectsServices.deleteSubContract,
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['subcontracts']});
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data.message,{variant : 'error'});
    },
  });

  const menuItems = [
    checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_EDIT) && {
      icon: <EditOutlined/>,
      title: 'Edit',
      action: 'edit',
    },
    checkOrganizationPermission(PERMISSIONS.PROJECT_SUBCONTRACTS_DELETE) && {
      icon: <DeleteOutlined color='error'/>,
      title: 'Delete',
      action: 'delete',
    },
  ].filter(Boolean);

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break; 
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Sub Contract?',
          onYes: () =>{ 
            hideDialog();
            deleteSubContract(subContract.id)
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
        maxWidth={'md'} 
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && <EditSubContract subContract={subContract} setOpenDialog={setOpenEditDialog}/>}
      </Dialog>
      {menuItems.length > 0 && (
        <JumboDdMenu
          icon={
            <Tooltip title='Actions'>
              <MoreHorizOutlined/>
            </Tooltip>
          }
          menuItems={menuItems}
          onClickCallback={handleItemAction}
        />
      )}
    </>
  );
};

export default SubcontractItemAction;