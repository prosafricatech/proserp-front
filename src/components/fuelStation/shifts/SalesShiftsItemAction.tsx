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
import { SalesShift } from './SalesShiftTypes';
import { Organization } from '@/types/auth-types';
import { Station } from '../Stations/StationType';
import { MenuItemProps } from '@jumbo/types';

interface EditShiftProps {
  ClosedShift: SalesShift;
  setOpenEditDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DocumentDialogProps {
  organization: Organization;
  ClosedShift: SalesShift;
}

interface SalesShiftsItemActionProps {
  ClosedShift: SalesShift;
}

const EditShift: React.FC<EditShiftProps> = ({ ClosedShift, setOpenEditDialog }) => {
  const { data: shiftData, isFetching } = useQuery({
    queryKey: ['showshiftDetails', { id: ClosedShift.id }],
    queryFn: () => fuelStationServices.showShiftDetails(ClosedShift.id)
  });

  if(isFetching){
    return <LinearProgress/>;
  }

  return (
    <SaleShiftForm SalesShift={shiftData} setOpenDialog={setOpenEditDialog}/>
  )
}

const DocumentDialog: React.FC<DocumentDialogProps> = ({ organization, ClosedShift }) => {
  const { activeStation } = useContext<{ activeStation?: Station }>(StationFormContext);
  const { shift_teams = [], fuel_pumps = [], tanks = [] } = activeStation ?? {};
  const { productOptions } = useProductsSelect();
  const [includeFuelVouchers, setIncludeFuelVouchers] = useState(false);

 const { data: shiftData, isFetching } = useQuery({
  queryKey: ['showshiftDetails', { id: ClosedShift.id }],
  queryFn: () => fuelStationServices.showShiftDetails(ClosedShift.id)
});

  if(isFetching){
    return <LinearProgress/>;
  }

  const normalizedShiftTeams = shift_teams.map(team => ({
    ...team,
    id: typeof team.id === 'string' ? parseInt(team.id, 10) : team.id
  }));

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
        <PDFContent fileName={shiftData.shiftNo} document={<SalesShiftPDF includeFuelVouchers={includeFuelVouchers} productOptions={productOptions} shiftData={shiftData} tanks={tanks} fuel_pumps={fuel_pumps} shift_teams={normalizedShiftTeams} organization={organization}/>}/>
      </DialogContent>
    </>
  )
}

const SalesShiftsItemAction: React.FC<SalesShiftsItemActionProps> = ({ ClosedShift }) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization as Organization;
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
   onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete shift',
        { variant: 'error' }
      );
    },
  });

  const menuItems: (MenuItemProps & { action: string })[]  = [
    {icon: belowLargeScreen ? <DownloadOutlined/> : <VisibilityOutlined/> , title: belowLargeScreen ? "Download" : "View", action: "open"},
    {icon: <EditOutlined/>, title: 'Edit', action: 'edit'},
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
        onClickCallback={(option) => handleItemAction(option as MenuItemProps & { action: string })}
      />
    </>
  );
};

export default SalesShiftsItemAction;