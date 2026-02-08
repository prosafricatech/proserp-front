import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react'
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import InventoryConsumptionItemForm from './InventoryConsumptionItemForm';

function InventoryConsumptionItemRow({ setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty, items, setItems, item, index, getUpdatedBalanceItems}) {
    const product = item.product;
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
                    <Grid size={{xs: 1, md: 0.5}}>
                        {index+1}.
                    </Grid>
                    <Grid size={{xs: 11, md: 4}}>
                        <ListItemText
                            primary={
                                <Tooltip title="Product">
                                    <Typography>{product.name}</Typography>
                                </Tooltip>
                            }
                            secondary={
                                <Tooltip title="Description">
                                    <Typography>{item.description}</Typography>
                                </Tooltip>
                            }
                        />
                    </Grid>
                    <Grid textAlign={{md: 'end'}} size={{xs: 6, md: 3.5}}>
                        <Tooltip title="Quantity">
                            <Typography>{item.quantity.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product.unit_symbol)}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs: 6, md: 3}} paddingLeft={2}>
                        <Tooltip title="Expense Ledger">
                            <Typography>{item.ledger?.name}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid textAlign={'end'} size={{xs: 12, md: 1}}>
                        <Tooltip title='Edit Item'>
                            <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                <EditOutlined fontSize='small'/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Remove Item'>
                            <IconButton size='small' 
                                onClick={() => setItems(items => {
                                    const newItems = [...items];
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
                <InventoryConsumptionItemForm setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} items={items} setItems={setItems} getUpdatedBalanceItems={getUpdatedBalanceItems}/>
            )
        }
    </React.Fragment>
  )
}

export default InventoryConsumptionItemRow