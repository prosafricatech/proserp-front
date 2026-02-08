'use client'
import { AddOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import BudgetsForm from "./BudgetsForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const BudgetsActionTail = () => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false)
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
    return (
      <React.Fragment>
        <Dialog maxWidth="md" fullWidth scroll={belowLargeScreen ? 'body' : 'paper'} fullScreen={belowLargeScreen} open={openDialog}>
          <BudgetsForm setOpenDialog={setOpenDialog}/>
        </Dialog>
  
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={"Add New Project Budget"}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined/>
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </React.Fragment>
    );
  };

  export default BudgetsActionTail;