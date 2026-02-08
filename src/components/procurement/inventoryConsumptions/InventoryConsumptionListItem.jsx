import { Box, Chip, Divider, Grid, Tooltip, Typography } from '@mui/material'
import React from 'react'
import InventoryConsumptionItemAction from './InventoryConsumptionItemAction'
import { readableDate } from '@/app/helpers/input-sanitization-helpers'

function InventoryConsumptionListItem({inventoryConsumption, consumptionTab = false}) {
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
        columnSpacing={2}
        padding={1}
        alignItems={'center'}
      >
          
        <Grid size={{xs: 6, md: 2}}>
          <Tooltip title='Consumption Date'>
            <Typography>{`${readableDate(inventoryConsumption.consumption_date)}`}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 2}}>
          <Tooltip title='Consumption No.'>
            <Typography>{inventoryConsumption.consumptionNo}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Tooltip title='Cost Center'>
            <Chip
              label={inventoryConsumption.cost_center?.name}
              color='default'
              size='small'
            />
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <Tooltip title='Description'>
            <Typography>{inventoryConsumption.narration}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 12, md: 1}}>
          <Box display={'flex'} flexDirection={'row'} justifyContent='flex-end' >
            <InventoryConsumptionItemAction inventoryConsumption={inventoryConsumption} consumptionTab={consumptionTab}/>
          </Box>
        </Grid>
      </Grid>
      <Divider/>
    </>
  )
}

export default InventoryConsumptionListItem