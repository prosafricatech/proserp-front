import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import MaterialIssuedForm from './MaterialIssuedForm';

function MaterialIssuedRow({ material, index, MaterialIssued=[], setMaterialIssued}) {
    const product = material.product;
    const [showForm, setShowForm] = useState(false);

    const handleRemoveItem = () => {
        setMaterialIssued(MaterialIssued => {
            const newItems = [...MaterialIssued];
            newItems.splice(index,1);
            return newItems;
        });
    };

  return (
         <React.Fragment>
            <Divider/>
            { !showForm ? (
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
                        <Grid size={{xs: 11, md: 3.5}}>
                            <Tooltip title="Product">
                                <Typography>{product?.name}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 2.5}}>
                            <Tooltip title="Store">
                                <Typography>{material.store?.name}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 2}} textAlign={'end'}>
                            <Tooltip title="Quantity">
                                <Typography>{material.quantity} {material.unit_symbol || material.measurement_unit?.symbol || ''}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 12, md: 2.5}} paddingLeft={3}>
                            <Tooltip title="Remarks">
                                <Typography>{material.remarks}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
                            <Tooltip title='Edit Item'>
                                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                                    <EditOutlined fontSize='small'/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Remove Item'>
                                <IconButton size='small' onClick={handleRemoveItem}>
                                    <DisabledByDefault fontSize='small' color='error'/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                ) : (
                    <MaterialIssuedForm material={material} setShowForm={setShowForm} index={index} MaterialIssued={MaterialIssued} setMaterialIssued={setMaterialIssued}/>
                )
            }
        </React.Fragment>
  )
}

export default MaterialIssuedRow