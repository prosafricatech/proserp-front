import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react'
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import OutputsItemForm from './OutputsItemForm';

function OutputsItemRow({ setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty, outputs, setOutputs, item, index}) {
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
                    <Grid size={{xs: 11.5, md: 3.5}}>
                        <ListItemText
                            primary={
                                <Tooltip title={'Product'}>
                                    <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                        {item.product?.name}
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
                    <Grid size={{xs: 6, md: 3}}>
                        <Tooltip title="Store">
                            <Typography>{item.store.name}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs: 6, md: 2}} textAlign={'end'}>
                        <Tooltip title="Quantity">
                            <Typography>{item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product.unit_symbol)}</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid size={{xs: 6, md: 2}} textAlign={{md: 'end'}}>
                        <Tooltip title="Value Percentage">
                            <Typography>{item.value_percentage?.toLocaleString()}%</Typography>
                        </Tooltip>
                    </Grid>
                    <Grid textAlign={'end'} size={{xs: 6, md: 1}}>
                        <Tooltip title='Edit Item'>
                            <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                <EditOutlined fontSize='small'/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Remove Item'>
                            <IconButton size='small' 
                                onClick={() => setOutputs(items => {
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
                    <OutputsItemForm setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} outputs={outputs} setOutputs={setOutputs}/>
                )
            }
        </React.Fragment>
  )
}

export default OutputsItemRow