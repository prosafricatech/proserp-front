'use client'

import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, Dialog, useMediaQuery } from '@mui/material';
import CostCenterForm from './CostCenterForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const CostCenterActionTail = () => {
  const { authUser } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const canAdd = Number(authUser?.user?.id) < 5 ;

  return (
    <React.Fragment>
      {
        canAdd && 
        <Dialog maxWidth="sm" fullScreen={belowLargeScreen} fullWidth open={openDialog}>
          <CostCenterForm setOpenDialog={setOpenDialog} />
        </Dialog>
      }

      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        {canAdd && (
          <Tooltip title={"New Cost Center"}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
        )}
      </ButtonGroup>
    </React.Fragment>
  );
};

export default CostCenterActionTail;