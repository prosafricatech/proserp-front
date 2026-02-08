import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react'
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import InventoryTrasferItemForm from './InventoryTrasferItemForm';

function InventoryTransferItemRow({setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty,items,setItems,item,index, sourceCostCenterId = null}) {
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
                    <Grid size={{xs: 11, md: 5}}>
                        <Tooltip title='Product'>
                            <Typography>{product.name}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs: 1.5, md: 1}}>
                        {item?.unit_symbol ? item.unit_symbol : item.measurement_unit.symbol}
                    </Grid>
                    <Grid textAlign={'center'} size={{xs: 1.5, md: 4}}>
                        <Tooltip title='Quantity'>
                           <Typography>{item?.quantity}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid textAlign={'end'} size={{xs: 9, md: 1.5}}>
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
                <InventoryTrasferItemForm setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} items={items} setItems={setItems} sourceCostCenterId={sourceCostCenterId} />
            )
        }
    </React.Fragment>
  )
}

export default InventoryTransferItemRow