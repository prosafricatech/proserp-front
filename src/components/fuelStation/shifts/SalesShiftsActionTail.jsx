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
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import SaleShiftForm from './SaleShiftForm/SaleShiftForm';

const SalesShiftsActionTail = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const { checkOrganizationPermission } = useJumboAuth();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (!checkOrganizationPermission(PERMISSIONS.FUEL_SALES_SHIFT_CREATE)) {
    return null;
  }
  
  return (
    <>
      <Dialog maxWidth='xl' fullWidth fullScreen={belowLargeScreen} open={openDialog}>
        <SaleShiftForm setOpenDialog={setOpenDialog} />
      </Dialog>
      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title='Add Sales Shift'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <AddOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default SalesShiftsActionTail;
