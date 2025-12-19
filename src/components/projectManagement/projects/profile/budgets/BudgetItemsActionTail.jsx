'use client'
import { VisibilityOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import BudgetItemsForm from "./budgetItems/BudgetItemsForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const BudgetItemsActionTail = ({budget}) => {
    const { theme } = useJumboTheme();
    const [openDialog, setOpenDialog] = useState(false)
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  
    return (
      <React.Fragment>
        <Dialog maxWidth="xl" width={'100%'} fullWidth scroll={belowLargeScreen ? 'body' : 'paper'} fullScreen={belowLargeScreen} open={openDialog}>
          <BudgetItemsForm setOpenDialog={setOpenDialog} budget={budget}/>
        </Dialog>
  
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
          <Tooltip title={"View Items"}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <VisibilityOutlined/>
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </React.Fragment>
    );
  };

  export default BudgetItemsActionTail;