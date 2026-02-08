import { Box, Chip, Grid, Tooltip, Typography } from '@mui/material'
import React from 'react'
import LowStockThresholdItemAction from './LowStockThresholdItemAction'

function LowStockThresholdListItem({lowStockAlert}) {
  return (
    <React.Fragment>
      <Grid
        sx={{
          cursor: 'pointer',
          borderTop: 1,
          borderColor: 'divider',
          '&:hover': {
              bgcolor: 'action.hover',
          },
          padding: 1,
        }}
        container 
        columnSpacing={1}
        mt={1}
        alignItems={'center'}
      >
          
        <Grid size={{xs: 12, md: 6}}>
          <Tooltip title='Product Name'>
            <Typography>{lowStockAlert.product.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Tooltip title="Cost Center Name">
            {lowStockAlert.cost_centers && lowStockAlert.cost_centers.length > 0 ? (
              <div>
                {lowStockAlert.cost_centers.map((costCenter) => (
                  <Chip key={costCenter.id} label={costCenter.name} size="small" style={{ marginRight: 4 }} />
                ))}
              </div>
            ) : (
              <Typography variant="h5" textAlign='center' fontSize={14} lineHeight={1.25} mb={0} noWrap>
                -
              </Typography>
            )}
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 2}} textAlign='center'>
          <Tooltip title='Threshold'>
            <Chip label={lowStockAlert.threshold} size="small" style={{ marginRight: 4 }} color='warning'/>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 12, md: 1}}>
            <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'} > 
              <LowStockThresholdItemAction lowStockAlert={lowStockAlert}/>
            </Box>
        </Grid>
      </Grid>
    </React.Fragment>
  )
}

export default LowStockThresholdListItem