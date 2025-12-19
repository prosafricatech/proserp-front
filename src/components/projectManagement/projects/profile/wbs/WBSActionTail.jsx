'use client'
import { PlaylistAdd } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React from "react";
import WBSForm from "./WBSForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const WBSActionTail = ({ openDialog, setOpenDialog, group }) => {
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
    return (
      <React.Fragment>
        <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
          <WBSForm setOpenDialog={setOpenDialog} parentGroup={group} />
        </Dialog>
  
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={"New Timeline Activity"}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <PlaylistAdd />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </React.Fragment>
    );
  };

  export default WBSActionTail;