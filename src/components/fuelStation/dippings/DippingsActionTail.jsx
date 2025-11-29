import React, { useState } from 'react';
import useJumboAuth from '@jumbo/hooks/useJumboAuth';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, Dialog, useMediaQuery} from '@mui/material';
import { PERMISSIONS } from 'app/utils/constants/permissions';
import DippingsForm from './DippingsForm';
import { useJumboTheme } from '@jumbo/hooks';

const DippingsActionTail = () => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Dialog maxWidth="md" scroll={belowLargeScreen ? 'body' : 'paper'} fullWidth fullScreen={belowLargeScreen} open={openDialog}>
            <DippingsForm setOpenDialog={setOpenDialog} />
        </Dialog>

        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
            {checkOrganizationPermission(PERMISSIONS.USERS_INVITE) && (
            <Tooltip title={"New Dippings"}>
                <IconButton onClick={() => setOpenDialog(true)}>
                  <AddOutlined />
                </IconButton>
            </Tooltip>
            )}
        </ButtonGroup>
    </React.Fragment>
  );
};

export default DippingsActionTail;