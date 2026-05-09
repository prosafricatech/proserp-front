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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DeleteOutline, ExpandMore } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import projectsServices from '../../../project-services';
import { useProjectProfile } from '../../ProjectProfileProvider';
import UsersSelector from '@/components/sharedComponents/UsersSelector';

type EntityId = number | string;

type ProjectOption = {
  id: EntityId;
  name?: string | null;
};

type HandlerOption = {
  id: number;
  name: string;
};

type DependencyOption = {
  id?: EntityId;
  source_id?: EntityId | null;
  temp_id?: string;
  name: string;
};

type DraftTask = {
  temp_id: string;
  source_id: EntityId | null;
  name: string;
  code: string;
  description: string;
  weighted_percentage: number;
  quantity: number;
  is_milestone: number;
  start_date: string | null;
  end_date: string | null;
  position_index: number;
  measurement_unit_id: EntityId | null;
  handlers: HandlerOption[];
  handlers_ids: number[];
  dependency_source_ids: EntityId[];
  dependencies: Array<{ id: EntityId; name: string }>;
  [key: string]: unknown;
};

type DraftActivity = {
  temp_id: string;
  source_id: EntityId | null;
  name: string;
  code: string;
  description: string;
  weighted_percentage: number;
  start_date: string | null;
  end_date: string | null;
  position_index: number;
  tasks: DraftTask[];
  children: DraftActivity[];
  [key: string]: unknown;
};

type CloneOptions = {
  include_dependencies: boolean;
  include_handlers: boolean;
};

type CountNodesResult = {
  activities: number;
  tasks: number;
};

type ActivityEditorProps = {
  activity: DraftActivity;
  level?: number;
  onActivityFieldChange: (activityId: string, field: string, value: unknown) => void;
  onTaskFieldChange: (taskId: string, field: string, value: unknown) => void;
  onTaskHandlersChange: (taskId: string, handlers: HandlerOption[]) => void;
  onTaskDependenciesChange: (taskId: string, dependencies: DependencyOption[]) => void;
  onRemoveTask: (taskId: string) => void;
  onRemoveActivity: (activityId: string) => void;
  pendingUndo: PendingUndoState | null;
  undoSecondsLeft: number;
  onUndoDelete: () => void;
  dependencyOptions: DependencyOption[];
  showHandlers: boolean;
  showDependencies: boolean;
};

type WBSCloneDialogProps = {
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
};

type UndoLocation =
  | { type: 'task'; parentActivityTempId: string; index: number }
  | { type: 'activity'; parentActivityTempId: string | null; index: number };

type PendingUndoState = {
  previousDraft: DraftActivity[];
  expiresAt: number;
  message: string;
  location: UndoLocation;
};

const UNDO_WINDOW_MS = 8000;

const createActivityTempId = (indexPath: string): string => `activity-${indexPath}`;
const createTaskTempId = (activityPath: string, index: number): string => `task-${activityPath}-${index}`;

const normalizeTasks = (tasks: any[] = [], activityPath: string): DraftTask[] =>
  tasks.map((task, index) => ({
    temp_id: createTaskTempId(activityPath, index),
    source_id: task.id ?? null,
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
      task.handlers?.map((handler: any) => ({
        id: Number(handler.id),
        name: handler.name || handler.full_name || handler.email || 'Unknown User',
      })) || [],
    handlers_ids: task.handlers?.map((handler: any) => Number(handler.id)) || [],
    dependency_source_ids: task.dependencies?.map((dependency: any) => dependency.id) || [],
    dependencies:
      task.dependencies?.map((dep: any) => ({
        id: dep.id,
        name: dep.name || dep.label || `Task #${dep.id}`,
      })) || [],
  }));

const normalizeActivities = (activities: any[] = [], parentPath = 'root'): DraftActivity[] =>
  activities.map((activity, index) => {
    const indexPath = `${parentPath}-${index}`;
    return {
      temp_id: createActivityTempId(indexPath),
      source_id: activity.id ?? null,
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

const updateActivityById = (
  activities: DraftActivity[],
  targetId: string,
  updateFn: (activity: DraftActivity) => DraftActivity
): DraftActivity[] =>
  activities.map((activity) => {
    if (activity.temp_id === targetId) {
      return updateFn(activity);
    }

    return {
      ...activity,
      children: updateActivityById(activity.children || [], targetId, updateFn),
    };
  });

const updateTaskById = (
  activities: DraftActivity[],
  targetTaskId: string,
  updateFn: (task: DraftTask) => DraftTask
): DraftActivity[] =>
  activities.map((activity) => ({
    ...activity,
    tasks: (activity.tasks || []).map((task) =>
      task.temp_id === targetTaskId ? updateFn(task) : task
    ),
    children: updateTaskById(activity.children || [], targetTaskId, updateFn),
  }));

const countNodes = (activities: DraftActivity[] = []): CountNodesResult =>
  activities.reduce<CountNodesResult>(
    (acc, activity) => {
      const childCount = countNodes(activity.children || []);
      return {
        activities: acc.activities + 1 + childCount.activities,
        tasks: acc.tasks + (activity.tasks?.length || 0) + childCount.tasks,
      };
    },
    { activities: 0, tasks: 0 }
  );

const flattenTasks = (activities: DraftActivity[] = []): DependencyOption[] =>
  activities.flatMap((activity) => [
    ...(activity.tasks || []).map((task) => ({
      temp_id: task.temp_id,
      source_id: task.source_id,
      name: task.name || 'Unnamed Task',
    })),
    ...flattenTasks(activity.children || []),
  ]);

const removeTaskById = (activities: DraftActivity[], targetTaskId: string): DraftActivity[] =>
  activities.map((activity) => ({
    ...activity,
    tasks: (activity.tasks || []).filter((task) => task.temp_id !== targetTaskId),
    children: removeTaskById(activity.children || [], targetTaskId),
  }));

const removeActivityAndCollectTaskIds = (
  activities: DraftActivity[],
  targetActivityId: string
): { nextActivities: DraftActivity[]; removedSourceIds: EntityId[] } => {
  const removedSourceIds: EntityId[] = [];

  const collectTaskSourceIds = (items: DraftActivity[]) => {
    items.forEach((item) => {
      (item.tasks || []).forEach((task) => {
        if (task.source_id !== null && task.source_id !== undefined && task.source_id !== '') {
          removedSourceIds.push(task.source_id);
        }
      });
      collectTaskSourceIds(item.children || []);
    });
  };

  const walk = (items: DraftActivity[]): DraftActivity[] =>
    items
      .filter((item) => {
        const shouldKeep = item.temp_id !== targetActivityId;
        if (!shouldKeep) {
          collectTaskSourceIds([item]);
        }
        return shouldKeep;
      })
      .map((item) => ({
        ...item,
        children: walk(item.children || []),
      }));

  return {
    nextActivities: walk(activities),
    removedSourceIds,
  };
};

const sanitizeDependencies = (activities: DraftActivity[], removedSourceIds: EntityId[]): DraftActivity[] => {
  if (removedSourceIds.length === 0) return activities;

  const removedSet = new Set(removedSourceIds);

  return activities.map((activity) => ({
    ...activity,
    tasks: (activity.tasks || []).map((task) => ({
      ...task,
      dependency_source_ids: (task.dependency_source_ids || []).filter(
        (id) => !removedSet.has(id)
      ),
      dependencies: (task.dependencies || []).filter((dep) => !removedSet.has(dep.id)),
    })),
    children: sanitizeDependencies(activity.children || [], removedSourceIds),
  }));
};

const cloneDraftActivities = (activities: DraftActivity[]): DraftActivity[] =>
  JSON.parse(JSON.stringify(activities)) as DraftActivity[];

const findTaskLocation = (
  activities: DraftActivity[],
  taskTempId: string
): { parentActivityTempId: string; index: number } | null => {
  for (const activity of activities) {
    const index = (activity.tasks || []).findIndex((task) => task.temp_id === taskTempId);
    if (index >= 0) {
      return { parentActivityTempId: activity.temp_id, index };
    }

    const nested = findTaskLocation(activity.children || [], taskTempId);
    if (nested) return nested;
  }

  return null;
};

const findActivityLocation = (
  activities: DraftActivity[],
  activityTempId: string,
  parentActivityTempId: string | null = null
): { parentActivityTempId: string | null; index: number } | null => {
  const index = activities.findIndex((activity) => activity.temp_id === activityTempId);
  if (index >= 0) {
    return { parentActivityTempId, index };
  }

  for (const activity of activities) {
    const nested = findActivityLocation(activity.children || [], activityTempId, activity.temp_id);
    if (nested) return nested;
  }

  return null;
};

const UndoInlineAlert = ({
  message,
  seconds,
  onUndo,
}: {
  message: string;
  seconds: number;
  onUndo: () => void;
}) => (
  <Alert
    severity='warning'
    variant='outlined'
    sx={{
      mb: 1,
      borderWidth: 1.5,
      bgcolor: (theme) => (theme.type === 'dark' ? 'warning.dark' : 'warning.50'),
      borderColor: (theme) =>
        theme.type === 'dark' ? theme.palette.warning.main : theme.palette.warning.light,
      color: (theme) =>
        theme.type === 'dark' ? theme.palette.warning.contrastText : theme.palette.text.primary,
      '& .MuiAlert-icon': {
        color: (theme) =>
          theme.type === 'dark' ? theme.palette.warning.light : theme.palette.warning.main,
      },
      '& .MuiAlert-message': {
        display: 'flex',
        alignItems: 'center',
        fontWeight: 600,
      },
      '& .MuiAlert-action': {
        alignItems: 'center',
      },
    }}
    action={
      <Button
        variant='contained'
        color='warning'
        size='small'
        onClick={onUndo}
        sx={{
          fontWeight: 700,
          minWidth: 92,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        }}
      >
        Undo ({seconds}s)
      </Button>
    }
  >
    {message}. You can undo within {seconds} seconds.
  </Alert>
);

const ActivityEditor = ({
  activity,
  level = 0,
  onActivityFieldChange,
  onTaskFieldChange,
  onTaskHandlersChange,
  onTaskDependenciesChange,
  onRemoveTask,
  onRemoveActivity,
  pendingUndo,
  undoSecondsLeft,
  onUndoDelete,
  dependencyOptions,
  showHandlers,
  showDependencies,
}: ActivityEditorProps) => {
  const isTaskUndoForThisActivity =
    pendingUndo?.location.type === 'task' &&
    pendingUndo.location.parentActivityTempId === activity.temp_id;
  const isChildActivityUndoForThisActivity =
    pendingUndo?.location.type === 'activity' &&
    pendingUndo.location.parentActivityTempId === activity.temp_id;
  const showTaskSection = (activity.tasks?.length || 0) > 0 || isTaskUndoForThisActivity;
  const showChildrenSection = (activity.children?.length || 0) > 0 || isChildActivityUndoForThisActivity;

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
          <Tooltip title={level === 0 ? 'Remove Group' : 'Remove Activity'}>
            <Box
              role='button'
              tabIndex={0}
              aria-label={level === 0 ? 'Remove Group' : 'Remove Activity'}
              onClick={(event) => {
                event.stopPropagation();
                onRemoveActivity(activity.temp_id);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemoveActivity(activity.temp_id);
                }
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'error.main',
                borderRadius: 1,
                p: 0.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <DeleteOutline fontSize='small' />
            </Box>
          </Tooltip>
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

        {showTaskSection && (
          <Box mt={2}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Tasks
            </Typography>
            <Stack spacing={1}>
              {(activity.tasks || []).map((task, taskIndex) => {
                const availableDependencyOptions = (dependencyOptions || []).filter(
                  (option) => option.temp_id !== task.temp_id
                );
                const selectedDependencyOptions = availableDependencyOptions.filter((option) =>
                  (task.dependency_source_ids || []).includes(option.source_id || option.id || '')
                );

                return (
                  <React.Fragment key={task.temp_id}>
                    {isTaskUndoForThisActivity && pendingUndo.location.index === taskIndex && (
                      <UndoInlineAlert
                        message={pendingUndo.message}
                        seconds={undoSecondsLeft}
                        onUndo={onUndoDelete}
                      />
                    )}
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Stack direction='row' justifyContent='flex-end' sx={{ mb: 0.5 }}>
                      <Tooltip title='Remove Task'>
                        <IconButton size='small' color='error' onClick={() => onRemoveTask(task.temp_id)}>
                          <DeleteOutline fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Stack>
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
                            onChange={(_event, newValue) => {
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
                            onChange={(newValue: unknown) => {
                              const selectedHandlers = Array.isArray(newValue) ? (newValue as HandlerOption[]) : [];
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
                  </React.Fragment>
                );
              })}
              {isTaskUndoForThisActivity && pendingUndo.location.index === (activity.tasks || []).length && (
                <UndoInlineAlert
                  message={pendingUndo.message}
                  seconds={undoSecondsLeft}
                  onUndo={onUndoDelete}
                />
              )}
            </Stack>
          </Box>
        )}

        {showChildrenSection && (
          <Box mt={2}>
            {(activity.children || []).map((child, childIndex) => (
              <React.Fragment key={child.temp_id}>
                {isChildActivityUndoForThisActivity && pendingUndo.location.index === childIndex && (
                  <UndoInlineAlert
                    message={pendingUndo.message}
                    seconds={undoSecondsLeft}
                    onUndo={onUndoDelete}
                  />
                )}
                <ActivityEditor
                  activity={child}
                  level={level + 1}
                  onActivityFieldChange={onActivityFieldChange}
                  onTaskFieldChange={onTaskFieldChange}
                  onTaskHandlersChange={onTaskHandlersChange}
                  onTaskDependenciesChange={onTaskDependenciesChange}
                  onRemoveTask={onRemoveTask}
                  onRemoveActivity={onRemoveActivity}
                  pendingUndo={pendingUndo}
                  undoSecondsLeft={undoSecondsLeft}
                  onUndoDelete={onUndoDelete}
                  dependencyOptions={dependencyOptions}
                  showHandlers={showHandlers}
                  showDependencies={showDependencies}
                />
              </React.Fragment>
            ))}
            {isChildActivityUndoForThisActivity && pendingUndo.location.index === (activity.children || []).length && (
              <UndoInlineAlert
                message={pendingUndo.message}
                seconds={undoSecondsLeft}
                onUndo={onUndoDelete}
              />
            )}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

function WBSCloneDialog({ setOpenDialog }: WBSCloneDialogProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { project } = useProjectProfile() as { project?: ProjectOption | null };

  const [projectKeyword, setProjectKeyword] = useState<string>('');
  const [sourceProject, setSourceProject] = useState<ProjectOption | null>(null);
  const [draftActivities, setDraftActivities] = useState<DraftActivity[]>([]);
  const [openReloadWarning, setOpenReloadWarning] = useState<boolean>(false);
  const [pendingUndo, setPendingUndo] = useState<PendingUndoState | null>(null);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number>(0);
  const [options, setOptions] = useState<CloneOptions>({
    include_dependencies: true,
    include_handlers: true,
  });

  const { data: projectsData, isFetching: isProjectsLoading } = useQuery({
    queryKey: ['projectCloneSourceList', projectKeyword],
    queryFn: () => projectsServices.getList({ keyword: projectKeyword, limit: 20 }),
  });

  const projectOptions = useMemo<ProjectOption[]>(() => {
    const list = Array.isArray(projectsData?.data) ? projectsData.data : [];
    return list.filter((item: ProjectOption) => item.id !== project?.id);
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
    setDraftActivities(normalizeActivities(sourceTimelineData as any[]));
  }, [sourceTimelineData]);

  const cloneMutation = useMutation({
    mutationFn: projectsServices.cloneProjectWbsDraft,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'WBS cloned successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['projectTimelineActivities', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projectTimelineActivities'] });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to clone WBS', {
        variant: 'error',
      });
    },
  });

  const doLoadSource = async () => {
    if (!sourceProject?.id) {
      enqueueSnackbar('Please select source project first', { variant: 'warning' });
      return;
    }

    await refetchTimeline();
    setPendingUndo(null);
    setUndoSecondsLeft(0);
  };

  const handleLoadSource = async () => {
    if (!sourceProject?.id) {
      enqueueSnackbar('Please select source project first', { variant: 'warning' });
      return;
    }

    if (draftActivities.length > 0) {
      setOpenReloadWarning(true);
      return;
    }

    await doLoadSource();
  };

  const handleConfirmReload = async () => {
    setOpenReloadWarning(false);
    await doLoadSource();
  };

  const handleActivityFieldChange = (activityId: string, field: string, value: unknown) => {
    setDraftActivities((prev) =>
      updateActivityById(prev, activityId, (activity) => ({
        ...activity,
        [field]: value,
      }))
    );
  };

  const handleTaskFieldChange = (taskId: string, field: string, value: unknown) => {
    setDraftActivities((prev) =>
      updateTaskById(prev, taskId, (task) => ({
        ...task,
        [field]: value,
      }))
    );
  };

  const handleTaskHandlersChange = (taskId: string, handlers: HandlerOption[]) => {
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

  const handleTaskDependenciesChange = (taskId: string, dependencies: DependencyOption[]) => {
    setDraftActivities((prev) =>
      updateTaskById(prev, taskId, (task) => ({
        ...task,
        dependencies: (dependencies || []).map((dependency) => ({
          id: dependency.source_id || dependency.id || '',
          name: dependency.name || 'Unnamed Task',
        })),
        dependency_source_ids: (dependencies || []).map(
          (dependency) => dependency.source_id || dependency.id || ''
        ),
      }))
    );
  };

  const startUndoWindow = (
    previousDraft: DraftActivity[],
    message: string,
    location: UndoLocation
  ) => {
    const snapshot = cloneDraftActivities(previousDraft);
    const expiresAt = Date.now() + UNDO_WINDOW_MS;
    setPendingUndo({ previousDraft: snapshot, expiresAt, message, location });
    setUndoSecondsLeft(Math.ceil(UNDO_WINDOW_MS / 1000));
  };

  const handleUndoDelete = () => {
    if (!pendingUndo) return;
    setDraftActivities(pendingUndo.previousDraft);
    setPendingUndo(null);
    setUndoSecondsLeft(0);
    enqueueSnackbar('Deleted item restored', { variant: 'success' });
  };

  const handleRemoveTask = (taskTempId: string) => {
    const previousDraft = cloneDraftActivities(draftActivities);
    const taskLocation = findTaskLocation(draftActivities, taskTempId);
    const removedTask = dependencyOptions.find((option) => option.temp_id === taskTempId);
    const removedSourceIds =
      removedTask?.source_id !== undefined && removedTask?.source_id !== null && removedTask?.source_id !== ''
        ? [removedTask.source_id]
        : [];

    const nextDraft = sanitizeDependencies(removeTaskById(draftActivities, taskTempId), removedSourceIds);
    setDraftActivities(nextDraft);
    if (taskLocation) {
      startUndoWindow(previousDraft, 'Task removed', {
        type: 'task',
        parentActivityTempId: taskLocation.parentActivityTempId,
        index: taskLocation.index,
      });
    }
  };

  const handleRemoveActivity = (activityTempId: string) => {
    const previousDraft = cloneDraftActivities(draftActivities);
    const activityLocation = findActivityLocation(draftActivities, activityTempId);
    const { nextActivities, removedSourceIds } = removeActivityAndCollectTaskIds(draftActivities, activityTempId);
    setDraftActivities(sanitizeDependencies(nextActivities, removedSourceIds));
    if (activityLocation) {
      startUndoWindow(previousDraft, 'Activity/Group removed', {
        type: 'activity',
        parentActivityTempId: activityLocation.parentActivityTempId,
        index: activityLocation.index,
      });
    }
  };

  useEffect(() => {
    if (!pendingUndo) return;

    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((pendingUndo.expiresAt - Date.now()) / 1000));
      setUndoSecondsLeft(seconds);

      if (seconds <= 0) {
        setPendingUndo(null);
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [pendingUndo]);

  const validationErrors = useMemo<string[]>(() => {
    const errors: string[] = [];

    const validateActivity = (activity: DraftActivity, pathLabel: string) => {
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
                onChange={(_event, value) => {
                  setSourceProject(value);
                  setProjectKeyword('');
                }}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input') {
                    setProjectKeyword(value);
                  }
                }}
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

            <Grid size={12} textAlign='end'>
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

          {(draftActivities.length > 0 ||
            (pendingUndo?.location.type === 'activity' && pendingUndo.location.parentActivityTempId === null)) && (
            <Box sx={{ maxHeight: '58vh', overflowY: 'auto', pr: 0.5 }}>
              {draftActivities.map((activity, index) => (
                <React.Fragment key={activity.temp_id}>
                  {pendingUndo?.location.type === 'activity' &&
                    pendingUndo.location.parentActivityTempId === null &&
                    pendingUndo.location.index === index && (
                      <UndoInlineAlert
                        message={pendingUndo.message}
                        seconds={undoSecondsLeft}
                        onUndo={handleUndoDelete}
                      />
                    )}
                  <ActivityEditor
                    activity={activity}
                    onActivityFieldChange={handleActivityFieldChange}
                    onTaskFieldChange={handleTaskFieldChange}
                    onTaskHandlersChange={handleTaskHandlersChange}
                    onTaskDependenciesChange={handleTaskDependenciesChange}
                    onRemoveTask={handleRemoveTask}
                    onRemoveActivity={handleRemoveActivity}
                    pendingUndo={pendingUndo}
                    undoSecondsLeft={undoSecondsLeft}
                    onUndoDelete={handleUndoDelete}
                    dependencyOptions={dependencyOptions}
                    showHandlers={options.include_handlers}
                    showDependencies={options.include_dependencies}
                  />
                </React.Fragment>
              ))}
              {pendingUndo?.location.type === 'activity' &&
                pendingUndo.location.parentActivityTempId === null &&
                pendingUndo.location.index === draftActivities.length && (
                  <UndoInlineAlert
                    message={pendingUndo.message}
                    seconds={undoSecondsLeft}
                    onUndo={handleUndoDelete}
                  />
                )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <Dialog open={openReloadWarning} onClose={() => setOpenReloadWarning(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Reload WBS?</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            This will discard all current draft changes in this dialog. Do you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReloadWarning(false)}>Cancel</Button>
          <LoadingButton color='warning' variant='contained' onClick={handleConfirmReload} loading={isTimelineLoading}>
            Reload
          </LoadingButton>
        </DialogActions>
      </Dialog>

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