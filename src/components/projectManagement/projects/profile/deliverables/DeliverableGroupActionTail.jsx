'use client'
import { PlaylistAdd } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React from "react";
import DeliverableGroupForm from "./DeliverableGroupForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const DeliverableGroupActionTail = ({ openDialog, setOpenDialog, group }) => {
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
    return (
      <React.Fragment>
        <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
          <DeliverableGroupForm setOpenDialog={setOpenDialog} parentGroup={group} />
        </Dialog>
  
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={"New Deliverable Group"}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <PlaylistAdd />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </React.Fragment>
    );
  };

  export default DeliverableGroupActionTail;