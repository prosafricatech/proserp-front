import React, { useState } from 'react';
import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton, Dialog, useMediaQuery} from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import CertificateForm from './form/CertificateForm';

const CertificatesActionTail = ({subContract}) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);

  //Screen handling constants
  const {theme} = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Dialog maxWidth="md" fullWidth fullScreen={belowLargeScreen} open={openDialog}>
            <CertificateForm setOpenDialog={setOpenDialog} subContract={subContract}/>
        </Dialog>

        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
            {checkOrganizationPermission(PERMISSIONS.USERS_INVITE) && (
                <Tooltip title={"Add Certificate"}>
                    <IconButton onClick={() => setOpenDialog(true)}>
                        <AddOutlined />
                    </IconButton>
                </Tooltip>
            )}
        </ButtonGroup>
    </React.Fragment>
  );
};

export default CertificatesActionTail;