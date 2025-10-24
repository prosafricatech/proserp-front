'use client';
import React from 'react';
import {
  Grid,
  Tooltip,
  Typography,
  Chip,
  Box,
  LinearProgress,
  Stack,
} from '@mui/material';
import { FlagOutlined } from '@mui/icons-material';
import TasksItemAction from './TasksItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function LinearProgressWithLabel({ value, label, color }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
          {label}
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(Number(value) || 0, 100)}
            color={color}
            sx={{ height: 8, borderRadius: 2 }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {`${Math.min(Number(value) || 0, 100)}%`}
        </Typography>
      </Stack>
    </Box>
  );
}

function TasksListItem({ filteredTasks, activity }) {
  return (
    <Grid size={{ xs: 12 }} padding={1}>
      {filteredTasks.length > 0 && (
        <Typography fontWeight={600} mb={1}>
          Tasks
        </Typography>
      )}

      {filteredTasks.map((task, index) => {
        const execPercent = task.executed_percentage ?? 0;
        const timePercent = task.percentage_time_elapsed ?? 0;

        // Color logic
        let execColor = 'primary';
        if (execPercent >= 100) execColor = 'success';
        else if (execPercent >= 70) execColor = 'warning';
        else if (execPercent < 30) execColor = 'error';

        let timeColor = 'primary';
        if (timePercent >= 100) timeColor = 'error';
        else if (timePercent >= 80) timeColor = 'warning';
        else if (timePercent < 30) timeColor = 'success';

        return (
          <Grid
            key={index}
            container
            columnSpacing={2}
            alignItems="center"
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
              p: 1.5,
            }}
          >
            <Grid size={{ xs: 12, md: 6, lg: 5 }} mb={1}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={2.5} alignItems="center">
                    {!!task?.is_milestone && (
                      <Tooltip title="Milestone Task">
                        <FlagOutlined fontSize="small" color="success" />
                      </Tooltip>
                    )}
                    <Tooltip title="Task Name">
                      <Typography component="span" fontWeight={500}>
                        {task.name}
                      </Typography>
                    </Tooltip>
                    {task.code && (
                      <Tooltip title="Task Code">
                        <Typography variant="body2" color="text.secondary">
                          {task.code}
                        </Typography>
                      </Tooltip>
                    )}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                  <Tooltip title="Quantity">
                    <Typography variant="body2">
                      Quantity: {task.quantity?.toLocaleString?.() ?? '—'}{' '}
                      {task.measurement_unit?.symbol ?? ''}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                  <Tooltip title="Executed Quantity">
                    <Typography variant="body2">
                      Executed: {task.executed_quantity?.toLocaleString?.() ?? '—'}{' '}
                      {task.measurement_unit?.symbol ?? ''}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                  <Tooltip title="Remaining Quantity">
                    <Typography variant="body2">
                      Remaining:{' '}
                      {(task.quantity - task.executed_quantity)?.toLocaleString?.() ?? '—'}{' '}
                      {task.measurement_unit?.symbol ?? ''}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                  <Tooltip title="Start → End Date">
                    <Typography variant="body2" noWrap>
                      {task.start_date || task.end_date
                        ? `${task.start_date ? readableDate(task.start_date, false) : 'Not Set'} → ${
                            task.end_date ? readableDate(task.end_date, false) : 'Not Set'
                          }`
                        : 'Not Set'}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                  <Tooltip title="Duration">
                    <Typography variant="body2" color="text.secondary">
                      <strong>Duration:</strong> {task.number_of_days ?? '—'} days
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                  <Tooltip title="Remaining Days">
                    <Typography
                      variant="caption"
                      color={task.days_remaining < 0 ? 'error.main' : 'text.secondary'}
                    >
                      <strong>Remaining:</strong> {task.days_remaining ?? '—'} days
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 5 }} mb={1}>
              <Stack spacing={2.5} direction="column">
                <LinearProgressWithLabel
                  value={execPercent}
                  label="Execution"
                  color={execColor}
                />
                <LinearProgressWithLabel
                  value={timePercent}
                  label="Time"
                  color={timeColor}
                />
              </Stack>
            </Grid>

            <Grid
              size={{ xs: 12, md: 12, lg: 2 }}
              mb={1}
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Weighted Percentage">
                  <Chip
                    size="small"
                    color="default"
                    label={`${task.weighted_percentage?.toLocaleString() ?? 0}% Weight`}
                  />
                </Tooltip>
                <TasksItemAction task={task} activity={activity} />
              </Stack>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default TasksListItem;
