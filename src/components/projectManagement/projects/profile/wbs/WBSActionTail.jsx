'use client'
import { ContentCopy, PlaylistAdd } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import WBSForm from "./WBSForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import WBSCloneDialog from "./clone/WBSCloneDialog";

const WBSActionTail = ({ openDialog, setOpenDialog, group }) => {
    const { theme } = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
    const [openCloneDialog, setOpenCloneDialog] = useState(false);
  
    return (
      <React.Fragment>
        <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
          <WBSForm setOpenDialog={setOpenDialog} parentGroup={group} />
        </Dialog>

        <Dialog maxWidth="xl" fullWidth fullScreen={belowLargeScreen} open={openCloneDialog}>
          <WBSCloneDialog setOpenDialog={setOpenCloneDialog} />
        </Dialog>
  
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={"Clone WBS From Another Project"}>
            <IconButton onClick={() => setOpenCloneDialog(true)}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
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