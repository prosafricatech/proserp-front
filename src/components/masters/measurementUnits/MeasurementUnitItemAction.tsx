import { DeleteOutlined,EditOutlined, MoreHorizOutlined} from '@mui/icons-material';
import { Dialog,Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import MeasurementUnitForm from './MeasurementUnitForm';
import measurementUnitServices from './measurement-unit-services';
import { MeasurementUnit } from './MeasurementUnitType';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const MeasurementUnitItemAction = ({measurementUnit}:{measurementUnit: MeasurementUnit}) => {
  const [openEditDialog,setOpenEditDialog] = useState(false);
  const {showDialog,hideDialog} = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();
  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteMeasurementUnit } = useMutation({
    mutationFn: measurementUnitServices.delete,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['measurementUnits'] });
      enqueueSnackbar(dictionary.measurementUnits.form.messages.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(dictionary.measurementUnits.form.errors.messages.deleteResponse, {
        variant: 'error'
      });
    },
  });

  const menuItems = [
    {icon: <EditOutlined/>, title: dictionary.measurementUnits.list.actionsTittle.edit, action: 'edit'},
    {icon: <DeleteOutlined color='error'/>, title: dictionary.measurementUnits.list.actionsTittle.delete, action: 'delete'}
  ]

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: dictionary.measurementUnits.list.dialog.showDialog.title,
          content: dictionary.measurementUnits.list.dialog.showDialog.content,
          onYes: () =>{ 
            hideDialog();
            deleteMeasurementUnit(measurementUnit.id)
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
        maxWidth="md" 
        fullScreen={belowLargeScreen}
      >
        <MeasurementUnitForm measurementUnit={measurementUnit} setOpenDialog={setOpenEditDialog} />
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.measurementUnits.list.labels.actions}>
            <MoreHorizOutlined fontSize='small'/>
          </Tooltip>
      }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default MeasurementUnitItemAction;
