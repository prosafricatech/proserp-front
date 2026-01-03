import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import {
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import CertifiedTasksItemForm from './CertifiedTasksItemForm';

const CertifiedTasksItemRow = ({
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
  certificate,
}) => {
  const [showForm, setShowForm] = useState(false);

  const handleRemoveItem = () => {
    setTasksItems((prevItems) => {
      const newItems = [...prevItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const taskName = taskItem.task?.name || taskItem?.task_name || '-';
  const quantity =
    `${taskItem.certified_quantity ?? 0} ` +
    `${taskItem.task?.measurement_unit?.symbol || ''}`;
  const remarks = taskItem.remarks || '-';

  return (
    <React.Fragment>
      <Divider />

      {!showForm ? (
        <Grid
          container
          alignItems="center"
          sx={{
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2">{index + 1}.</Typography>
          </Grid>

          <Grid size={{ xs: 11, md: 5.5 }}>
            <Tooltip title={'Project Task'} arrow placement="top-start">
              <Typography variant="body2" noWrap>
                {taskName}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }} paddingLeft={{ xs: 3, md: 0 }}>
            <Tooltip title="Quantity" arrow>
              <Typography variant="body2">
                {quantity}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Tooltip title={'Remarks'} arrow placement="top-start">
              <Typography variant="body2" noWrap>
                {remarks}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid textAlign="end" size={{ xs: 12, md: 1 }}>
            <Tooltip title="Edit Task" arrow>
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Task" arrow>
              <IconButton size="small" onClick={handleRemoveItem}>
                <DisabledByDefault fontSize="small" color="error" />
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

export default CertifiedTasksItemRow;
