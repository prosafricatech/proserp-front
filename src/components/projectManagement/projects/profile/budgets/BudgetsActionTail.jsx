'use client'
import { AddOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import BudgetsForm from "./BudgetsForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const BudgetsActionTail = ({ isProjectBudget=true }) => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false)
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
    return (
      <React.Fragment>
        <Dialog maxWidth="lg" fullWidth scroll={belowLargeScreen ? 'body' : 'paper'} fullScreen={belowLargeScreen} open={openDialog}>
          <BudgetsForm setOpenDialog={setOpenDialog} isProjectBudget={isProjectBudget} />
        </Dialog>
  
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={isProjectBudget ? "Add New Project Budget" : "Add New Budget"}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined/>
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </React.Fragment>
    );
  };

  export default BudgetsActionTail;