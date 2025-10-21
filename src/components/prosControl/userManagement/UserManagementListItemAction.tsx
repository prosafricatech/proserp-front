import {
  MoreHorizOutlined,
  Block as BlockIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import {
  Dialog,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { JumboDdMenu } from '@jumbo/components';
import userManagementServices from './user-management-services';
import VerifyUserFormDialog from './VerifyUserFormDialog';
import { User } from './UserManagementType';
import { MenuItemProps } from '@jumbo/types';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

    interface ApiResponse {
      message?: string;
      data?: any;
    }

    const UserManagementListItemAction = ({
        user,
        onUserUpdated,
        }: {
        user: User;
        onUserUpdated?: () => void;
        }) => {
        const [openEditDialog, setOpenEditDialog] = useState(false);
        const { showDialog, hideDialog } = useJumboDialog();
        const { enqueueSnackbar } = useSnackbar();
        const queryClient = useQueryClient();
        const { theme } = useJumboTheme();
        const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
        const dictionary = useDictionary();
console.log(dictionary.userManagement.list)
        const handleApiError = (error: any, fallback: string) => {
          const message = error?.response?.data?.message || error.message || fallback;
          enqueueSnackbar(message, { variant: 'error' });
          };

        const { mutate: deactivateUser } = useMutation<ApiResponse, unknown, void>({
          mutationFn: () => userManagementServices.deactivate(user),
          onSuccess: (data) => {
          enqueueSnackbar(data?.message || 'User deactivated successfully', { variant: 'success' });
          queryClient.invalidateQueries({ queryKey: ['userManagement'] });
          onUserUpdated?.();
          },
          onError: (error) => handleApiError(error, 'Deactivation failed'),
        });

        const { mutate: reactivateUser } = useMutation<ApiResponse, unknown, void>({
          mutationFn: () => userManagementServices.reactivate(user),
          onSuccess: (data) => {
          enqueueSnackbar(data?.message || 'User reactivated successfully', { variant: 'success' });
          queryClient.invalidateQueries({ queryKey: ['userManagement'] });
          onUserUpdated?.();
          },
          onError: (error) => handleApiError(error, 'Reactivation failed'),
          });

          const isActive = user.status === 'active';

          const menuItems: MenuItemProps[] = [
            {
              icon: isActive ? <BlockIcon sx={{ color: 'error.main' }} /> : <ReplayIcon sx={{ color: 'primary.main' }} />,
              title: isActive ? dictionary.userManagement.list.actionsTitle.labels.deactivate : dictionary.userManagement.list.actionsTitle.labels.reactivate,
              action: isActive ? 'deactivate' : 'reactivate',
            },
          ];

          const handleItemAction = (menuItem: MenuItemProps) => {
            switch (menuItem.action) {
              case 'deactivate':
                showDialog({
                  title: 'Confirm User Deactivation',
                  content: 'Are you sure you want to deactivate this user?',
                  variant: 'confirm',
                  onYes: () => {
                    hideDialog();
                    deactivateUser();
                  },
                  onNo: () => hideDialog(),
                });
                break;

              case 'reactivate':
                showDialog({
                  title: 'Confirm User Reactivation',
                  content: 'Are you sure you want to reactivate this user?',
                  variant: 'confirm',
                  onYes: () => {
                    hideDialog();
                    reactivateUser();
                  },
                  onNo: () => hideDialog(),
                });
                break;

              default:
                console.warn(`Unhandled action: ${menuItem.action}`);
            }
          };

    return (
      <>
        <Dialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          fullWidth
          maxWidth="sm"
          fullScreen={belowLargeScreen}
        >
          <VerifyUserFormDialog
            open={openEditDialog}
            user={user}
            setOpenDialog={setOpenEditDialog}
          />
        </Dialog>

        <JumboDdMenu
          icon={
            <Tooltip title={dictionary.userManagement.list.labels.userActions}>
              <MoreHorizOutlined fontSize="small" />
            </Tooltip>
          }
          menuItems={menuItems}
          onClickCallback={handleItemAction}
        />
      </>
    );
  };

export default UserManagementListItemAction;
