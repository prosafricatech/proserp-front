import { AddOutlined, LinkOffOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, Menu, MenuItem, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import ProjectUsersForm from "./ProjectUsersForm";

const ProjectUsersActionTail = () => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState("attach");

  const [menuAnchor, setMenuAnchor] = useState(null);

  const belowLargeScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const handleSelectAction = (action) => {
    setActionType(action);
    setOpenDialog(true);
    closeMenu();
  };

  return (
    <>
      <Dialog
        maxWidth="xs"
        fullWidth
        open={openDialog}
      >
        <ProjectUsersForm
          setOpenDialog={setOpenDialog}
          actionType={actionType}
        />
      </Dialog>

      <ButtonGroup variant="outlined" size="small" disableElevation>
        <Tooltip title="Attach / Detach Users">
          <IconButton onClick={openMenu}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => handleSelectAction("attach")}>
          <AddOutlined fontSize="small" style={{ marginRight: 6 }} />
          Attach Users
        </MenuItem>

        <MenuItem onClick={() => handleSelectAction("detach")}>
          <LinkOffOutlined fontSize="small" style={{ marginRight: 6 }} />
          Detach Users
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProjectUsersActionTail;
