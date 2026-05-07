'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AddOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import LeaveRequestForm from './LeaveRequestForm';

const LeaveRequestActionTail = ({ employeeId }: { employeeId?: number }) => {
  const [openDialog, setOpenDialog] = useState(false);

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Dialog maxWidth='md' fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        <LeaveRequestForm setOpenDialog={setOpenDialog} employeeId={employeeId} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title='Add Leave Request'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default LeaveRequestActionTail;
