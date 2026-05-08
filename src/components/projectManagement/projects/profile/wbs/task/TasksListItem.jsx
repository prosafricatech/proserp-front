'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { FlagOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import TasksItemAction from './TasksItemAction';

function LinearProgressWithLabel({
  value,
  execPercent,
  timePercent,
  color,
  hasTimeDates,
}) {
  const tooltipMsg = !hasTimeDates
    ? 'No start/end dates set — execution progress only.'
    : color === 'success'
      ? 'Execution is on track with time elapsed.'
      : color === 'warning'
        ? 'Execution is lagging behind time elapsed. Monitor closely.'
        : color === 'error'
          ? 'Execution is significantly behind schedule.'
          : 'Progress status.';
  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={(theme) => ({
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: { xs: 'flex-start', sm: 'space-between' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 0.5,
          gap: { xs: 0.5, sm: 0 },
        })}
      >
        <Typography variant='body2' color='text.secondary' fontWeight={500}>
          Execution: {Math.min(100, Math.round(execPercent))}%
        </Typography>
        {hasTimeDates ? (
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            Time Elapsed: {Math.min(100, Math.round(timePercent))}%
          </Typography>
        ) : (
          <Chip
            size='small'
            label='Time: Not Set'
            variant='outlined'
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}
      </Box>
      <Tooltip title={tooltipMsg}>
        <LinearProgress
          variant='determinate'
          value={Math.min(Number(value) || 0, 100)}
          color={color}
          sx={{ height: 8, borderRadius: 2 }}
        />
      </Tooltip>
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
        const rawTimePercent = task.percentage_time_elapsed ?? 0;
        const timePercent = Math.min(100, rawTimePercent);
        const hasTimeDates = Boolean(task.start_date && task.end_date);
        let execColor = 'primary';
        if (hasTimeDates) {
          execColor = 'success';
          const diff = timePercent - execPercent;
          if (diff >= 10) {
            execColor = 'error';
          } else if (diff >= 5) {
            execColor = 'warning';
          }
        }

        return (
          <Grid
            key={index}
            container
            columnSpacing={2}
            alignItems='center'
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
              p: 1.5,
            }}
          >
            {/* Row 1: Milestone, Name, Code */}
            <Grid size={12} mb={1}>
              <Stack direction='row' spacing={2} alignItems='center'>
                {!!task?.is_milestone && (
                  <Tooltip title='Milestone Task'>
                    <FlagOutlined fontSize='small' color='success' />
                  </Tooltip>
                )}
                <Tooltip title='Task Name'>
                  <Typography component='span' fontWeight={500}>
                    {task.name}
                  </Typography>
                </Tooltip>
                {task.code && (
                  <Tooltip title='Task Code'>
                    <Typography variant='body2' color='text.secondary'>
                      {task.code}
                    </Typography>
                  </Tooltip>
                )}
              </Stack>
            </Grid>

            {/* Row 2: Details and Weighted Percentage */}
            <Grid size={12} mb={1}>
              <Grid container spacing={1} alignItems='center'>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Tooltip title='Quantity'>
                    <Typography variant='body2'>
                      Quantity: {task.quantity?.toLocaleString?.() ?? '—'}{' '}
                      {task.measurement_unit?.symbol ?? ''}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Box>
                    <Tooltip title='Executed Quantity'>
                      <Typography variant='body2'>
                        Executed:{' '}
                        {task.executed_quantity?.toLocaleString?.() ?? '—'}{' '}
                        {task.measurement_unit?.symbol ?? ''}
                      </Typography>
                    </Tooltip>
                    <Tooltip title='Remaining Quantity'>
                      <Typography variant='caption' color='text.secondary'>
                        Remaining:{' '}
                        {(
                          task.quantity - task.executed_quantity
                        )?.toLocaleString?.() ?? '—'}{' '}
                        {task.measurement_unit?.symbol ?? ''}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box>
                    <Tooltip title='Start → End Date'>
                      <Typography variant='body2' noWrap>
                        {task.start_date || task.end_date
                          ? `${task.start_date ? readableDate(task.start_date, false) : 'Not Set'} → ${
                              task.end_date
                                ? readableDate(task.end_date, false)
                                : 'Not Set'
                            }`
                          : 'Not Set'}
                      </Typography>
                    </Tooltip>
                    <Tooltip title='Duration'>
                      <Typography variant='caption' color='text.secondary'>
                        Duration: {task.number_of_days ?? '—'} days
                      </Typography>
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6, md: 2.5 }}>
                  <Tooltip title='Remaining Days'>
                    <Typography
                      variant='caption'
                      color={
                        task.days_remaining < 0 && execColor !== 'success'
                          ? 'error.main'
                          : 'text.secondary'
                      }
                    >
                      <strong>Remaining:</strong>{' '}
                      {task.days_remaining < 0
                        ? 0
                        : (task.days_remaining ?? '—')}{' '}
                      days
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{ xs: 12, md: 0.5 }} textAlign={'end'}>
                  <TasksItemAction task={task} activity={activity} />
                </Grid>
              </Grid>
            </Grid>

            {/* Row 3: Single Progress Bar Row */}
            <Grid size={12} mb={1}>
              <Grid container alignItems='center' spacing={2}>
                <Grid size={{ xs: 8 }}>
                  <LinearProgressWithLabel
                    value={execPercent}
                    execPercent={execPercent}
                    timePercent={timePercent}
                    color={execColor}
                    hasTimeDates={hasTimeDates}
                  />
                </Grid>
                <Grid size={{ xs: 4 }} textAlign={'end'}>
                  <Tooltip title='Weighted Percentage'>
                    <Chip
                      size='small'
                      color='default'
                      label={`${task.weighted_percentage?.toLocaleString() ?? 0}% Weight`}
                    />
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default TasksListItem;
