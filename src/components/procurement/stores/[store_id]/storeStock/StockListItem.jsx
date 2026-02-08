import { Box, Divider, Grid, Tooltip, Typography } from '@mui/material'
import React from 'react'
import StockListItemAction from './StockListItemAction'

function StockListItem({productStock}) {
  return (
    <React.Fragment>
        <Grid
                container 
                columnSpacing={1}
                sx={{
                cursor: 'pointer',
                borderTop: 1,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
                padding: 1,
            }}
            alignItems={'center'}
        >
            
            <Grid size={{xs: 12, md: 6}}>
                <Tooltip title='Brand and Name'>
                    <Typography>{`${productStock.name}`}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 4, md: 3}}>
                <Tooltip title='Product Category'>
                    <Typography>{productStock.category_name}</Typography>
                </Tooltip>
            </Grid>
            <Grid size={{xs: 4, md: 2}}>
                <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'} > 
                    <Tooltip title='Stock'>
                        <Typography>{`${productStock.balance} ${productStock.measurement_unit.symbol}`}</Typography>
                    </Tooltip>
                </Box>
            </Grid>
            <Grid size={{xs: 4, md: 1}}>
                <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'} > 
                    <StockListItemAction productStock={productStock}/>
                </Box>
            </Grid>
        </Grid>
        <Divider/>
    </React.Fragment>
  )
}

export default StockListItem