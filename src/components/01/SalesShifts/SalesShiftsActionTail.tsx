import { AddOutlined } from '@mui/icons-material';
import { ButtonGroup, Tooltip, IconButton } from '@mui/material';
import React, { useState } from 'react';
import SalesShiftForm from './SalesShiftForm';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';

const SalesShiftsActionTail = () => {
    const { checkOrganizationPermission } = useJumboAuth();
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <React.Fragment>
            <SalesShiftForm 
                open={openDialog} 
                toggleOpen={setOpenDialog} 
            />
            <ButtonGroup
                variant="outlined"
                size="small"
                disableElevation
                sx={{ '& .MuiButton-root': { px: 1 } }}
            >
                {checkOrganizationPermission(PERMISSIONS.FUEL_SALES_SHIFT_CREATE) && (
                    <Tooltip title="New Sales Shift">
                        <IconButton onClick={() => setOpenDialog(true)}>
                            <AddOutlined />
                        </IconButton>
                    </Tooltip>
                )}
            </ButtonGroup>
        </React.Fragment>
    );
};

export default SalesShiftsActionTail;