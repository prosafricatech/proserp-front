import { AddOutlined } from '@mui/icons-material';
import { Autocomplete,Button, Dialog, Grid,TextField, Tooltip } from '@mui/material';
import React, { useState } from 'react'
import StoreForm from '../StoreForm';
import { useStoreProfile } from './StoreProfileProvider'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function StoreSelectionForMobile() {
    const {activeStore,setActiveStore,storeArrays:{selectOptions}} = useStoreProfile();
    const { checkOrganizationPermission } = useJumboAuth();
    const [openDialog, setOpenDialog] = useState(false);

  return (
    <Grid container m={2} spacing={2}>
        <Grid size={12}>
            <Autocomplete
                options={selectOptions}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={activeStore}
                renderInput={(params) => (
                    <TextField 
                        {...params}
                        size="small"
                        label="Sub-store select"
                    />
                )}
                onChange={(e, newValue) => {
                    setActiveStore(newValue ? newValue : activeStore);
                }}
            />
        </Grid>
        <Grid size={10}>
            <React.Fragment>
                <Dialog maxWidth="xs" open={openDialog}>
                    <StoreForm setOpenDialog={setOpenDialog} parentOptions={selectOptions}/>
                </Dialog>
                    {checkOrganizationPermission(PERMISSIONS.USERS_INVITE) && (
                    <Tooltip title={"Add Sub-store"}>
                        <Button variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }} onClick={() => setOpenDialog(true)}>
                            <AddOutlined /> Sub-store
                        </Button>
                    </Tooltip>
                    )}
            </React.Fragment>
        </Grid>
    </Grid>
  )
}

export default StoreSelectionForMobile