'use client'
import { AddOutlined } from '@mui/icons-material'
import { ButtonGroup, Tooltip,IconButton, Dialog, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import ProformaForm from './form/ProformaForm'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'
import { PERMISSIONS } from '@/utilities/constants/permissions'

const ProformaActionTail = () => {

    const {checkOrganizationPermission} = useJumboAuth();
    const [openDialog, setOpenDialog] = useState(false);

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Dialog fullWidth scroll={belowLargeScreen ? 'body' : 'paper'} fullScreen={belowLargeScreen}  maxWidth="lg" open={openDialog}>
            <ProformaForm toggleOpen={setOpenDialog} />
        </Dialog>
        <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
            {
                checkOrganizationPermission(PERMISSIONS.PROFORMA_INVOICES_CREATE) && (
                    <Tooltip title={'New Proforma'}>
                        <IconButton onClick={() => setOpenDialog(true)}>
                            <AddOutlined/>
                        </IconButton>
                    </Tooltip>
                )
            }
         </ButtonGroup>
    </React.Fragment>
   )
}

export default ProformaActionTail