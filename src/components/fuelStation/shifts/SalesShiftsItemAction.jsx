'use client';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Box, Grid } from '@mui/system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useContext, useState } from 'react';
import PDFContent from '../../pdf/PDFContent';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import fuelStationServices from '../fuelStationServices';
import SalesShiftOnScreen from './preview/SalesShiftOnScreen';
import SalesShiftPDF from './preview/SalesShiftPDF';
import SaleShiftForm from './SaleShiftForm/SaleShiftForm';
import { StationFormContext } from './SalesShifts';

const EditShift = ({ ClosedShift, setOpenEditDialog }) => {
  const { data: shiftData, isFetching } = useQuery({
    queryKey: ['showshiftDetails', { id: ClosedShift.id }],
    queryFn: async () => {
      return await fuelStationServices.showShiftDetails(ClosedShift.id);
    },
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <SaleShiftForm SalesShift={shiftData} setOpenDialog={setOpenEditDialog} />
  );
};

const DocumentDialog = ({
  organization,
  ClosedShift,
  setOpenDocumentDialog,
}) => {
  const { activeStation } = useContext(StationFormContext);
  const { shift_teams, fuel_pumps, tanks } = activeStation;
  const { productOptions } = useProductsSelect();
  const [openDetails, setOpenDetails] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);

  const handleDetailsChange = (e) => {
    const isChecked = e.target.checked;
    setOpenDetails(isChecked);
    setPdfKey(prev => prev + 1);
  };

  const { data: shiftData, isFetching } = useQuery({
    queryKey: ['showshiftDetails', { id: ClosedShift.id }],
    queryFn: () => fuelStationServices.showShiftDetails(ClosedShift.id),
  });

  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <>
      <DialogTitle>
        <Stack
          direction={'row'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography>With More Details</Typography>
          <Checkbox
            checked={openDetails}
            onChange={handleDetailsChange}
          />
        </Stack>
      </DialogTitle>
      <DialogContent>
        {belowLargeScreen && (
          <Grid
            container
            alignItems='center'
            justifyContent='space-between'
            mb={2}
          >
            <Grid size={11}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label='ONSCREEN' />
                <Tab label='PDF' />
              </Tabs>
            </Grid>
            <Grid size={1} textAlign='right'>
              <Tooltip title='Close'>
                <IconButton
                  size='small'
                  onClick={() => setOpenDocumentDialog(false)}
                >
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}
        {belowLargeScreen && activeTab === 0 ? (
          <SalesShiftOnScreen
            stationName={activeStation?.name}
            openDetails={openDetails}
            productOptions={productOptions}
            shiftData={shiftData}
            tanks={tanks}
            fuel_pumps={fuel_pumps}
            shift_teams={shift_teams}
            organization={organization}
          />
        ) : (
          <PDFContent
            key={pdfKey}
            fileName={shiftData.shiftNo}
            document={
              <SalesShiftPDF
                stationName={activeStation?.name}
                openDetails={openDetails}
                productOptions={productOptions}
                shiftData={shiftData}
                tanks={tanks}
                fuel_pumps={fuel_pumps}
                shift_teams={shift_teams}
                organization={organization}
              />
            }
          />
        )}
        {belowLargeScreen && (
          <Box textAlign='right' mt={5}>
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
      </DialogContent>
    </>
  );
};

const SalesShiftsItemAction = ({ ClosedShift }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const {
    authOrganization: { organization },
  } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteShift } = useMutation({
    mutationFn: fuelStationServices.deleteSalesShift,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesShifts'] });
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete outlet',
        { variant: 'error' }
      );
    },
  });

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
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
          content: 'Are you sure you want to delete this Shift?',
          onYes: () => {
            hideDialog();
            deleteShift(ClosedShift.id);
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
        }}
      >
        {openEditDialog && (
          <EditShift
            ClosedShift={ClosedShift}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
        {openDocumentDialog && (
          <DocumentDialog
            ClosedShift={ClosedShift}
            organization={organization}
            setOpenDocumentDialog={setOpenDocumentDialog}
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
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default SalesShiftsItemAction;
