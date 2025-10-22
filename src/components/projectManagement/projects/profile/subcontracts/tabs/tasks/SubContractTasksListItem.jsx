'use client';
import React from 'react';
import {
  Alert,
  Grid,
  Tooltip,
  Typography,
  LinearProgress,
  Box,
  Stack,
  Chip,
} from '@mui/material';
import SubContractTaskItemAction from './SubContractTaskItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

// Progress bar with label component
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

function SubContractTasksListItem({ subContract, subContractTasks = [], isLoading }) {
  const baseCurrency = subContract?.currency?.code ?? 'USD';

  return (
    <Grid size={{ xs: 12 }} padding={1}>
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {subContractTasks.length > 0 ? (
        subContractTasks.map((task, index) => {
          const qty = Number(task.quantity ?? 0);
          const execQty = Number(task.executed_quantity ?? 0);
          const remainingQty = qty - execQty;
          const rate = Number(task.rate ?? 0);
          const amount = qty * rate;

          const execPercent = task.executed_percentage ?? 0;
          const timePercent = task.percentage_time_elapsed ?? 0;

          // --- Color Logic ---
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
              {/* Task Info */}
              <Grid size={{ xs: 12, md: 6, lg: 5 }} mb={1}>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Tooltip title="Project Task">
                        <Typography variant="h6">
                          {task.project_task?.name ?? '—'}
                        </Typography>
                      </Tooltip>
                      {task.remarks && (
                        <Tooltip title="Remarks">
                          <Chip
                            size="small"
                            label={task.remarks}
                            variant="outlined"
                            color="default"
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </Grid>

                  {/* Quantity info */}
                  <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                    <Tooltip title="Quantity">
                      <Typography variant="body2">
                        Quantity: {qty.toLocaleString()} {task.project_task?.measurement_unit?.symbol ?? ''}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                    <Tooltip title="Executed Quantity">
                      <Typography variant="body2">
                        Executed: {execQty.toLocaleString()} {task.project_task?.measurement_unit?.symbol ?? ''}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                    <Tooltip title="Remaining Quantity">
                      <Typography variant="body2">
                        Remaining: {remainingQty.toLocaleString()} {task.project_task?.measurement_unit?.symbol ?? ''}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  {/* Rate and amount */}
                  <Grid size={{ xs: 12, md: 6, lg: 5 }}>
                    <Tooltip title="Rate">
                      <Typography variant="body2">
                        Rate:{' '}
                        {rate.toLocaleString('en-US', {
                          style: 'currency',
                          currency: baseCurrency,
                        })}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                    <Tooltip title="Amount">
                      <Typography variant="body2">
                        Amount:{' '}
                        {amount.toLocaleString('en-US', {
                          style: 'currency',
                          currency: baseCurrency,
                        })}
                      </Typography>
                    </Tooltip>
                  </Grid>

                  {/* Date & Duration */}
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

              {/* Progress Bars */}
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

              {/* Weighted % + Actions */}
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
          <Alert variant="outlined" color="primary" severity="info">
            No Subcontract Tasks Found
          </Alert>
        )
      )}
    </Grid>
  );
}

export default SubContractTasksListItem;
