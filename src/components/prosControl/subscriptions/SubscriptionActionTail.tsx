'use client'
import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, Dialog, useMediaQuery} from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import SubscriptionsForm from '@/components/Organizations/profile/subscriptions/SubscriptionsForm';

const SubscriptionActionTail = () => {
  const { checkPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    checkPermission(PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_MANAGE) &&
    <React.Fragment>
        <Dialog maxWidth="lg" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
            <SubscriptionsForm setOpenDialog={setOpenDialog} isFromProsAfricanSubscriptions={true}/>
        </Dialog>

        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
            {checkPermission(PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_MANAGE) && (
                <Tooltip title={"Add Subscriptions"}>
                    <IconButton onClick={() => setOpenDialog(true)}>
                        <AddOutlined />
                    </IconButton>
                </Tooltip>
            )}
        </ButtonGroup>
    </React.Fragment>
  );
};

export default SubscriptionActionTail;