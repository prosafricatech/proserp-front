'use client'
import { AddTask } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import SubContractTasks from "./SubContractTasks";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";

const SubContractTasksActionTail = ({subContract, subContractTasks}) => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false)
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const existingTasks = subContractTasks?.flatMap(contract => contract.project_task)

  return (
    <React.Fragment>
      <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        <SubContractTasks setOpenDialog={setOpenDialog} subContract={subContract} existingTasks={existingTasks}/>
      </Dialog>

      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        <Tooltip title={"Add New Task"}>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddTask/>
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default SubContractTasksActionTail;