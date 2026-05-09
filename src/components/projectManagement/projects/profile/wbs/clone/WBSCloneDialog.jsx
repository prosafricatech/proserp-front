'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import projectsServices from '../../../project-services';
import { useProjectProfile } from '../../ProjectProfileProvider';
import UsersSelector from '@/components/sharedComponents/UsersSelector';

const createActivityTempId = (indexPath) => `activity-${indexPath}`;
const createTaskTempId = (activityPath, index) => `task-${activityPath}-${index}`;

const normalizeTasks = (tasks = [], activityPath) =>
  tasks.map((task, index) => ({
    temp_id: createTaskTempId(activityPath, index),
    source_id: task.id,
    name: task.name || '',
    code: task.code || '',
    description: task.description || '',
    weighted_percentage: task.weighted_percentage ?? 0,
    quantity: task.quantity ?? 0,
    is_milestone: task.is_milestone ?? 0,
    start_date: task.start_date || null,
    end_date: task.end_date || null,
    position_index: task.position_index ?? index,
    measurement_unit_id: task.measurement_unit_id || task.measurement_unit?.id || null,
    handlers:
      task.handlers?.map((handler) => ({
        id: handler.id,
        name: handler.name || handler.full_name || handler.email || 'Unknown User',
      })) || [],
    handlers_ids: task.handlers?.map((handler) => handler.id) || [],
    dependency_source_ids: task.dependencies?.map((dependency) => dependency.id) || [],
    dependencies:
      task.dependencies?.map((dep) => ({
        id: dep.id,
        name: dep.name || dep.label || `Task #${dep.id}`,
      })) || [],
  }));


const normalizeActivities = (activities = [], parentPath = 'root') =>
  activities.map((activity, index) => {
    const indexPath = `${parentPath}-${index}`;
    return {
      temp_id: createActivityTempId(indexPath),
      source_id: activity.id,
      name: activity.name || '',
      code: activity.code || '',
      description: activity.description || '',
      weighted_percentage: activity.weighted_percentage ?? 0,
      start_date: activity.start_date || null,
      end_date: activity.end_date || null,
      position_index: activity.position_index ?? index,
      tasks: normalizeTasks(activity.tasks || [], indexPath),
      children: normalizeActivities(activity.children || [], indexPath),
    };
  });

const updateActivityById = (activities, targetId, updateFn) =>
  activities.map((activity) => {
    if (activity.temp_id === targetId) {
      return updateFn(activity);
    }

    return {
      ...activity,
      children: updateActivityById(activity.children || [], targetId, updateFn),
    };
  });

const updateTaskById = (activities, targetTaskId, updateFn) =>
  activities.map((activity) => ({
    ...activity,
    tasks: (activity.tasks || []).map((task) =>
      task.temp_id === targetTaskId ? updateFn(task) : task
    ),
    children: updateTaskById(activity.children || [], targetTaskId, updateFn),
  }));

const countNodes = (activities = []) =>
  activities.reduce(
    (acc, activity) => {
      const childCount = countNodes(activity.children || []);
      return {
        activities: acc.activities + 1 + childCount.activities,
        tasks: acc.tasks + (activity.tasks?.length || 0) + childCount.tasks,
      };
    },
    { activities: 0, tasks: 0 }
  );

const flattenTasks = (activities = []) =>
  activities.flatMap((activity) => [
    ...(activity.tasks || []).map((task) => ({
      temp_id: task.temp_id,
      source_id: task.source_id,
      name: task.name || 'Unnamed Task',
    })),
    ...flattenTasks(activity.children || []),
  ]);

const ActivityEditor = ({
  activity,
  level = 0,
  onActivityFieldChange,
  onTaskFieldChange,
  onTaskHandlersChange,
  onTaskDependenciesChange,
  dependencyOptions,
  showHandlers,
  showDependencies,
}) => {
  return (
    <Accordion disableGutters sx={{ ml: level > 0 ? 2 : 0, mb: 1 }} defaultExpanded={level < 1}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction='row' spacing={1} alignItems='center' width='100%'>
          <Typography fontWeight={600} sx={{ flex: 1 }}>
            {activity.name || 'Untitled Activity'}
          </Typography>
          <Chip size='small' label={`${activity.tasks?.length || 0} tasks`} />
          {(activity.children?.length || 0) > 0 && (
            <Chip size='small' variant='outlined' label={`${activity.children.length} sub activities`} />
          )}
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size='small'
              fullWidth
              label='Activity Name'
              value={activity.name}
              onChange={(e) => onActivityFieldChange(activity.temp_id, 'name', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              size='small'
              fullWidth
              label='Code'
              value={activity.code || ''}
              onChange={(e) => onActivityFieldChange(activity.temp_id, 'code', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              size='small'
              fullWidth
              type='number'
              label='Weight %'
              value={activity.weighted_percentage ?? 0}
              onChange={(e) =>
                onActivityFieldChange(
                  activity.temp_id,
                  'weighted_percentage',
                  Number(e.target.value || 0)
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              size='small'
              fullWidth
              type='date'
              label='Start Date'
              value={activity.start_date ? String(activity.start_date).slice(0, 10) : ''}
              onChange={(e) => onActivityFieldChange(activity.temp_id, 'start_date', e.target.value || null)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              size='small'
              fullWidth
              type='date'
              label='End Date'
              value={activity.end_date ? String(activity.end_date).slice(0, 10) : ''}
              onChange={(e) => onActivityFieldChange(activity.temp_id, 'end_date', e.target.value || null)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              size='small'
              fullWidth
              multiline
              rows={2}
              label='Description'
              value={activity.description || ''}
              onChange={(e) =>
                onActivityFieldChange(activity.temp_id, 'description', e.target.value)
              }
            />
          </Grid>
        </Grid>

        {(activity.tasks?.length || 0) > 0 && (
          <Box mt={2}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Tasks
            </Typography>
            <Stack spacing={1}>
              {(activity.tasks || []).map((task) => {
                const availableDependencyOptions = (dependencyOptions || []).filter(
                  (option) => option.temp_id !== task.temp_id
                );
                const selectedDependencyOptions = availableDependencyOptions.filter((option) =>
                  (task.dependency_source_ids || []).includes(option.source_id || option.id)
                );

                return (
                  <Box key={task.temp_id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          size='small'
                          fullWidth
                          label='Task Name'
                          value={task.name}
                          onChange={(e) =>
                            onTaskFieldChange(task.temp_id, 'name', e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          size='small'
                          fullWidth
                          label='Code'
                          value={task.code || ''}
                          onChange={(e) =>
                            onTaskFieldChange(task.temp_id, 'code', e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 1 }}>
                        <TextField
                          size='small'
                          fullWidth
                          type='number'
                          label='Weight %'
                          value={task.weighted_percentage ?? 0}
                          onChange={(e) =>
                            onTaskFieldChange(
                              task.temp_id,
                              'weighted_percentage',
                              Number(e.target.value || 0)
                            )
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          size='small'
                          fullWidth
                          type='number'
                          label='Qty'
                          value={task.quantity ?? 0}
                          onChange={(e) =>
                            onTaskFieldChange(task.temp_id, 'quantity', Number(e.target.value || 0))
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          size='small'
                          fullWidth
                          type='date'
                          label='Start Date'
                          value={task.start_date ? String(task.start_date).slice(0, 10) : ''}
                          onChange={(e) =>
                            onTaskFieldChange(task.temp_id, 'start_date', e.target.value || null)
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          size='small'
                          fullWidth
                          type='date'
                          label='End Date'
                          value={task.end_date ? String(task.end_date).slice(0, 10) : ''}
                          onChange={(e) =>
                            onTaskFieldChange(task.temp_id, 'end_date', e.target.value || null)
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      {showDependencies && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Autocomplete
                            multiple
                            options={availableDependencyOptions}
                            value={selectedDependencyOptions}
                            isOptionEqualToValue={(option, value) =>
                              (option.source_id || option.id) === (value.source_id || value.id)
                            }
                            getOptionLabel={(option) => option?.name || 'Unnamed Task'}
                            onChange={(event, newValue) => {
                              onTaskDependenciesChange(task.temp_id, newValue || []);
                            }}
                            renderInput={(params) => (
                              <TextField {...params} size='small' fullWidth label='Dependencies' />
                            )}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  {...getTagProps({ index })}
                                  key={option.source_id || option.id}
                                  size='small'
                                  label={option.name}
                                  color='primary'
                                  variant='outlined'
                                />
                              ))
                            }
                            renderOption={(props, option) => (
                              <li {...props} key={option.temp_id || option.source_id || option.id}>
                                {option.name}
                              </li>
                            )}
                          />
                        </Grid>
                      )}
                      {showHandlers && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <UsersSelector
                            label='Handlers'
                            multiple
                            defaultValue={task.handlers || []}
                            onChange={(newValue) => {
                              const selectedHandlers = Array.isArray(newValue) ? newValue : [];
                              onTaskHandlersChange(task.temp_id, selectedHandlers);
                            }}
                          />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, md: (showHandlers && showDependencies) ? 12 : (showDependencies || showHandlers) ? 6 : 12 }}>
                        <TextField
                          size='small'
                          fullWidth
                          multiline
                          rows={2}
                          label='Description'
                          value={task.description || ''}
                          onChange={(e) =>
                            onTaskFieldChange(task.temp_id, 'description', e.target.value)
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {(activity.children?.length || 0) > 0 && (
          <Box mt={2}>
            {(activity.children || []).map((child) => (
              <ActivityEditor
                key={child.temp_id}
                activity={child}
                level={level + 1}
                onActivityFieldChange={onActivityFieldChange}
                onTaskFieldChange={onTaskFieldChange}
                onTaskHandlersChange={onTaskHandlersChange}
                onTaskDependenciesChange={onTaskDependenciesChange}
                dependencyOptions={dependencyOptions}
                showHandlers={showHandlers}
                showDependencies={showDependencies}
              />
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

function WBSCloneDialog({ setOpenDialog }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { project } = useProjectProfile();

  const [projectKeyword, setProjectKeyword] = useState('');
  const [sourceProject, setSourceProject] = useState(null);
  const [draftActivities, setDraftActivities] = useState([]);
  const [options, setOptions] = useState({
    include_dependencies: true,
    include_handlers: false,
  });

  const { data: projectsData, isFetching: isProjectsLoading } = useQuery({
    queryKey: ['projectCloneSourceList', projectKeyword],
    queryFn: () => projectsServices.getList({ keyword: projectKeyword, limit: 20 }),
  });

  const projectOptions = useMemo(() => {
    const list = Array.isArray(projectsData?.data) ? projectsData.data : [];
    return list.filter((item) => item.id !== project?.id);
  }, [projectsData, project?.id]);

  const {
    data: sourceTimelineData,
    isFetching: isTimelineLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['cloneSourceTimelineActivities', sourceProject?.id],
    queryFn: () => projectsServices.showProjectTimelineActivities(sourceProject?.id),
    enabled: false,
  });

  useEffect(() => {
    if (!sourceTimelineData) return;
    setDraftActivities(normalizeActivities(sourceTimelineData));
  }, [sourceTimelineData]);

  const cloneMutation = useMutation({
    mutationFn: projectsServices.cloneProjectWbsDraft,
    onSuccess: (response) => {
      enqueueSnackbar(response?.message || 'WBS cloned successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['projectTimelineActivities', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projectTimelineActivities'] });
      setOpenDialog(false);
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to clone WBS', {
        variant: 'error',
      });
    },
  });

  const handleLoadSource = async () => {
    if (!sourceProject?.id) {
      enqueueSnackbar('Please select source project first', { variant: 'warning' });
      return;
    }
    await refetchTimeline();
  };

  const handleActivityFieldChange = (activityId, field, value) => {
    setDraftActivities((prev) =>
      updateActivityById(prev, activityId, (activity) => ({
        ...activity,
        [field]: value,
      }))
    );
  };

  const handleTaskFieldChange = (taskId, field, value) => {
    setDraftActivities((prev) =>
      updateTaskById(prev, taskId, (task) => ({
        ...task,
        [field]: value,
      }))
    );
  };

  const handleTaskHandlersChange = (taskId, handlers) => {
    setDraftActivities((prev) =>
      updateTaskById(prev, taskId, (task) => ({
        ...task,
        handlers: handlers || [],
        handlers_ids: (handlers || []).map((handler) => handler.id),
      }))
    );
  };

  const nodeCounts = useMemo(() => countNodes(draftActivities), [draftActivities]);
  const dependencyOptions = useMemo(() => flattenTasks(draftActivities), [draftActivities]);

  const handleTaskDependenciesChange = (taskId, dependencies) => {
    setDraftActivities((prev) =>
      updateTaskById(prev, taskId, (task) => ({
        ...task,
        dependencies: (dependencies || []).map((dependency) => ({
          id: dependency.source_id || dependency.id,
          name: dependency.name || 'Unnamed Task',
        })),
        dependency_source_ids: (dependencies || []).map(
          (dependency) => dependency.source_id || dependency.id
        ),
      }))
    );
  };

  const validationErrors = useMemo(() => {
    const errors = [];

    const validateActivity = (activity, pathLabel) => {
      if (
        activity.start_date &&
        activity.end_date &&
        new Date(activity.start_date) > new Date(activity.end_date)
      ) {
        errors.push(`${pathLabel}: activity start date cannot be after end date`);
      }

      (activity.tasks || []).forEach((task) => {
        if (task.start_date && task.end_date && new Date(task.start_date) > new Date(task.end_date)) {
          errors.push(`${pathLabel} / ${task.name || 'Unnamed Task'}: task start date cannot be after end date`);
        }
      });

      (activity.children || []).forEach((child) =>
        validateActivity(child, `${pathLabel} / ${child.name || 'Unnamed Activity'}`)
      );
    };

    draftActivities.forEach((activity) =>
      validateActivity(activity, activity.name || 'Unnamed Activity')
    );

    return errors;
  }, [draftActivities]);

  const handleSubmit = () => {
    if (!sourceProject?.id) {
      enqueueSnackbar('Please select source project', { variant: 'warning' });
      return;
    }

    if (draftActivities.length === 0) {
      enqueueSnackbar('There is no WBS data to clone', { variant: 'warning' });
      return;
    }

    if (validationErrors.length > 0) {
      enqueueSnackbar('Please resolve date validation errors before submit', {
        variant: 'warning',
      });
      return;
    }

    cloneMutation.mutate({
      target_project_id: project?.id,
      source_project_id: sourceProject.id,
      options,
      draft_activities: draftActivities,
    });
  };

  return (
    <>
      <DialogTitle textAlign='center'>Clone WBS Draft From Another Project</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity='info' variant='outlined'>
            Select source project, load its WBS, edit activities/tasks here, then submit to clone.
          </Alert>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Autocomplete
                options={projectOptions}
                loading={isProjectsLoading}
                value={sourceProject}
                onChange={(event, value) => setSourceProject(value)}
                onInputChange={(event, value) => setProjectKeyword(value)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option?.name || ''}
                renderInput={(params) => (
                  <TextField {...params} size='small' label='Source Project' fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.include_dependencies}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, include_dependencies: e.target.checked }))
                      }
                    />
                  }
                  label='Include Dependencies'
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.include_handlers}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, include_handlers: e.target.checked }))
                      }
                    />
                  }
                  label='Include Handlers'
                />

              </Stack>
            </Grid>

            <Grid size={12} textAlign={'end'}>
              <Stack direction='row' spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button variant='outlined' loading={isTimelineLoading} onClick={handleLoadSource}>
                  {'Load WBS'}
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Divider />

          {draftActivities.length > 0 && (
            <Stack direction='row' spacing={1}>
              <Chip label={`${nodeCounts.activities} activities`} />
              <Chip label={`${nodeCounts.tasks} tasks`} />
              <Chip label={`Target: ${project?.name || 'Current Project'}`} variant='outlined' />
            </Stack>
          )}

          {validationErrors.length > 0 && (
            <Alert severity='warning' variant='outlined'>
              <Typography variant='body2' fontWeight={600} sx={{ mb: 0.5 }}>
                Please resolve these validation issues:
              </Typography>
              {validationErrors.slice(0, 6).map((error) => (
                <Typography key={error} variant='caption' display='block'>
                  • {error}
                </Typography>
              ))}
              {validationErrors.length > 6 && (
                <Typography variant='caption' display='block'>
                  • and {validationErrors.length - 6} more
                </Typography>
              )}
            </Alert>
          )}

          {draftActivities.length === 0 && (
            <Alert severity='info' variant='outlined'>
              No source WBS loaded yet.
            </Alert>
          )}

          {draftActivities.length > 0 && (
            <Box sx={{ maxHeight: '58vh', overflowY: 'auto', pr: 0.5 }}>
              {draftActivities.map((activity) => (
                <ActivityEditor
                  key={activity.temp_id}
                  activity={activity}
                  onActivityFieldChange={handleActivityFieldChange}
                  onTaskFieldChange={handleTaskFieldChange}
                  onTaskHandlersChange={handleTaskHandlersChange}
                  onTaskDependenciesChange={handleTaskDependenciesChange}
                  dependencyOptions={dependencyOptions}
                  showHandlers={options.include_handlers}
                  showDependencies={options.include_dependencies}
                />
              ))}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Tooltip title='Close dialog without cloning'>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        </Tooltip>
        <LoadingButton
          variant='contained'
          onClick={handleSubmit}
          loading={cloneMutation.isPending}
          disabled={draftActivities.length === 0}
        >
          Submit Clone
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default WBSCloneDialog;