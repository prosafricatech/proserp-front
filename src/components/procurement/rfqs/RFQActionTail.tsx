'use client';

import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import RFQDialogForm from './form/RFQDialogForm';

function RFQActionTail() {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (!checkOrganizationPermission(PERMISSIONS.RFQS_CREATE)) {
    return null;
  }

  return (
    <React.Fragment>
      <Dialog
        fullWidth
        maxWidth="xl"
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        open={openDialog}
      >
        <RFQDialogForm toggleOpen={setOpenDialog} />
      </Dialog>
      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        <Tooltip title="New RFQ">
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
}

export default RFQActionTail;
