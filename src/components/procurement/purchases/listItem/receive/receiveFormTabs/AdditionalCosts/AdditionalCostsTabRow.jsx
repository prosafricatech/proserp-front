import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form';
import AdditionalCostsTab from './AdditionalCostsTab';

function AdditionalCostsTabRow({ additionalCost, setIsDirty, index}) {
    const [showForm, setShowForm] = useState(false);
    const {additionalCosts=[], setAdditionalCosts} = useFormContext();

  return (
    <React.Fragment>
      <Divider/>
      { !showForm ? (
          <Grid container 
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <Grid size={{xs: 1, md: 0.5}}>
              {index+1}.
            </Grid>
            <Grid size={{xs: 7, md: 2.5}}>
              <Tooltip title="Cost name">
                <Typography>{additionalCost.credit_ledger_name}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 4, md: 2}} textAlign={{xs: 'right', md: 'start'}}>
              <Tooltip title="Reference">
                <Typography>{additionalCost.reference}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 3}}>
              <Tooltip title="Currency">
                <Typography>{additionalCost.currency_name}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 1.5}} textAlign={'right'}>
              <Tooltip title="Exchange Rate">
                <Typography>{additionalCost.exchange_rate.toLocaleString()}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 1.5}} textAlign={{md: 'right'}}>
              <Tooltip title="Amount">
                <Typography>{additionalCost.amount?.toLocaleString()}</Typography>
              </Tooltip>
            </Grid>
            <Grid textAlign={'end'} size={{xs: 6, md: 1}}>
              <Tooltip title='Edit Additional Cost'>
                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                  <EditOutlined fontSize='small'/>
                </IconButton>
              </Tooltip>
              <Tooltip title='Remove Additional Cost'>
                <IconButton size='small' 
                  onClick={() => setAdditionalCosts(additionalCosts => {
                    const newItems = [...additionalCosts];
                    newItems.splice(index,1);
                    return newItems;
                  })}
                >
                  <DisabledByDefault fontSize='small' color='error'/>
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <AdditionalCostsTab additionalCost={additionalCost} setIsDirty={setIsDirty} setShowForm={setShowForm} index={index} additionalCosts={additionalCosts} setAdditionalCosts={setAdditionalCosts}/>
        )
      }
    </React.Fragment>
  )
}

export default AdditionalCostsTabRow