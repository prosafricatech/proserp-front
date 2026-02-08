import { AddOutlined } from '@mui/icons-material'
import { ButtonGroup, Tooltip,IconButton, Dialog, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import InventoryTransferForm from './form/InventoryTransferForm'
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks'

const InventoryTransferActionTail = ({type}) => {
    const [openDialog, setOpenDialog] = useState(false);

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    return (
        <React.Fragment>
            <Dialog fullWidth fullScreen={belowLargeScreen} scroll={belowLargeScreen ? 'body' : 'paper'}  maxWidth="md" open={openDialog}>
                {type !== 'all' && <InventoryTransferForm toggleOpen={setOpenDialog} type={type}/>}
            </Dialog>
            <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
                {
                    <Tooltip title={'New Inventory Transfer'}>
                        <IconButton onClick={() => setOpenDialog(true)}>
                            <AddOutlined/>
                        </IconButton>
                    </Tooltip>
                }
            </ButtonGroup>
        </React.Fragment>
    )
}

export default InventoryTransferActionTail