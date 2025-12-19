'use client'
import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, Dialog, useMediaQuery} from '@mui/material';
import InventoryConsumptionsForm from './form/InventoryConsumptionForm';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

const InventoryConsumptionsActionTail = ({consumptionTab = false}) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
      <Dialog maxWidth="lg" fullWidth open={openDialog} scroll={belowLargeScreen ? 'body' : 'paper'} fullScreen={belowLargeScreen}>
        <InventoryConsumptionsForm setOpenDialog={setOpenDialog} consumptionTab={consumptionTab}/>
      </Dialog>
      <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
        {checkOrganizationPermission(PERMISSIONS.INVENTORY_CONSUMPTIONS_CREATE) && (
          <Tooltip title={"New Inventory Consumptions"}>
            <IconButton onClick={() => setOpenDialog(true)}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
        )}
      </ButtonGroup>
    </React.Fragment>
  );
};

export default InventoryConsumptionsActionTail;