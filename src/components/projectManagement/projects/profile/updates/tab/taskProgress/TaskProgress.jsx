import { yupResolver } from '@hookform/resolvers/yup';
import {
  Autocomplete,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
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

function TaskProgress({ taskProgressItem = null, index = -1, setShowForm = null }) {
  const { taskProgressItems, setTaskProgressItems } = useUpdateFormContext();
  const { projectTimelineActivities, project } = useProjectProfile();

  const [isAdding, setIsAdding] = useState(false);
  const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);
  const [unitToDisplay, setUnitToDisplay] = useState(
    taskProgressItem?.unit_symbol || null
  );

  const validationSchema = yup.object({
    project_task_id: yup
      .number()
      .nullable()
      .required('Project Task is required'),

    quantity_executed: yup
      .number()
      .typeError('Quantity is required')
      .positive('Quantity must be greater than zero')
      .required('Quantity is required')
      .test('balance-check', function (value) {
        const {
          unexcuted_task_quantity = 0,
          task,
          project_subcontract,
        } = this.parent;

        const {
          taskProgressItems = [],
          taskProgressItem,
          index,
        } = this.options.context || {};

        if (!task) return true;

        const unit = (task?.measurement_unit?.symbol || '').trim();

        const prevQty = Number(taskProgressItem?.quantity_executed || 0);

        const projectAvailable =
          Number(unexcuted_task_quantity || 0) + prevQty;

        // ONLY draft items (NO id)
        const existingDraftProject = taskProgressItems
          .filter(
            (itm, idx) =>
              !itm.id &&
              itm.task?.id === task.id &&
              idx !== index
          )
          .reduce(
            (sum, itm) => sum + Number(itm.quantity_executed || 0),
            0
          );

        const remainingProject =
          projectAvailable - existingDraftProject;

        if (value > remainingProject) {
          return this.createError({
            message: `Quantity should not exceed remaining project balance: ${remainingProject} ${unit}.`,
          });
        }

        if (project_subcontract) {
          const taskInSub = (project_subcontract.tasks || []).find(
            (t) => t.project_task_id === task.id
          );

          const subcontractAvailable =
            Number(taskInSub?.unexecuted_quantity || 0) + prevQty;

          const existingDraftSub = taskProgressItems
            .filter(
              (itm, idx) =>
                !itm.id &&
                itm.task?.id === task.id &&
                itm.project_subcontract?.id === project_subcontract.id &&
                idx !== index
            )
            .reduce(
              (sum, itm) => sum + Number(itm.quantity_executed || 0),
              0
            );

          const remainingSubcontract =
            subcontractAvailable - existingDraftSub;

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
      id: taskProgressItem?.id,
      quantity_executed: taskProgressItem?.quantity_executed,
      unexcuted_task_quantity: taskProgressItem?.unexcuted_task_quantity,
      project_task_id: taskProgressItem?.project_task_id,
      task: taskProgressItem?.task,
      execution_date: taskProgressItem
        ? dayjs(taskProgressItem.execution_date)
        : dayjs(),
      project_subcontract_id: taskProgressItem?.project_subcontract_id || null,
      project_subcontract: taskProgressItem?.project_subcontract || null,
      remarks: taskProgressItem?.remarks || '',
      unit_symbol: taskProgressItem?.unit_symbol || null,
    },
    context: { taskProgressItems, taskProgressItem, index },
  });

  const updateItems = async (item) => {
    setIsAdding(true);

    if (index > -1) {
      const updated = [...taskProgressItems];
      updated[index] = item;
      setTaskProgressItems(updated);
    } else {
      setTaskProgressItems((prev) => [...prev, item]);
    }

    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  const retrieveTaskDetails = async (taskId) => {
    setIsRetrievingDetails(true);
    const details = await projectsServices.showProjectTaskDetails(taskId);
    setValue('unexcuted_task_quantity', details?.unexecuted_quantity || 0);
    setIsRetrievingDetails(false);
  };

  // Revalidate quantity_executed when project_subcontract or project_task_id changes
  useEffect(() => {
    if (watch('quantity_executed') !== undefined) {
      setValue('quantity_executed', watch('quantity_executed'), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watch('project_subcontract'), watch('project_task_id')]);

  useEffect(() => {
    if (taskProgressItem?.task?.id) {
      retrieveTaskDetails(taskProgressItem.task.id);
    }
  }, [taskProgressItem]);

  const getTaskOptions = (activities) =>
    (activities || []).flatMap((activity) => [
      ...(activity.tasks || []),
      ...getTaskOptions(activity.children || []),
    ]);

  const allTasks = getTaskOptions(projectTimelineActivities);

  const { data: subcontractOptions, isLoading } = useQuery({
    queryKey: ['subcontractOptions', project?.id],
    queryFn: () => projectsServices.getSubcontractOptions(project.id),
    enabled: !!project?.id,
  });

  const selectedSubcontract = watch('project_subcontract');

  const filteredTasks = useMemo(() => {
    if (!selectedSubcontract) return allTasks;
    const allowedIds = (selectedSubcontract.tasks || []).map(
      (t) => t.project_task_id
    );
    return allTasks.filter((t) => allowedIds.includes(t.id));
  }, [selectedSubcontract, allTasks]);

  if (isAdding || isLoading) return <LinearProgress />;

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
        <Grid container columnSpacing={1} width={'100%'} rowSpacing={1} key={uploadFieldsKey}>
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
  );
}

export default TaskProgress;
