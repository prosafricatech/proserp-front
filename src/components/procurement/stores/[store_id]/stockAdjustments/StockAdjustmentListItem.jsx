import { Box, Divider, Grid, Tooltip, Typography } from '@mui/material'
import React from 'react'
import StockAdjustmentListItemAction from './StockAdjustmentListItemAction'
import { readableDate } from '@/app/helpers/input-sanitization-helpers'

function StockAdjustmentListItem({stockAdjustment}) {
  return (
    <>
        <Grid
            sx={{
                cursor: 'pointer',
                '&:hover': {
                    bgcolor: 'action.hover',
                }
            }}
            container 
            columnSpacing={1}
            alignItems={'center'}
        >
            
            <Grid size={{xs: 6, md: 2}}>
                <Tooltip title='Adjustment Date'>
                    <Typography>{`${readableDate(stockAdjustment.adjustment_date)}`}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}}>
                <Tooltip title='Adjustment No.'>
                    <Typography>{stockAdjustment.adjustmentNo}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 1}}>
                <Tooltip title='Reference'>
                    <Typography>{stockAdjustment.reference}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}}>
                <Tooltip title='Reason'>
                    <Typography>{stockAdjustment.reason}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 10, md: 4}}>
                <Tooltip title='Description'>
                    <Typography>{stockAdjustment.narration}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 2, md: 1}}>
                <Box display={'flex'} flexDirection={'row'} justifyContent='flex-end' >
                    <StockAdjustmentListItemAction stockAdjustment={stockAdjustment} />
                </Box>
            </Grid>
        </Grid>
        <Divider/>
    </>
  )
}

export default StockAdjustmentListItem