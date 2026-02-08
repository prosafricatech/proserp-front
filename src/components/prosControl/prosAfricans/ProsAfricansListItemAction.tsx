import { AdminPanelSettingsOutlined, GroupRemoveOutlined, MoreHorizOutlined, PersonRemoveOutlined } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import ChangeProsAfricanRole from './roles/ChangeProsAfricanRole';
import prosAfricansServices from './prosAfricansServices';
import { useSnackbar } from 'notistack';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import { JumboDdMenu } from '@jumbo/components';
import { MenuItemProps } from '@jumbo/types';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
}

interface ProsAfricansListItemActionProps {
  user: User;
}

interface DetachActionData {
  action: string;
  user_id: string;
}

const ProsAfricansListItemAction: React.FC<ProsAfricansListItemActionProps> = ({ user }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { authUser, checkPermission } = useJumboAuth();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const menuItems: MenuItemProps[] = [];

  if (authUser?.user?.id === user.id) {
    menuItems.push({
      icon: <PersonRemoveOutlined color="error" />,
      title: "Leave",
      action: "leave",
    });
  } else if (checkPermission(PROS_CONTROL_PERMISSIONS.PROSAFRICANS_MANAGE)) {
    menuItems.push(
      {
        icon: <AdminPanelSettingsOutlined color="primary" />,
        title: "Edit Roles",
        action: "editRoles",
      },
      {
        icon: <GroupRemoveOutlined color="error" />,
        title: "Detach",
        action: "detach",
      }
    );
  }

  // detach mutation
  const userDetachAction = useMutation({
    mutationFn: (data: DetachActionData) => prosAfricansServices.userDetachAction(data),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["prosAfricans"] });
      hideDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    },
  });

  // Leave mutation
  const userLeaveAction = useMutation({
    mutationFn: (data: DetachActionData) => prosAfricansServices.userLeaveAction(data),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message, { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["prosAfricans"] });
      hideDialog();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || "Something went wrong", {
        variant: "error",
      });
    },
  });

  const handleItemAction = (selectedMenuItem: MenuItemProps) => {
    const { action } = selectedMenuItem;

    switch (action) {
      case "detach":
        showDialog({
          variant: "confirm",
          title: `Detach ${user.name}?`,
          content: `Revoke all ProsAfricans access for this Member`,
          onYes: () =>
            userDetachAction.mutate({
              action: "detach",
              user_id: user.id,
            }),
          onNo: hideDialog,
        });
        break;

      case "leave":
        showDialog({
          variant: "confirm",
          title: `Leave ${user.name}?`,
          content: `You won't be able to be a member of the ProsAfrican Community until you are added again.`,
          onYes: () =>
            userLeaveAction.mutate({
              action: "leave",
              user_id: String(authUser?.user.id),
            }),
          onNo: hideDialog,
        });
        break;

      case "editRoles":
        showDialog({
          title: `Change ${user.name} roles`,
          content: <ChangeProsAfricanRole user={user}/>,
        });
        break;

      default:
        break;
    }
  };

  if (!menuItems.length) return null;

  return (
    <JumboDdMenu
      icon={
        <Tooltip title="Actions">
          <MoreHorizOutlined fontSize="small" />
        </Tooltip>
      }
      menuItems={menuItems}
      onClickCallback={handleItemAction}
    />
  );
};

export default ProsAfricansListItemAction;