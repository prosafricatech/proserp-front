import React, { useContext } from 'react'
import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { UndoOutlined, VisibilityOutlined } from '@mui/icons-material';
import { listItemContext } from './InventoryTransferListItem';
import { useStoreProfile } from '../../StoreProfileProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function InventoryTransferTrns() {
    const {setSelectedInventoryTrn, transfer, setOpenDialog, setOpenDocumentDialog, inventoryTrns} = useContext(listItemContext);
    const {activeStore} = useStoreProfile();

  return (
    <React.Fragment>
        {inventoryTrns?.length > 0 && <Typography variant="body1">Transfer TRNs</Typography>}
        {inventoryTrns &&
        inventoryTrns.map((inventoryTrn) => (
            <Grid
            key={inventoryTrn.id}
            sx={{
                cursor: 'pointer',
                borderTop: 1,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                paddingX: 1,
            }}
            columnSpacing={2}
            alignItems={'center'}
            container
            width="100%"
            >
            <Grid size={{xs: 4, md: 3}}>
                <Tooltip title={'Date Received'}>
                    <Typography>
                        {readableDate(inventoryTrn?.date_received)}
                    </Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 4, md: 3}} align="center">
                <Tooltip title={'Grn No.'}>
                   <Typography>{inventoryTrn?.trnNo}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={4} align="center">
                <Tooltip title={'Remark'}>
                  <Typography>{inventoryTrn?.remarks}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 2}}>
                <Box
                display={'flex'}
                flexDirection={'row'}
                justifyContent={'flex-end'}
                >
                    <Tooltip title={`View ${inventoryTrn.trnNo}`}>
                        <IconButton
                            onClick={() => {
                                setSelectedInventoryTrn(inventoryTrn);
                                setOpenDocumentDialog(true);
                            }}
                        >
                            <VisibilityOutlined
                                style={{ marginRight: '8px' }}
                            />
                        </IconButton>
                    </Tooltip>
                    {
                    (activeStore.id !== transfer.source_store_id) &&
                        <Tooltip title={`Unreceive ${inventoryTrn.trnNo}`}>
                            <IconButton
                                onClick={() => {
                                    setSelectedInventoryTrn(inventoryTrn);
                                    setOpenDialog(true);
                                }}
                            >
                            <UndoOutlined color='error'/>
                            </IconButton>
                        </Tooltip>
                    }
                </Box>
            </Grid>
            </Grid>
        ))}
    </React.Fragment>
  )
}

export default InventoryTransferTrns