import { DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogContent, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import billOfMaterialsServices from './billOfMaterialsServices';
import PDFContent from '../../pdf/PDFContent';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import BillOfMaterialForm from './form/BillOfMaterialForm';
import BillOfMaterialPDF from './preview/BillOfMaterialPDF';
import BillOfMaterialOnScreen from './preview/BillOfMaterialOnScreen';

const DocumentDialog = ({ billOfMaterial, organization, setOpenDocumentDialog }) => {
  const { data, isFetching } = useQuery({
    queryKey: ['billOfMaterialDetails', { id: billOfMaterial.id }],
    queryFn: () => billOfMaterialsServices.billOfMaterialDetails(billOfMaterial.id),
  });
  const [activeTab, setActiveTab] = useState(0);

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <DialogContent>
      {belowLargeScreen && (
        <Grid container alignItems="center" justifyContent="space-between" marginBottom={2}>
          <Grid size={11}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="Bill Of Material View Tabs"
            >
              <Tab label="ONSCREEN" />
              <Tab label="PDF" />
            </Tabs>
          </Grid>

          <Grid size={1} textAlign="right">
            <Tooltip title="Cancel">
              <IconButton
                size="small"
                onClick={() => setOpenDocumentDialog(false)}
              >
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      )}
      {belowLargeScreen && activeTab === 0 ?
        <BillOfMaterialOnScreen billOfMaterial={data} organization={organization} />
        :
        <PDFContent
          document={<BillOfMaterialPDF billOfMaterial={data} organization={organization} />}
          fileName={billOfMaterial.bomNo}
        />
      }
      <Box textAlign="right" marginTop={5}>
        <Button variant="outlined" size='small' color="primary" onClick={() => setOpenDocumentDialog(false)}>
          Close
        </Button>
      </Box>
    </DialogContent>
  );
};

const EditBillOfMaterial = ({ billOfMaterial, setOpenDialog }) => {
  const { data: billOfMaterialDetails, isFetching } = useQuery({
    queryKey: ['billOfMaterialDetails', { id: billOfMaterial.id }],
    queryFn: () => billOfMaterialsServices.billOfMaterialDetails(billOfMaterial.id),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <BillOfMaterialForm toggleOpen={setOpenDialog} billOfMaterial={billOfMaterialDetails} />
  );
};

const BillOfMaterialItemAction = ({ billOfMaterial }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { authOrganization: { organization } } = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteBillOfMaterial } = useMutation({
    mutationFn: billOfMaterialsServices.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billOfMaterials'] });
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data.message, { variant: 'error' });
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: "View", action: "open" },
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    { icon: <DeleteOutlined color='error' />, title: 'Delete', action: 'delete' }
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Bill Of Material?',
          onYes: () => {
            hideDialog();
            deleteBillOfMaterial(billOfMaterial.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm'
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={() => setOpenDocumentDialog(false)}
        maxWidth={'md'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        {openEditDialog && <EditBillOfMaterial billOfMaterial={billOfMaterial} setOpenDialog={setOpenEditDialog} />}
        {openDocumentDialog && <DocumentDialog setOpenDocumentDialog={setOpenDocumentDialog} billOfMaterial={billOfMaterial} organization={organization} />}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default BillOfMaterialItemAction;
