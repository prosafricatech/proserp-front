import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import OtherExpensesItemForm from './OtherExpensesItemForm';

function OtherExpensesItemRow({setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty, item, index, otherExpenses=[], setOtherExpenses}) {
    const [showForm, setShowForm] = useState(false);

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
                        <Grid size={0.5}>
                            {index+1}.
                        </Grid>
                        <Grid size={{xs: 11.5, md: 4.5}}>
                            <ListItemText
                                primary={
                                    <Tooltip title={'Expense'}>
                                        <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                            {item.ledger?.name}
                                        </Typography>
                                    </Tooltip>
                                }
                                secondary={
                                    <Tooltip title={'Remarks'}>
                                        <Typography variant={"span"} fontSize={14} lineHeight={1.25} mb={0} >
                                            {item.remarks}
                                        </Typography>
                                    </Tooltip>
                                }
                            />
                        </Grid>
                        <Grid size={{xs: 4, md: 2}}>
                            <Tooltip title="Quantity">
                                <Typography>{item.quantity.toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 4, md: 2}}>
                            <Tooltip title="Rate">
                                <Typography>
                                    {
                                        item.rate.toLocaleString('en-US', 
                                        {
                                            style: 'currency',
                                            currency: item.currency?.code,
                                        })
                                    }
                                </Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 4, md: 2}} textAlign={{xs: 'end', md: 'start'}}>
                            <Tooltip title="Amount">
                                <Typography>{(item.rate * item.quantity)?.toLocaleString('en-US', 
                                    {
                                        style: 'currency',
                                        currency: item.currency?.code,
                                        })
                                    }
                                </Typography>
                            </Tooltip>
                        </Grid>
                        <Grid textAlign={'end'} size={{xs: 12, md: 1}}>
                            { !item.isFetched &&
                                <Tooltip title='Edit Item'>
                                    <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                        <EditOutlined fontSize='small'/>
                                    </IconButton>
                                </Tooltip>
                            }
                            <Tooltip title='Remove Item'>
                                <IconButton size='small' 
                                    onClick={() => setOtherExpenses(ledger_item => {
                                        const newItems = [...ledger_item];
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
                    <OtherExpensesItemForm setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} otherExpenses={otherExpenses} setOtherExpenses={setOtherExpenses}/>
                )
            }
        </React.Fragment>
  )
}

export default OtherExpensesItemRow