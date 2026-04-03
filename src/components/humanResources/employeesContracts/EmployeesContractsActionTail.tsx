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
import { DesignationsProvider } from '../designations/DesignationsProvider';
import { EmployeesProvider } from '../employees/EmployeesProvider';
import EmployeesContractsForm from './EmployeesContractsForm';

const EmployeesContractsActionTail = ({ employeeId }: { employeeId?: number }) => {
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  return (
    <>
      <Dialog maxWidth='md' fullScreen={belowLargeScreen} open={openDialog}>
        <EmployeesProvider>
          <DesignationsProvider>
            <EmployeesContractsForm setOpenDialog={setOpenDialog} employeeId={employeeId} />
          </DesignationsProvider>
        </EmployeesProvider>
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        {/* {checkOrganizationPermission(PERMISSIONS.USERS_INVITE) && ( */}
        <Tooltip title='Add Contract'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
        {/* )} */}
      </ButtonGroup>
    </>
  );
};

export default EmployeesContractsActionTail;
