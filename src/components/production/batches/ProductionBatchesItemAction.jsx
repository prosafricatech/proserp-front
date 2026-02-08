'use client'
import {
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import productionBatchesServices from './productionBatchesServices';
import ProductionBatchesForm from './form/ProductionBatchesForm';
import BatchPDF from './preview/BatchPDF';
import BatchOnScreen from './preview/BatchOnScreen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import PDFContent from '@/components/pdf/PDFContent';

const EditBatch = ({ batch, setOpenEditDialog }) => {
  const [isConsumptionDeletedInside, setIsConsumptionDeletedInside] = useState(false);

  const { data: batchData, isPending: isFetching } = useQuery({
    queryKey: ['showBatchDetails', batch.id],
    queryFn: () => productionBatchesServices.showBatchDetails(batch.id),
    enabled: !!batch.id,
  });

  if (!isConsumptionDeletedInside && isFetching) {
    return <LinearProgress />;
  }

  return (
    <ProductionBatchesForm
      production={batchData}
      toggleOpen={setOpenEditDialog}
      setIsConsumptionDeletedInside={setIsConsumptionDeletedInside}
    />
  );
};

const DocumentDialog = ({ organization, batch, setOpenDocumentDialog }) => {
  const { data: batchData, isPending: isFetching } = useQuery({
    queryKey: ['showBatchDetails', batch.id],
    queryFn: () => productionBatchesServices.showBatchDetails(batch.id),
    enabled: !!batch.id,
  });

  const [activeTab, setActiveTab] = useState(0);
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
          <Grid item xs={11}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="journal View Tabs">
              <Tab label="ONSCREEN" />
              <Tab label="PDF" />
            </Tabs>
          </Grid>
          <Grid item xs={1} textAlign="right">
            <Tooltip title="Close">
              <IconButton size="small" onClick={() => setOpenDocumentDialog(false)}>
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      )}
      {belowLargeScreen && activeTab === 0 ? (
        <BatchOnScreen batch={batchData} organization={organization} />
      ) : (
        <PDFContent
          fileName={batchData.batchNo}
          document={<BatchPDF batch={batchData} organization={organization} />}
        />
      )}
      <Box textAlign="right" marginTop={5}>
        <Button variant="outlined" size="small" color="primary" onClick={() => setOpenDocumentDialog(false)}>
          Close
        </Button>
      </Box>
    </DialogContent>
  );
};

const ProductionBatchesItemAction = ({ batch }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const {
    authOrganization: { organization },
  } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteProductionBatch } = useMutation({
    mutationFn: (id) => productionBatchesServices.deleteProductionBatch(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productionBatches'] });
      enqueueSnackbar(data.message, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete batch', {
        variant: 'error',
      });
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    { icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete' },
  ];

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Delete',
          content: 'Are you sure you want to delete this Production batch?',
          onYes: () => {
            hideDialog();
            deleteProductionBatch(batch.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
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
        maxWidth={openDocumentDialog ? 'md' : 'lg'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => {
          setOpenDocumentDialog(false);
          setOpenEditDialog(false);
        }}
      >
        {openEditDialog && <EditBatch batch={batch} setOpenEditDialog={setOpenEditDialog} />}
        {openDocumentDialog && (
          <DocumentDialog
            batch={batch}
            organization={organization}
            setOpenDocumentDialog={setOpenDocumentDialog}
          />
        )}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title="Actions">
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default ProductionBatchesItemAction;
