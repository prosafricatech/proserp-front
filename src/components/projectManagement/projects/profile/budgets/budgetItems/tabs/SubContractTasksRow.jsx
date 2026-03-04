import { DisabledByDefault } from '@mui/icons-material'
import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import SubContractTasksTab from './SubContractTasksTab';

function SubContractTasksRow({ 
  subContractTask,
  index,
  subContractItems,
  setSubContractItems,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  selectedBoundTo,
  selectedItemable
}) {
  const [showForm, setShowForm] = useState(false);

  console.log('Rendering SubContractTasksRow with task:', subContractTask);

  const handleDelete = () => {
    setSubContractItems((prevItems) => {
      const nextItems = [...prevItems];
      nextItems.splice(index, 1);
      return nextItems;
    });
  };

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
          <Grid size={{xs: 1, md: 0.4}}>
            {index+1}.
          </Grid>
          <Grid size={{xs: 11, md: 2.1}}>
            <ListItemText
              // primary={
              //   <Tooltip title="Task name">
              //     <Typography component="span">{subContractTask.project_task?.name}</Typography>
              //   </Tooltip>
              // }
              secondary={
                <Tooltip title="Description">
                  <Typography component="span">{subContractTask.description}</Typography>
                </Tooltip>
              }
            />
          </Grid>
          <Grid size={{xs: 6, md: 4}}>
            <Tooltip title="Expense name">
              <Typography>{subContractTask.expense_ledger.name}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6, md: 1.5}} textAlign={{md: 'right'}}>
            <Tooltip title="Quantity">
              <Typography>{subContractTask.quantity.toLocaleString()} {subContractTask.project_task?.measurement_unit?.symbol}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 5.5, md: 1.5}} textAlign={{md: 'right'}}>
            <Tooltip title="Rate">
              <Typography>{subContractTask.rate.toLocaleString('en-US', 
                {
                  style: 'currency',
                  currency: subContractTask.currency?.code,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 5.5, md: 2}} textAlign={{md: 'right'}}>
            <Tooltip title="Amount">
              <Typography>{(subContractTask.quantity * subContractTask.rate).toLocaleString('en-US', 
                {
                  style: 'currency',
                  currency: subContractTask.currency?.code,
                })}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 1, md: 0.5}} textAlign={'end'}>
            <Tooltip title='Remove SubContract Task'>
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
        <SubContractTasksTab
          index={index}
          setShowForm={setShowForm}
          subContractItem={subContractTask}
          subContractItems={subContractItems}
          setSubContractItems={setSubContractItems}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          selectedBoundTo={selectedBoundTo}
          selectedItemable={selectedItemable}
        />
      )}
    </React.Fragment>
  )
}

export default SubContractTasksRow