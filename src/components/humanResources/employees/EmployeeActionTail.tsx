import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { AddOutlined, UploadFileOutlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  Tooltip,
  useMediaQuery,
  Box,
  alpha,
} from '@mui/material';
import { useState } from 'react';
import { DepartmentsProvider } from '../departments/DepartmentsProvider';
import EmployeeForm from './EmployeeForm';
import EmployeeOnboardingDialog from './EmployeeOnboardingDialog';
import { EmployeesProvider } from './EmployeesProvider';

// Simple Excel-styled icon with "XLS" badge
const ExcelUploadIcon = () => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <UploadFileOutlined 
      sx={{ 
        color: '#217346',
        fontSize: 24,
      }} 
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: -4,
        right: -4,
        fontSize: 7,
        fontWeight: 700,
        bgcolor: '#217346',
        color: 'white',
        px: 0.4,
        borderRadius: 0.5,
        lineHeight: 1.2,
        fontFamily: 'sans-serif',
      }}
    >
      XLS
    </Box>
  </Box>
);

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
        onClose={() => setOpenDialog(false)}
      >
        <DepartmentsProvider>
          <EmployeesProvider>
            <EmployeeForm setOpenDialog={setOpenDialog} />
          </EmployeesProvider>
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
        sx={{ 
          '& .MuiButton-root': { px: 1 },
          '& .MuiButtonGroup-grouped:not(:last-of-type)': {
            borderColor: 'divider',
          },
        }}
      >
        <Tooltip title='Employee Onboarding Import'>
          <IconButton 
            onClick={() => setOpenOnboardingDialog(true)}
            sx={{
              color: '#217346',
              '&:hover': {
                bgcolor: alpha('#217346', 0.08),
              },
            }}
          >
            <ExcelUploadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Add Employee'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default EmployeeActionTail;