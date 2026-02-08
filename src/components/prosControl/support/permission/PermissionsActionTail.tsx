"use client";

import React, { useContext, useState } from "react";
import { AddOutlined } from "@mui/icons-material";
import {
  ButtonGroup,
  Tooltip,
  IconButton,
  Dialog,
} from "@mui/material";
import PermissionsForm from "./PermissionsForm";
import { SelectedTab } from "../troubleshooting/Troubleshooting";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { deviceType } from "@/utilities/helpers/user-agent-helpers";
import { PROS_CONTROL_PERMISSIONS } from "@/utilities/constants/prosControlPermissions";

const PermissionsActionTail: React.FC = () => {
  const { checkPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const isMobile = deviceType() === "mobile";
  const { activeTab } = useContext(SelectedTab);
  const isOrganizationPermission = activeTab === 1;

  return (
    <>
      <Dialog
        maxWidth="lg"
        open={openDialog}
        fullWidth
        fullScreen={isMobile}
        onClose={() => setOpenDialog(false)}
      >
        <PermissionsForm setOpenDialog={setOpenDialog} />
      </Dialog>

      <ButtonGroup
        variant="outlined"
        size="small"
        disableElevation
        sx={{ "& .MuiButton-root": { px: 1 } }}
      >
        {checkPermission(PROS_CONTROL_PERMISSIONS.PERMISSIONS_MANAGE) && (
          <Tooltip
            title={
              isOrganizationPermission
                ? "New Organization Permissions"
                : "New Pros Permissions"
            }
          >
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
        )}
      </ButtonGroup>
    </>
  );
};

export default PermissionsActionTail;
