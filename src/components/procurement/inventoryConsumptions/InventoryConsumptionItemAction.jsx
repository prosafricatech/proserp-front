'use client'
import { DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import React, { useState } from 'react'
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import inventoryConsumptionsServices from './inventoryConsumptionsServices';
import InventoryConsumptionsForm from './form/InventoryConsumptionForm';
import InventoryConsumptionPDF from './InventoryConsumptionPDF';
import InventoryConsumptionsOnScreen from './InventoryConsumptionsOnScreen';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import PDFContent from '@/components/pdf/PDFContent';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';

const ActionDialogContent = ({ inventoryConsumption, setOpenDialog, action = 'open', consumptionTab = false }) => {
  const { data, isFetching } = useQuery({
    queryKey: ['inventoryConsumption', inventoryConsumption.id],
    queryFn: ({ queryKey }) => {
      const [, id] = queryKey;
      return inventoryConsumptionsServices.show(id);
    },
    enabled: !!inventoryConsumption.id,
  });

  const authObject = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [activeTab, setActiveTab] = React.useState(0);

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  let dialogContent;

  if (action !== 'open') {
    dialogContent = (
      <InventoryConsumptionsForm
        setOpenDialog={setOpenDialog}
        inventoryConsumption={data}
        consumptionTab={consumptionTab}
      />
    );
  } else if (belowLargeScreen) {
    dialogContent = (
      <>
        <Grid container alignItems="center" justifyContent="space-between" margin={1}>
          <Grid size={11}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="inventory consumption tabs">
              <Tab label="ONSCREEN" />
              <Tab label="PDF" />
            </Tabs>
          </Grid>
          <Grid size={1} textAlign="right">
            <Tooltip title="Close">
              <IconButton size="small" onClick={() => setOpenDialog(false)}>
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        {activeTab === 0 && (
          <InventoryConsumptionsOnScreen inventoryConsumption={data} authObject={authObject} />
        )}
        {activeTab === 1 && (
          <PDFContent
            fileName={inventoryConsumption.consumptionNo}
            document={<InventoryConsumptionPDF inventoryConsumption={data} authObject={authObject} />}
          />
        )}
        <Box textAlign="right" marginTop={5}>
          <Button variant="outlined" size="small" color="primary" onClick={() => setOpenDialog(false)}>
            Close
          </Button>
        </Box>
      </>
    );
  } else {
    dialogContent = (
      <PDFContent
        fileName={inventoryConsumption.consumptionNo}
        document={<InventoryConsumptionPDF inventoryConsumption={data} authObject={authObject} />}
      />
    );
  }

  return dialogContent;
};

function InventoryConsumptionItemAction({inventoryConsumption, consumptionTab = false}) {
    const {showDialog,hideDialog} = useJumboDialog();
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();
    const authObject = useJumboAuth();
    const checkOrganizationPermission = authObject.checkOrganizationPermission;

    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
    
    const { mutate: deleteInventoryConsumption } = useMutation({
      mutationFn: inventoryConsumptionsServices.delete,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['inventoryConsumptions'] });
        enqueueSnackbar(data.message, { variant: 'success' });
      },
      onError: (error) => {
        enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
      },
    });
  
    const menuItems = [
      {icon: <VisibilityOutlined/> , title : "View" , action : "open"},
      !consumptionTab && (checkOrganizationPermission(PERMISSIONS.INVENTORY_CONSUMPTIONS_BACKDATE) || inventoryConsumption.consumption_date >= dayjs().startOf('date').toISOString()) && {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
      (checkOrganizationPermission(PERMISSIONS.INVENTORY_CONSUMPTIONS_BACKDATE) || inventoryConsumption.consumption_date >= dayjs().startOf('date').toISOString()) && {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
    ];
  
    const handleItemAction = (menuItem) => {
      switch (menuItem.action) {
        case 'edit':
          setOpenEditDialog(true);
          break;
        case 'delete':
          showDialog({
            title: 'Confirm Inventory Consumption',
            content: 'Are you sure you want to delete this Inventory Consumption?',
            onYes: () =>{ 
              hideDialog();
              deleteInventoryConsumption(inventoryConsumption)
            },
            onNo: () => hideDialog(),
            variant:'confirm'
          });
          break;
          case 'open':
            setOpenDocumentDialog(true);
            break;
          default:
          break;
      }
    }

  return  (
    <React.Fragment>
      <Dialog
        scroll={belowLargeScreen ? 'body': 'paper'}
        maxWidth={openDocumentDialog ? 'md' : 'lg'}
        fullScreen={belowLargeScreen}
        fullWidth
        onClose={() => setOpenDocumentDialog(false)}
        open={openEditDialog || openDocumentDialog}
      >
        {openDocumentDialog && <DialogContent><ActionDialogContent setOpenDialog={setOpenDocumentDialog} action='open' inventoryConsumption={inventoryConsumption} /></DialogContent>}
        {openEditDialog && <ActionDialogContent setOpenDialog={setOpenEditDialog} action='edit' inventoryConsumption={inventoryConsumption} consumptionTab={consumptionTab}/>}
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
      </React.Fragment>
  )
}

export default InventoryConsumptionItemAction