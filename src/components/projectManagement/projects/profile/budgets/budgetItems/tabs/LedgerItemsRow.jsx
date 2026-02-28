import { DisabledByDefault } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React from 'react'
import LedgerItemsTab from './LedgerItemsTab';

function LedgerItemsRow({ ledgerItem, index, ledgerItems, setLedgerItems}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <React.Fragment>
      <Divider/>
        {!showForm ? (
          <Grid container 
            width={'100%'}
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
            <Grid size={{xs: 7, md: 4.5}}>
              <ListItemText
                primary={
                  <Tooltip title="Expense name">
                    <Typography component="span">{ledgerItem.ledger.name}</Typography>
                  </Tooltip>
                }
                secondary={
                  <Tooltip title="Description">
                    <Typography component="span">{ledgerItem.description}</Typography>
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={{xs: 4, md: 2}} textAlign={{md: 'right'}}>
              <Tooltip title="Quantity">
                <Typography>{ledgerItem.quantity.toLocaleString()} {ledgerItem.measurement_unit?.symbol}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}} textAlign={{md: 'right'}}>
              <Tooltip title="Rate">
                <Typography>{ledgerItem.rate.toLocaleString('en-US', 
                  {
                    style: 'currency',
                    currency: ledgerItem.currency?.code,
                  })}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}} textAlign={{md: 'right'}}>
              <Tooltip title="Amount">
                <Typography>{(ledgerItem.quantity * ledgerItem.rate).toLocaleString('en-US', 
                  {
                    style: 'currency',
                    currency: ledgerItem.currency?.code,
                  })}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
              <Tooltip title='Remove Expense Item'>
                <IconButton size='small' 
                  onClick={() => {
                    handleDelete();
                  }}
                >
                  <DisabledByDefault fontSize='small' color='error' />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <LedgerItemsTab
            index={index}
            setShowForm={setShowForm}
            ledgerItem={ledgerItem}
            ledgerItems={ledgerItems}
            setLedgerItems={setLedgerItems}
          />
        )}
    </React.Fragment>
  )
}

export default LedgerItemsRow