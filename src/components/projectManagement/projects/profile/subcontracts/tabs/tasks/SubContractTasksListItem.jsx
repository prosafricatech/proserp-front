'use client';
import React from 'react';
import {
  Alert,
  Grid,
  Typography,
  LinearProgress,
  Box,
  Stack,
  Chip,
  Skeleton,
  Tooltip,
} from '@mui/material';
import SubContractTaskItemAction from './SubContractTaskItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function LinearProgressWithLabel({ value, color, execPercent, timePercent }) {
  const safeValue = Math.min(Number(value) || 0, 100);
  let tooltipMsg =
    color === 'success'
      ? 'Execution is on track with time elapsed.'
      : color === 'warning'
      ? 'Execution is lagging behind time elapsed. Monitor closely.'
      : color === 'error'
      ? 'Execution is significantly behind schedule.'
      : 'Progress status.';
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Execution: {typeof execPercent === 'number' ? Math.min(100, Number(execPercent).toFixed(2)) : ''}%
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Time Elapsed: {typeof timePercent === 'number' ? Math.min(100, Number(timePercent).toFixed(2)) : ''}%
        </Typography>
      </Box>
      <Tooltip title={tooltipMsg}>
        <LinearProgress
          variant="determinate"
          value={safeValue}
          color={color}
          sx={{ height: 8, borderRadius: 2 }}
        />
      </Tooltip>
    </Box>
  );
}

function SubContractTasksListItem({
  subContract,
  subContractTasks = [],
  isLoading,
}) {
  const baseCurrency = subContract?.currency?.code ?? 'USD';

  return (
    <Grid size={{ xs: 12 }} padding={1}>
      {isLoading && (
        <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
          <Skeleton variant="text" width={180} height={32} sx={{ borderRadius: 1, marginLeft: 'auto' }} />
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={32} sx={{ borderRadius: 1 }} />
        </Stack>
      )}

      {subContractTasks.length > 0 ? (
        subContractTasks.map((task, index) => {
          const qty = Number(task.quantity ?? 0);
          const execQty = Number(task.executed_quantity ?? 0);
          const remainingQty = qty - execQty;
          const rate = Number(task.rate ?? 0);
          const amount = qty * rate;

          const execPercent = task.executed_percentage ?? 0;
          const timePercent = task.percentage_time_elapsed ?? 0;

          const hasTimeDates = Boolean(task.start_date && task.end_date);

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
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="h6">
                        {task.project_task?.name ?? '—'}
                      </Typography>

                      {task.remarks && (
                        <Chip
                          size="small"
                          label={task.remarks}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                    <Typography variant="body2">
                      Quantity: {qty.toLocaleString()}{' '}
                      {task.project_task?.measurement_unit?.symbol ?? ''}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                    <Typography variant="body2">
                      Executed: {execQty.toLocaleString()}{' '}
                      {task.project_task?.measurement_unit?.symbol ?? ''}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                    <Typography variant="body2">
                      Remaining: {remainingQty.toLocaleString()}{' '}
                      {task.project_task?.measurement_unit?.symbol ?? ''}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                    <Typography variant="body2">
                      Rate:{' '}
                      {rate.toLocaleString('en-US', {
                        style: 'currency',
                        currency: baseCurrency,
                      })}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                    <Typography variant="body2">
                      Amount:{' '}
                      {amount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: baseCurrency,
                      })}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" noWrap>
                      {hasTimeDates
                        ? `${readableDate(task.start_date, false)} → ${readableDate(
                            task.end_date,
                            false
                          )}`
                        : 'Not Set'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 5 }} mb={1}>
                <Stack spacing={2.5}>
                  <LinearProgressWithLabel
                    value={Math.min(100, Number(execPercent).toFixed(2))}
                    color={execColor}
                    execPercent={execPercent}
                    timePercent={Math.min(100, Number(timePercent).toFixed(2))}
                  />
                </Stack>
              </Grid>

              <Grid
                size={{ xs: 12, lg: 2 }}
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
              >
                <Stack direction="row" spacing={1}>
                  <Chip
                    size="small"
                    label={`${task.project_task?.weighted_percentage ?? 0}% Weight`}
                  />
                  <SubContractTaskItemAction
                    subContract={subContract}
                    subContractTasks={subContractTasks}
                    subContractTask={task}
                  />
                </Stack>
              </Grid>
            </Grid>
          );
        })
      ) : (
        !isLoading && (
          <Alert variant="outlined" severity="info">
            No Subcontract Tasks Found
          </Alert>
        )
      )}
    </Grid>
  );
}

export default SubContractTasksListItem;
