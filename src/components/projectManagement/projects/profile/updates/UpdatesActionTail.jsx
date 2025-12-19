'use client'
import { AddOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import UpdatesForm from "./UpdatesForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const UpdatesActionTail = () => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
  return (
    <React.Fragment>
      <Dialog maxWidth="lg" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        <UpdatesForm setOpenDialog={setOpenDialog}/>
      </Dialog>

      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        <Tooltip title={"Add Updates"}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default UpdatesActionTail;