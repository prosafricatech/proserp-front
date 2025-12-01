import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import CertifiedTasksItemForm from './CertifiedTasksItemForm';

const CertifiedTasksItemRow= ({
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  taskItem,
  index,
  tasksItems = [],
  CertificateDate,
  setTasksItems,
  subContract,
  certificate
}) => {
  const [showForm, setShowForm] = useState(false);

  const handleRemoveItem = () => {
    setTasksItems(prevItems => {
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  return (
    <React.Fragment>
      <Divider />
      {!showForm ? (
        <Grid container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
            <Grid size={{xs: 1, md: 0.5}}>
                {index + 1}.
            </Grid>

            <Grid size={{xs: 11, md: 5.5}}>
                {taskItem.task?.name || taskItem?.task_name}
            </Grid>


            <Grid size={{xs: 6, md: 2}} paddingLeft={{xs: 3, md: 0}}>
                {taskItem.certified_quantity} {taskItem.task?.measurement_unit?.symbol}
            </Grid>

            <Grid size={{xs: 6, md: 3}}>
                {taskItem.remarks}
            </Grid>

            <Grid textAlign={'end'} size={{xs: 12, md: 1}}>
                <Tooltip title='Edit Certified Task'>
                    <IconButton size='small' onClick={() => setShowForm(true)}>
                        <EditOutlined fontSize='small' />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Remove Certified Task'>
                    <IconButton size='small' onClick={handleRemoveItem}>
                        <DisabledByDefault fontSize='small' color='error' />
                    </IconButton>
                </Tooltip>
            </Grid>
        </Grid>
      ) : (
        <CertifiedTasksItemForm
          setClearFormKey={setClearFormKey}
          submitMainForm={submitMainForm}
          setSubmitItemForm={setSubmitItemForm}
          submitItemForm={submitItemForm}
          setIsDirty={setIsDirty}
          taskItem={taskItem}
          setShowForm={setShowForm}
          index={index}
          subContract={subContract}
          certificate={certificate}
          tasksItems={tasksItems}
          CertificateDate={CertificateDate}
          setTasksItems={setTasksItems}
        />
      )}
    </React.Fragment>
  );
};

export default CertifiedTasksItemRow