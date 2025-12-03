import { DeleteOutlined, DownloadOutlined, EditOutlined, MoreHorizOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Checkbox, Dialog,DialogContent,DialogTitle,LinearProgress,Stack,Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import fuelStationServices from '../fuelStationServices';
import SaleShiftForm from './SaleShiftForm';
import PDFContent from '../../pdf/PDFContent';
import SalesShiftPDF from './SalesShiftPDF';
import { StationFormContext } from './SalesShifts';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const EditShift = ({ClosedShift, setOpenEditDialog}) => {
  const { data: shiftData, isFetching } = useQuery({
    queryKey: ['showshiftDetails', { id: ClosedShift.id }],
    queryFn: () => fuelStationServices.showshiftDetails(ClosedShift.id)
  });

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <SaleShiftForm SalesShift={shiftData} setOpenDialog={setOpenEditDialog}/>
  )
}

const DocumentDialog = ({organization, ClosedShift}) => {
  const {activeStation} = useContext(StationFormContext);
  const { shift_teams, fuel_pumps, tanks } = activeStation;
  const { productOptions } = useProductsSelect();
  const [includeFuelVouchers, setIncludeFuelVouchers] = useState(false);

 const { data: shiftData, isFetching } = useQuery({
  queryKey: ['showshiftDetails', { id: ClosedShift.id }],
  queryFn: () => fuelStationServices.showshiftDetails(ClosedShift.id)
});

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <>
      <DialogTitle>
        <Stack direction={'row'} justifyContent={'center'} alignItems={'center'}>
          <Typography>With Fuel Vouchers</Typography> 
          <Checkbox
            checked={includeFuelVouchers}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setIncludeFuelVouchers(isChecked);
            }}
          />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <PDFContent fileName={shiftData.shiftNo} document={<SalesShiftPDF includeFuelVouchers={includeFuelVouchers} productOptions={productOptions} shiftData={shiftData} tanks={tanks} fuel_pumps={fuel_pumps} shift_teams={shift_teams} organization={organization}/>}/>
      </DialogContent>
    </>
  )
}

const SalesShiftsItemAction = ({ ClosedShift}) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const {authOrganization : {organization}} = useJumboAuth();
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

 const { mutate: deleteShift } = useMutation({
  mutationFn: fuelStationServices.deleteSalesShift,
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['closedShifts'] });
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
    {icon: belowLargeScreen ? <DownloadOutlined/> : <VisibilityOutlined/> , title: belowLargeScreen ? "Download" : "View", action: "open"},
    {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
    {icon: <DeleteOutlined color='error'/>, title: 'Delete', action: 'delete'}
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
          variant: 'confirm'
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
        maxWidth={openDocumentDialog ? 'md' : 'lg'} 
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {openEditDialog && <EditShift ClosedShift={ClosedShift} setOpenEditDialog={setOpenEditDialog} />}
        {openDocumentDialog && <DocumentDialog ClosedShift={ClosedShift} organization={organization} />}
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

export default SalesShiftsItemAction;