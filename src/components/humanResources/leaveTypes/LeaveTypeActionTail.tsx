import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
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
import LeaveTypeForm from './LeaveTypeForm';

const LeaveTypeActionTail = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  return (
    <>
      <Dialog maxWidth='md' fullScreen={belowLargeScreen} open={openDialog}>
        <LeaveTypeForm setOpenDialog={setOpenDialog} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        {/* {checkOrganizationPermission(PERMISSIONS.USERS_INVITE) && ( */}
        <Tooltip title='Add Leave Type'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
        {/* )} */}
      </ButtonGroup>
    </>
  );
};

export default LeaveTypeActionTail;
