'use client'
import { AddOutlined, LinkOffOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, Menu, MenuItem, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import ProjectUsersForm from "./ProjectUsersForm";

const ProjectUsersActionTail = () => {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Dialog
        maxWidth="xs"
        fullWidth
        open={openDialog}
      >
        <ProjectUsersForm
          setOpenDialog={setOpenDialog}
        />
      </Dialog>

      <ButtonGroup variant="outlined" size="small" disableElevation>
        <Tooltip title="Attach Users">
          <IconButton onClick={()=> setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default ProjectUsersActionTail;
