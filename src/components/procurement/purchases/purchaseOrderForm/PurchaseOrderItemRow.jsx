import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react'
import PurchaseOrderItemForm from './PurchaseOrderItemForm';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';

function PurchaseOrderItemRow({ setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty, items, setItems, item, index, checked, getLastPriceItems}) {
    const product = item.product;
    const [showForm, setShowForm] = useState(false);

    const vat_factor = item.vat_percentage*0.01;
    const lineVat = item.item_vat ?  item.item_vat : (item.rate * vat_factor)
    const linetotalAmount = item.amount ? item.amount : (item.rate* item.quantity * (1 + vat_factor));

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
                    <Grid size={{xs: 8, md: 3.5}}>
                        <Tooltip title="Product">
                            <Typography>{product.name}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid textAlign={'end'} size={{xs: 3, md: 2}}>
                        <Tooltip title="Quantity">
                            <Typography>{item.quantity} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product.unit_symbol)}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid textAlign={'end'} size={{xs: 4, md: 1.5}}>
                        <Tooltip title="Price">
                            <Typography>{item.rate.toLocaleString()}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid textAlign={'end'} size={{xs: 4, md: 1.5}}>
                        <Tooltip title="VAT">
                            <Typography>{lineVat.toLocaleString()}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid textAlign={'end'} size={{xs: 4, md: 2}}>
                        <Tooltip title="Line Total">
                            <Typography>{linetotalAmount?.toLocaleString()}</Typography>
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
                <PurchaseOrderItemForm setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} items={items} setItems={setItems} checked={checked} getLastPriceItems={getLastPriceItems}/>
            )
        }
    </React.Fragment>
  )
}

export default PurchaseOrderItemRow