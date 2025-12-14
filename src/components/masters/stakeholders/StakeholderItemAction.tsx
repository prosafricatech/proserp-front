'use client'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import stakeholderServices from './stakeholder-services';
import StakeholderDialogForm from './StakeholderDialogForm';
import { LoadingButton } from '@mui/lab';
import { MenuItemProps } from '@jumbo/types';
import { Stakeholder } from './StakeholderType';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface StakeholderItemActionProps {
  stakeholder: Stakeholder;
}

interface DeleteResponse {
  message: string;
}

const StakeholderItemAction: React.FC<StakeholderItemActionProps> = ({ stakeholder }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();

  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const queryClient = useQueryClient();

  const { mutate: deleteStakeholder, isPending } = useMutation<DeleteResponse, Error, number>({
    mutationFn: (id: number) => stakeholderServices.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
      enqueueSnackbar(dictionary.stakeholders.form.messages.deleteSuccess, {
        variant: 'success',
      });
      setOpenDeleteDialog(false);
    },
    onError: (error) => {
      enqueueSnackbar(dictionary.stakeholders.form.errors.messages.deleteResponse, {
        variant: 'error',
      });
      queryClient.invalidateQueries({ queryKey: ['stakeholders'] });
    },
  });

  const menuItems: MenuItemProps[] = [
    { icon: <EditOutlined />, title: dictionary.stakeholders.list.actionsTittle.edit, action: 'edit' },
    { icon: <DeleteOutlined color='error' />, title: dictionary.stakeholders.list.actionsTittle.delete, action: 'delete' }
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        setOpenDeleteDialog(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      {/* Dialog for Edit */}
      <Dialog
        open={openEditDialog}
        scroll={'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
      >
        <StakeholderDialogForm stakeholder={stakeholder} toggleOpen={setOpenEditDialog} />
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.stakeholders.list.labels.actions}>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
      
      {/* Dialog for delete confirmation */}
      <Dialog open={openDeleteDialog}>
        <DialogTitle>{dictionary.stakeholders.list.dialog.showDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
          {dictionary.stakeholders.list.dialog.showDialog.content.replace('{name}',stakeholder.name)}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            {dictionary.stakeholders.list.actionsTittle.cancel}
          </Button>
          <LoadingButton
            loading={isPending}
            onClick={() => deleteStakeholder(stakeholder.id)}
            color="primary"
          >
          {dictionary.stakeholders.list.actionsTittle.comfirm}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StakeholderItemAction;