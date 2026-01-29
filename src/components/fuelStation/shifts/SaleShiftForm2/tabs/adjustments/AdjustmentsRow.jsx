import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useContext, useState } from 'react'
import { useFormContext } from 'react-hook-form';
import Adjustments from './Adjustments';
import { StationFormContext } from '../../../SalesShifts';

function AdjustmentsRow({ adjustment, index, adjustments, setAdjustments}) {
    const [showForm, setShowForm] = useState(false);
    const {activeStation} = useContext(StationFormContext);
    const { tanks, products } = activeStation;
    const product = products.find(product => product.id === adjustment.product_id);
    const tank = tanks.find(tank => tank.id === adjustment.tank_id);

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
                        <Grid size={{xs: 5.5, md: 2.5, lg: 2.5}}>
                            <Tooltip title="Product">
                                <Typography>{product.name}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 5.5, md: 2.5}}>
                            <Tooltip title="Tank">
                                <Typography>{tank.name}</Typography>
                            </Tooltip>
                        </Grid>
                       <Grid size={{xs: 6, md: 1.5}}>
                            <Tooltip title="Operator">
                                <Typography>{adjustment.operator === '-' ? 'Subtract (-)' : 'Add (+)'}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 2}}>
                            <Tooltip title="Quantity">
                                <Typography>{adjustment.quantity.toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 2, lg: 2}}>
                            <Tooltip title="Description">
                                <Typography>{adjustment.description}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 1, lg: 1}} textAlign={'end'}>
                            <Tooltip title='Edit Adjustment'>
                                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                    <EditOutlined fontSize='small'/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Remove Adjustment'>
                                <IconButton size='small' 
                                    onClick={() => setAdjustments(adjustments => {
                                        const newItems = [...adjustments];
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
                    <Adjustments adjustment={adjustment} setShowForm={setShowForm} index={index} adjustments={adjustments} setAdjustments={setAdjustments}/>
                )
            }
        </React.Fragment>
  )
}

export default AdjustmentsRow