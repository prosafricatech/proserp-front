import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useUpdateFormContext } from '../../UpdatesForm';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import TaskProgress from './TaskProgress';
import MaterialUsedForm from './taskProgressTab/materialUsed/MaterialUsedForm';
import MaterialUsedRow from './taskProgressTab/materialUsed/MaterialUsedRow';

function TaskProgressRow({ taskProgressItem, index }) {
  const { taskProgressItems, setTaskProgressItems } = useUpdateFormContext();
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const taskMaterialUsed = taskProgressItems
    .flatMap((task) => task.material_used || [])
    .filter((material) => material.projectTaskIndex === index);

  const [MaterialUsed, setMaterialUsed] = useState(
    taskProgressItem?.material_used
      ? taskProgressItem.material_used.map((material) => ({
          ...material,
          execution_date: taskProgressItem.execution_date,
        }))
      : taskMaterialUsed
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (currentIndex) => {
    setExpanded((prevExpanded) =>
      prevExpanded === currentIndex ? null : currentIndex
    );
  };

  const handleRemoveItem = () => {
    setTaskProgressItems((items) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  return (
    <Accordion
      key={index}
      expanded={expanded === index}
      onChange={() => handleChange(index)}
      square
      sx={{
        borderRadius: 2,
        borderTop: 2,
        padding: 0.5,
        borderColor: 'divider',
        '& > .MuiAccordionDetails-root:hover': {
          bgcolor: 'transparent',
        },
      }}
    >
      <AccordionSummary
        component="div"
        expandIcon={expanded === index ? <RemoveIcon /> : <AddIcon />}
        sx={{
          px: 3,
          flexDirection: 'row-reverse',
          '.MuiAccordionSummary-content': {
            alignItems: 'center',
            '&.Mui-expanded': {
              margin: '12px 0',
            },
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',
            transform: 'none',
            mr: 1,
            '&.Mui-expanded': {
              transform: 'none',
              color: 'primary.main',
              borderColor: 'primary.main',
            },
            '& svg': {
              fontSize: '1.25rem',
            },
          },
        }}
      >
        <Divider />
        {!showForm ? (
          <Grid
            container
            width={'100%'}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <Grid size={{ xs: 6, md: 2 }}>
              <Tooltip title="Execution Date">
                <Typography>
                  {readableDate(taskProgressItem.execution_date, false)}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Tooltip title="Task Name">
                <Typography>{taskProgressItem.task?.name || 'N/A'}</Typography>
              </Tooltip>
            </Grid>
            <Grid textAlign={{ md: 'end' }} size={{ xs: 5, md: 3 }}>
              <Tooltip title="Executed Quantity">
                <Typography>
                  {taskProgressItem.quantity_executed}{' '}
                  {taskProgressItem.unit_symbol ||
                    taskProgressItem.task?.measurement_unit?.symbol ||
                    ''}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 7, md: 3 }} paddingLeft={3}>
              <Tooltip title="Remarks">
                <Typography>{taskProgressItem.remarks}</Typography>
              </Tooltip>
            </Grid>
            <Grid textAlign={'end'} size={{ xs: 12, md: 1 }}>
              <Tooltip title="Edit Item">
                <IconButton size="small" onClick={() => setShowForm(true)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove Item">
                <IconButton size="small" onClick={handleRemoveItem}>
                  <DisabledByDefault fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ width: '100%' }}>
            <TaskProgress
              taskProgressItem={taskProgressItem}
              setShowForm={setShowForm}
              index={index}
              taskProgressItems={taskProgressItems}
              setTaskProgressItems={setTaskProgressItems}
            />
          </Box>
        )}
      </AccordionSummary>
      <AccordionDetails>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="task progress tabs"
        >
          <Tab label="Material Used" />
        </Tabs>

        {tabValue === 0 && (
          <MaterialUsedForm
            projectTaskIndex={index}
            taskProgressItem={taskProgressItem}
            MaterialUsed={MaterialUsed}
            setMaterialUsed={setMaterialUsed}
          />
        )}
        {tabValue === 0 &&
          MaterialUsed.map((material, materialIndex) => (
            <MaterialUsedRow
              key={materialIndex}
              index={materialIndex}
              material={material}
              MaterialUsed={MaterialUsed}
              setMaterialUsed={setMaterialUsed}
            />
          ))}
      </AccordionDetails>
    </Accordion>
  );
}

export default TaskProgressRow;
