import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog,LinearProgress,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CertificateForm from './form/CertificateForm';
import projectsServices from '@/components/projectManagement/projects/project-services';

const EditCertificate = ({certificate,setOpenDialog}) => {
  const {data:CertificateDetails, isFetching} = useQuery({
    queryKey: ['CertificateDetails',{id:certificate.id}],
    queryFn: async() => projectsServices.getCertificateDetails(certificate.id)
  });

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <CertificateForm setOpenDialog={setOpenDialog} certificate={CertificateDetails} />
  )
}

const CertificateItemAction = ({certificate}) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteCertificate } = useMutation({
    mutationFn: projectsServices.deleteCertificate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['Certificates']});
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
    {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'},
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break; 
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Certificate?',
          onYes: () =>{ 
            hideDialog();
            deleteCertificate(certificate.id)
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
        {openEditDialog && <EditCertificate certificate={certificate} setOpenDialog={setOpenEditDialog}/>}
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

export default CertificateItemAction;