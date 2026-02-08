"use client";

import React, { useContext, useState } from "react";
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from "@mui/icons-material";
import { Dialog, Tooltip } from "@mui/material";
import { useJumboDialog } from "@jumbo/components/JumboDialog/hooks/useJumboDialog";
import { useSnackbar } from "notistack";
import PermissionsForm from "./PermissionsForm";
import supportServices from "../support-services";
import { SelectedTab } from "../troubleshooting/Troubleshooting";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceType } from "@/utilities/helpers/user-agent-helpers";
import { JumboDdMenu } from "@jumbo/components";
import { MenuItemProps } from "@jumbo/types";

// ---- Types ----
export interface Permission {
  id: string | number;
  name: string;
  description?: string;
  is_core?: boolean;
  modules?: { id: string | number; name: string }[];
}

interface PermissionItemActionProps {
  permission: Permission;
}

const PermissionItemAction: React.FC<PermissionItemActionProps> = ({ permission }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = deviceType() === "mobile";

  const { activeTab } = useContext(SelectedTab);
  const isOrganizationPermission = activeTab === 1;

  const { mutate: deletePermission } = useMutation({
    mutationFn: isOrganizationPermission
      ? supportServices.deletePermission
      : supportServices.deleteProsPermission,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === (isOrganizationPermission ? "organizationPermissions" : "prosPermissions"),
      });
      enqueueSnackbar(data.message, { variant: "success" });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: "error" });
    },
  });

  const menuItems: MenuItemProps[] = [
    { icon: <EditOutlined />, title: "Edit", action: "edit" },
    { icon: <DeleteOutlined color="error" />, title: "Delete", action: "delete" },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case "edit":
        setOpenEditDialog(true);
        break;
      case "delete":
        showDialog({
          title: "Confirm Permission",
          content: "Are you sure you want to delete this Permission?",
          onYes: () => {
            hideDialog();
            deletePermission(permission);
          },
          onNo: () => hideDialog(),
          variant: "confirm",
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog scroll="body" maxWidth="lg" fullWidth open={openEditDialog} fullScreen={isMobile}>
        {openEditDialog && <PermissionsForm setOpenDialog={setOpenEditDialog} permission={permission} />}
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

export default PermissionItemAction;
