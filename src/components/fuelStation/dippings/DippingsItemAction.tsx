'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import PDFContent from '../../pdf/PDFContent';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import fuelStationServices from '../fuelStationServices';
import { DippingsFormContext } from './Dippings';
import DippingsForm from './DippingsForm';
import DippingsOnScreen from './DippingsOnScreen';
import DippingsPDF from './DippingsPDF';
import { Dipping, Station } from './DippingsTypes';

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

const EditDipping: React.FC<EditDippingProps> = ({
  dipping,
  setOpenEditDialog,
}) => {
  const { data: dippingData, isFetching } = useQuery({
    queryKey: ['showDippingDetails', { id: dipping.id }],
    queryFn: () => fuelStationServices.showDippingDetails(dipping.id),
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <DippingsForm dippingData={dippingData} setOpenDialog={setOpenEditDialog} />
  );
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  openDocumentDialog,
  setOpenDocumentDialog,
  organization,
  dipping,
}) => {
  const { data: dippingData, isFetching } = useQuery({
    queryKey: ['showDippingDetails', { id: dipping.id }],
    queryFn: () => fuelStationServices.showDippingDetails(dipping.id),
  });

  const { activeStation } = useContext(DippingsFormContext) as {
    activeStation?: any;
  };
  const { shift_teams, fuel_pumps } = activeStation?.shift_teams || [];
  const { productOptions } = useProductsSelect();
  const [showOnScreen, setShowOnScreen] = useState(true);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
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
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          }
          closeButton={
            <IconButton
              size='small'
              color='primary'
              onClick={() => setOpenDocumentDialog(false)}
            >
              <HighlightOff color='primary' />
            </IconButton>
          }
        />
        <Box>
          {showOnScreen && (
            <DippingsOnScreen
              productOptions={productOptions}
              dippingData={dippingData}
              fuel_pumps={fuel_pumps}
              shift_teams={shift_teams}
              organization={organization}
            />
          )}
          {!showOnScreen && (
            <PDFContent
              fileName={dippingData.remarks}
              document={
                <DippingsPDF
                  productOptions={productOptions}
                  dippingData={dippingData}
                  organization={organization}
                />
              }
            />
          )}
        </Box>
      </DialogContent>
      {belowLargeScreen && (
        <Box textAlign='right' margin={2}>
          <Button
            variant='outlined'
            size='small'
            color='primary'
            onClick={() => setOpenDocumentDialog(false)}
          >
            Close
          </Button>
        </Box>
      )}
    </Dialog>
  );
};

const DippingsItemAction: React.FC<{
  dipping: Dipping;
  activeStation?: Station | null;
}> = ({ dipping }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  //Screen handling constants
  const { theme } = useJumboTheme();
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
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    // {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
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
          onYes: () => {
            hideDialog();
            deleteDipping(dipping.id);
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
        fullScreen={belowLargeScreen && openEditDialog}
        maxWidth={'md'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {openEditDialog && (
          <EditDipping
            dipping={dipping}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
        {openDocumentDialog && (
          <DocumentDialog
            dipping={dipping}
            organization={organization}
            setOpenDocumentDialog={setOpenDocumentDialog}
            openDocumentDialog={openDocumentDialog}
          />
        )}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={(option) =>
          handleItemAction(option as MenuItemProps & { action: string })
        }
      />
    </>
  );
};

export default DippingsItemAction;
