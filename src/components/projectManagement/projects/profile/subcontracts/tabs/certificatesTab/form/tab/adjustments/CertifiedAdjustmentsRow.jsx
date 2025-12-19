import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import CertifiedAdjustments from './CertifiedAdjustments';

function CertifiedAdjustmentsRow({ adjustment, adjustments = [], setAdjustments, index,   setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty,}) {
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
                        <Grid size={{xs: 6, md: 4}}>
                            <Tooltip title="Type">
                                <Typography>{adjustment.type === '-' ? 'Deduction (-)' : 'Addition (+)'}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 3.5}}>
                            <Tooltip title="Amount">
                                <Typography>{adjustment.amount?.toLocaleString()}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid size={{xs: 6, md: 3}}>
                            <Tooltip title="Description">
                                <Typography>{adjustment.description}</Typography>
                            </Tooltip>
                        </Grid>
                        <Grid textAlign={'end'} size={{xs: 6, md: 1}}>
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
                    <CertifiedAdjustments           
                        setClearFormKey={setClearFormKey}
                        submitMainForm={submitMainForm}
                        setSubmitItemForm={setSubmitItemForm}
                        submitItemForm={submitItemForm}
                        setIsDirty={setIsDirty}
                        adjustment={adjustment} 
                        setShowForm={setShowForm} 
                        index={index} 
                        adjustments={adjustments} 
                        setAdjustments={setAdjustments}
                    />
                )
            }
        </React.Fragment>
  )
}

export default CertifiedAdjustmentsRow