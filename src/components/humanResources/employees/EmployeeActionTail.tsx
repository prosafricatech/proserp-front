import { AddOutlined, UploadFileOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useState } from 'react';
import { DepartmentsProvider } from '../departments/DepartmentsProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import EmployeeForm from './EmployeeForm';
import EmployeeOnboardingDialog from './EmployeeOnboardingDialog';

const EmployeeActionTail = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openOnboardingDialog, setOpenOnboardingDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <>
      <Dialog
        open={openDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        <DepartmentsProvider>
          <EmployeeForm setOpenDialog={setOpenDialog} />
        </DepartmentsProvider>
      </Dialog>
      <Dialog
        open={openOnboardingDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
        onClose={() => setOpenOnboardingDialog(false)}
      >
        <EmployeeOnboardingDialog setOpenDialog={setOpenOnboardingDialog} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title='Add Employee'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title='Employee Onboarding Import'>
          <IconButton onClick={() => setOpenOnboardingDialog(true)}>
            <UploadFileOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default EmployeeActionTail;
