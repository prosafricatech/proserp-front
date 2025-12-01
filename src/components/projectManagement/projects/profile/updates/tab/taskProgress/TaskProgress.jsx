import { yupResolver } from '@hookform/resolvers/yup';
import { Autocomplete, Button, Grid, IconButton, InputAdornment, LinearProgress, TextField, Tooltip } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form';
import * as yup  from "yup";
import { useProjectProfile } from '../../../ProjectProfileProvider';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useUpdateFormContext } from '../../UpdatesForm';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useQuery } from '@tanstack/react-query';

function TaskProgress({taskProgressItem = null, index = -1, setShowForm = null}) {
  const { taskProgressItems, setTaskProgressItems } = useUpdateFormContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0)
  const [unitToDisplay, setUnitToDisplay] = useState(taskProgressItem && taskProgressItem.unit_symbol);
  const { deliverable_groups, setFetchDeliverables, projectTimelineActivities, setFetchTimelineActivities, project } =
    useProjectProfile();

  useEffect(() => {
    if (!deliverable_groups) {
      setFetchDeliverables(true);
    } else {
      setFetchDeliverables(false);
    }

    if (!projectTimelineActivities) {
      setFetchTimelineActivities(true);
    } else {
      setFetchTimelineActivities(false);
    }
  }, [projectTimelineActivities, setFetchTimelineActivities]);

    //Define validation Schema
  const validationSchema = yup.object({
    project_task_id: yup
      .number()
      .nullable()
      .required("Project Task is required"),

    quantity_executed: yup
      .number()
      .required("Quantity is required")
      .typeError("Quantity is required")
      .test("max-quantity", function (value) {
        const { unexcuted_task_quantity = 0, task, project_subcontract } = this.parent;
        const {
          taskProgressItems = [],
          taskProgressItem,
          index,
        } = this.options.context || {};

        const unit = (task?.measurement_unit?.symbol || task?.unit || "").trim();

        // --- Project-level available ---
        const projectAvailable = Number(
          taskProgressItem?.id ? taskProgressItem.task.quantity : unexcuted_task_quantity
        );

        // Sum of existing progress for THIS TASK across ALL items (exclude current if editing)
        const existingAll = taskProgressItems
          .filter((itm, idx) => itm.task?.id === task?.id && idx !== index)
          .reduce((s, itm) => s + Number(itm.quantity_executed || 0), 0);

        // Previous qty when editing
        const prevQty = Number(taskProgressItem?.quantity_executed || 0);

        // Remaining at project level
      const remainingProject = projectAvailable - existingAll + prevQty;

      // --- Subcontract available ---
      let subcontractAvailable = null;
      if (project_subcontract) {
        const taskInSub = (project_subcontract.tasks || []).find(
          (t) => t.project_task_id === task?.id
        );
        if (taskInSub) {
          subcontractAvailable = Number(
            taskProgressItem?.id ? taskProgressItem?.quantity_executed : taskInSub.unexecuted_quantity || 0
          );
        } else {
          subcontractAvailable = taskProgressItem?.id ? taskProgressItem?.quantity_executed : 0;
        }
      }

      // Sum of existing progress for THIS TASK but ONLY for this subcontract
      const existingForSub = project_subcontract
        ? taskProgressItems
            .filter(
              (itm, idx) =>
                itm.task?.id === task?.id &&
                itm.project_subcontract?.id === project_subcontract.id &&
                idx !== index
            )
            .reduce((s, itm) => s + Number(itm.quantity_executed || 0), 0)
        : 0;

      const remainingSubcontract =
        subcontractAvailable !== null ? subcontractAvailable - existingForSub + prevQty : null;

      // --- Validate project balance ---
      if (value > remainingProject) {
        if (remainingProject < 0) {
          const exceededBy = Math.abs(remainingProject);
          return this.createError({
            message: `Project allocation already exceeded by ${exceededBy} ${unit}. Please review existing entries.`,
          });
        }
        let msg = `Quantity should not exceed remaining project balance: ${remainingProject} ${unit}.`;
        if (remainingSubcontract !== null) {
          msg += ` Subcontract remaining: ${remainingSubcontract} ${unit}.`;
        }
        return this.createError({ message: msg });
      }

      // --- Validate subcontract balance (if applicable) ---
      if (remainingSubcontract !== null) {
        if (remainingSubcontract < 0) {
          const exceededBy = Math.abs(remainingSubcontract);
          return this.createError({
            message: `Subcontract allocation already exceeded by ${exceededBy} ${unit}. Please review existing entries. Project balance: ${remainingProject} ${unit}.`,
          });
        }
        if (value > remainingSubcontract) {
          return this.createError({
            message: `Quantity should not exceed subcontract balance: ${remainingSubcontract} ${unit}. Project balance: ${remainingProject} ${unit}.`,
          });
        }
      }

      return true;
    }),
  });  

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    register,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      quantity_executed: taskProgressItem && taskProgressItem.quantity_executed,
      unexcuted_task_quantity: taskProgressItem && taskProgressItem.unexcuted_task_quantity,
      project_task_id: taskProgressItem && taskProgressItem.project_task_id,
      task: taskProgressItem && taskProgressItem.task,
      execution_date: taskProgressItem ? dayjs(taskProgressItem.execution_date) : dayjs().toISOString(),
      project_subcontract_id: taskProgressItem ? taskProgressItem.project_subcontract_id : null,
      project_subcontract: taskProgressItem ? taskProgressItem.project_subcontract : null,
      remarks: taskProgressItem && taskProgressItem.remarks,
      unit_symbol: taskProgressItem && taskProgressItem.unit_symbol,
      material_used: [],
    },
    context: { taskProgressItems, taskProgressItem },
  });

    const updateItems = async (taskProgressItem) => {
      setIsAdding(true);
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedItems = [...taskProgressItems];
        updatedItems[index] = taskProgressItem;
        await setTaskProgressItems(updatedItems);
        setUnitToDisplay(null)
      } else {
        // Add the new item to the items array
        await setTaskProgressItems((taskProgressItems) => [...taskProgressItems, taskProgressItem]);
        setUnitToDisplay(null)
      }

      reset();
      setIsAdding(false);
      setShowForm && setShowForm(false);
    };

    const retrieveTaskDetails = async (taskId) => {
      setIsRetrievingDetails(true);
      const details = await projectsServices.showProjectTaskDetails(taskId);
      setValue('unexcuted_task_quantity', details?.unexecuted_quantity);
      setIsRetrievingDetails(false);
    }

    useEffect(() => {
      if (taskProgressItem?.id) {
        retrieveTaskDetails(taskProgressItem.task.id);
      }
    }, [taskProgressItem])

    const getTaskOptions = (activities, depth = 0) => {
      if (!Array.isArray(activities)) {
        return [];
      }
    
      return activities.flatMap(activity => {
        const { children, tasks } = activity;
    
        const tasksOptions = (tasks || []).map(task => ({
          id: task.id,
          name: task.name,
          handlers: task.handlers,
          dependencies: task.dependencies,
          quantity: task.quantity,
          measurement_unit: task.measurement_unit,
          start_date: dayjs(task.start_date).format('YYYY-MM-DD'),
          end_date: dayjs(task.end_date).format('YYYY-MM-DD'),
          weighted_percentage: task.weighted_percentage,
          project_deliverable_id: task.project_deliverable_id
        }));
    
        const tasksFromgroupChildren = getTaskOptions(children, depth + 1);
    
        return [...tasksOptions, ...tasksFromgroupChildren];
      });
    };
    
    const allTasks = getTaskOptions(projectTimelineActivities);

    useEffect(() => {
      if (watch(`quantity_executed`) > 0) {
        setValue(`quantity_executed`, watch(`quantity_executed`),{
          shouldValidate: true,
          shouldDirty: true
        });
      }
    }, [watch(`unexcuted_task_quantity`), setValue, watch]);

  const { data: subcontractOptions, isLoading: isFetchingOptions } = useQuery({
    queryKey: ['subcontractOptions', project?.id],
    queryFn: () => projectsServices.getSubcontractOptions(project.id),
    enabled: !!project?.id,
  });

  // 👇 Ensure project_subcontract always references full object from subcontractOptions
  useEffect(() => {
    if (subcontractOptions && taskProgressItem?.project_subcontract) {
      const current = taskProgressItem.project_subcontract;
      const full = subcontractOptions.find((s) => s.id === current.id);
      if (full) {
        setValue('project_subcontract', full);
      }
    }
  }, [subcontractOptions, taskProgressItem, setValue]);

  // 👇 Watch subcontract selection
  const selectedSubcontract = watch('project_subcontract');

  // 👇 Filter tasks depending on subcontract selection
  const filteredTasks = useMemo(() => {
    if (!selectedSubcontract) {
      return allTasks;
    }
    const allowedTaskIds = (selectedSubcontract.tasks || []).map((t) => t.project_task_id);
    return allTasks.filter((task) => allowedTaskIds.includes(task.id));
  }, [selectedSubcontract, allTasks]);

  if (isAdding || isFetchingOptions) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
        <Grid container columnSpacing={1} width={'100%'} rowSpacing={1}>
            <Grid size={{xs: 12, md: 4, lg: 4}}>
              <Div sx={{mt: 1}}>
                <DateTimePicker
                  fullWidth={true}
                  label="Execution Date"
                  defaultValue={taskProgressItem ? dayjs(taskProgressItem.execution_date) : dayjs()}
                  maxDate={dayjs()}
                  disabled={taskProgressItem && taskProgressItem.material_used?.length > 0}
                  slotProps={{
                  textField : {
                    size: 'small',
                    fullWidth: true,
                    readOnly: true,
                    error: !!errors?.execution_date,
                    helperText: errors?.execution_date?.message
                  }
                  }}
                  onChange={(newValue) => {
                    setValue('execution_date', newValue ? newValue.toISOString() : null,{
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  multiple={false}
                  id="checkboxes-subContracts_Options"
                  options={subcontractOptions || []}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => `${option.subcontractor?.name} (${option.subcontractNo})`}
                  value={watch('project_subcontract')}
                  renderInput={(params) => (
                    <TextField {...params} label="Subcontract (Optional)" size="small" fullWidth />
                  )}
                  onChange={(e, newValue) => {
                    setUploadFieldsKey((prevKey) => prevKey + 1);
                    setValue(`project_subcontract_id`, newValue ? newValue.id : null);
                    setValue(`project_subcontract`, newValue ? newValue : null);
                    setValue('task', null);
                    setValue('project_task_id', null);
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1 }}>
                <Autocomplete
                  options={filteredTasks}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.name}
                  defaultValue={taskProgressItem?.task}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Project Task"
                      size="small"
                      fullWidth
                      error={!!errors?.project_task_id}
                      helperText={errors?.project_task_id?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    if (!!newValue) {
                      setUnitToDisplay(newValue.measurement_unit?.symbol)
                      setValue('task', newValue)
                      setValue('project_task_id', newValue?.id, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });

                      retrieveTaskDetails(newValue.id);
                    } else {
                      setUnitToDisplay(null)
                      setValue('task', null)
                      setValue('unit_symbol', null)
                      setValue('project_task_id', null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1 }}>
                {isRetrievingDetails ? (
                  <LinearProgress />
                ) : (
                  <TextField
                  label="Quantity Executed"
                  fullWidth
                  size="small"
                  defaultValue={watch(`quantity_executed`)}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                    endAdornment: (
                      <InputAdornment position="end">
                        {unitToDisplay}
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors?.quantity_executed}
                  helperText={errors?.quantity_executed?.message}
                  onChange={(e) => {
                    setValue('unit_symbol', unitToDisplay)
                    setValue(`quantity_executed`, e.target.value ? sanitizedNumber(e.target.value) : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                )}
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 8}}>
              <Div sx={{ mt: 1}}>
                <TextField
                  label="Remarks"
                  size="small"
                  multiline={true}
                  minRows={2}
                  fullWidth
                  {...register('remarks')}
                />
              </Div>
            </Grid>
            <Grid size={12} textAlign={'end'} paddingBottom={0.5}>
              <Button
                variant='contained'
                size='small'
                type='submit'
              >
                {
                  taskProgressItem ? (
                    <><CheckOutlined fontSize='small' /> Done</>
                  ) : (
                    <><AddOutlined fontSize='small' /> Add</>
                  )
                }
              </Button>
              {
                taskProgressItem && 
                <Tooltip title='Close Edit'>
                  <IconButton size='small' 
                    onClick={() => {
                      setShowForm(false);
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success'/>
                  </IconButton>
                </Tooltip>
              }
            </Grid>
        </Grid>
    </form>
  )
}

export default TaskProgress