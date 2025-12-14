'use client'
import { DeleteOutlined, DownloadOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import {Box, Button, Dialog,DialogContent,Grid,IconButton,LinearProgress,Tab,Tabs,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import fuelStationServices from '../fuelStationServices';
import PDFContent from '../../pdf/PDFContent';
import DippingsPDF from './DippingsPDF';
import { DippingsFormContext } from './Dippings';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import DippingsForm from './DippingsForm';
import DippingsOnScreen from './DippingsOnScreen';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dipping } from './DippingsTypes';
import { Station } from './DippingsTypes';
import { MenuItemProps } from '@jumbo/types';

interface EditDippingProps {
  dipping: Dipping;
  setOpenEditDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DocumentDialogProps {
  openDocumentDialog: boolean;
  setOpenDocumentDialog: React.Dispatch<React.SetStateAction<boolean>>;
  organization: any; 
  dipping: Dipping;
}

const EditDipping: React.FC<EditDippingProps> = ({ dipping, setOpenEditDialog }) => {
  const { data: dippingData, isFetching } = useQuery({
    queryKey: ['showDippingDetails', { id: dipping.id }],
    queryFn: () => fuelStationServices.showDippingDetails(dipping.id)
});

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <DippingsForm dippingData={dippingData} setOpenDialog={setOpenEditDialog}/>
  )
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  openDocumentDialog,
  setOpenDocumentDialog,
  organization,
  dipping,
}) => {
 const { data: dippingData, isFetching } = useQuery({
    queryKey: ['showDippingDetails', { id: dipping.id }],
    queryFn: () => fuelStationServices.showDippingDetails(dipping.id)
});

  const { activeStation } = useContext(DippingsFormContext) as { activeStation?: any };
  const { shift_teams, fuel_pumps } = activeStation?.shift_teams || [];
  const { productOptions } = useProductsSelect();
  const [selectedTab, setSelectedTab] = useState(0);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <Dialog
      open={openDocumentDialog}
      onClose={() => setOpenDocumentDialog(false)}
      fullWidth
      scroll='body'
      maxWidth={'md'}
      fullScreen={belowLargeScreen}
    >
      <DialogContent>
        {belowLargeScreen ? (
            <Box>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={belowLargeScreen ? 11 : 12}>
                  <Tabs value={selectedTab} onChange={handleTabChange}>
                    <Tab label="On Screen" />
                    <Tab label="PDF" />
                  </Tabs>
                </Grid>

                {belowLargeScreen && (
                  <Grid size={1} textAlign="right">
                    <Tooltip title="Close">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setOpenDocumentDialog(false)}
                      >
                        <HighlightOff color="primary" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            <Box>
              {selectedTab === 0 && (
                <DippingsOnScreen productOptions={productOptions} dippingData={dippingData} fuel_pumps={fuel_pumps} shift_teams={shift_teams} organization={organization}/>
              )}
              {selectedTab === 1 && (
                <PDFContent fileName={dippingData.remarks} document={<DippingsPDF productOptions={productOptions} dippingData={dippingData} organization={organization}/>}/>
              )}
            </Box>
          </Box>
        ) : (
          <PDFContent fileName={dippingData.remarks} document={<DippingsPDF productOptions={productOptions} dippingData={dippingData} organization={organization}/>}/>
        )}
      </DialogContent>
      {belowLargeScreen &&
        <Box textAlign="right" margin={2}>
          <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
          Close
          </Button>
        </Box>
      }
    </Dialog>
  )
}

const DippingsItemAction: React.FC<{ dipping: Dipping; activeStation?: Station | null }> = ({ dipping }) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteDipping } = useMutation({
    mutationFn: fuelStationServices.deleteDipping,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['stationDippings'] });
        enqueueSnackbar(data.message, {
            variant: 'success',
        });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Error deleting', {
        variant: 'error',
      });
    },
  });

  const menuItems: (MenuItemProps & { action: string })[] = [
    { icon: <VisibilityOutlined />, title: "View", action: "open" },
    // {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
    {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
  ];

  const handleItemAction = (menuItem: MenuItemProps & { action: string }) => {
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: `Delete`,
          content: 'Are you sure you want to delete this Dipping?',
          onYes: () =>{ 
            hideDialog();
            deleteDipping(dipping.id)
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
        open={openEditDialog || openDocumentDialog}
        fullWidth  
        fullScreen={belowLargeScreen && openEditDialog}
        maxWidth={'md'} 
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {openEditDialog && <EditDipping dipping={dipping} setOpenEditDialog={setOpenEditDialog} />}
        {openDocumentDialog && <DocumentDialog dipping={dipping} organization={organization} setOpenDocumentDialog={setOpenDocumentDialog} openDocumentDialog={openDocumentDialog}/>}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined/>
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={(option) => handleItemAction(option as MenuItemProps & { action: string })}
      />
    </>
  );
};

export default DippingsItemAction;
