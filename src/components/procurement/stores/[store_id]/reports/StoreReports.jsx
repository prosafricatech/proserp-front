'use client'

import { FeedOutlined, TrendingDownOutlined, ViewTimelineOutlined } from '@mui/icons-material'
import { Button, Dialog, Grid, Tooltip, useMediaQuery } from '@mui/material'
import React, { useState } from 'react'
import ItemMovement from '../storeStock/ItemMovement';
import StockMovement from './stockMovement/StockMovement';
import StockReport from '../storeStock/StockReport';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCubes } from '@fortawesome/free-solid-svg-icons';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

function StoreReports() {
    const [stockReportDialogOpen, setStockReportDialogOpen] = useState(false);
    const [itemMovementDialogOpen, setItemMovementDialogOpen] = useState(false);
    const [stockMovementDialogOpen, setStockMovementDialogOpen] = useState(false);
    const [dormantStockDialogOpen, setDormantStockDialogOpen] = useState(false);

    //Screen handling constants
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <React.Fragment>
        <Dialog
            open={stockReportDialogOpen || itemMovementDialogOpen || stockMovementDialogOpen || dormantStockDialogOpen}
            scroll={'paper'}
            fullWidth   
            maxWidth='md'
            fullScreen={belowLargeScreen}
        >
            {stockReportDialogOpen && <StockReport setOpenDialog={setStockReportDialogOpen} />}
            {itemMovementDialogOpen && <ItemMovement toggleOpen={setItemMovementDialogOpen} />}
            {stockMovementDialogOpen && <StockMovement toggleOpen={setStockMovementDialogOpen} />}
            {dormantStockDialogOpen && <StockMovement toggleOpen={setDormantStockDialogOpen} dormantStock={true} />}
        </Dialog>
        <Grid container p={2}>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={'Stock Report'}>
                    <Button size='large' onClick={() => setStockReportDialogOpen(true)}>
                        <FontAwesomeIcon size='lg' icon={faCubes} style={{ fontSize: '30px', paddingRight: 5 }}/>
                        {'Stock Report'}
                    </Button>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={'Item Movement'}>
                    <Button size='large' onClick={() => setItemMovementDialogOpen(true)}>
                        <ViewTimelineOutlined fontSize='large' />
                        {' Item Movement'}
                    </Button>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={'Stock Movement'}>
                    <Button size='large' onClick={() => setStockMovementDialogOpen(true)}>
                        <FeedOutlined fontSize='large' />
                        {` Stock Movement`}
                    </Button>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 3}}>
                <Tooltip title={'Dormant Stock'}>
                    <Button size='large' onClick={() => setDormantStockDialogOpen(true)}>
                        <TrendingDownOutlined fontSize='large' />
                        {` Dormant Stock`}
                    </Button>
                </Tooltip>
            </Grid>
        </Grid>
    </React.Fragment>
  )
}

export default StoreReports