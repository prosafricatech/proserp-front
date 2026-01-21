import React from 'react';
import {
  Grid,
  Tooltip,
  Typography,
  ListItemText,
  Chip,
  Alert,
  LinearProgress,
  Stack,
  Box,
} from '@mui/material';

/* ================= PROGRESS WITH LABEL ================= */

function LinearProgressWithLabel({ value = 0, label, color = 'primary' }) {
  const safeValue = Math.min(Number(value) || 0, 100);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
          {label}
        </Typography>

        <Box sx={{ flexGrow: 1 }}>
          <LinearProgress
            variant="determinate"
            value={safeValue}
            color={color}
            sx={{ height: 8, borderRadius: 2 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          {safeValue}%
        </Typography>
      </Stack>
    </Box>
  );
}

function DeliverableTasks({ deliverableDetails }) {
  const tasks = deliverableDetails?.tasks || [];

  if (!tasks.length) {
    return (
      <Grid size={{ xs: 12 }} padding={1}>
        <Alert variant="outlined" severity="info">
          This Deliverable has no Task to contribute
        </Alert>
      </Grid>
    );
  }

  return (
    <Grid size={{ xs: 12 }} padding={1}>
      <Typography fontWeight={600} mb={1}>
        Tasks
      </Typography>

      {tasks.map((task, index) => {
        const execPercent = Number(task.executed_percentage) || 0;
        const timePercent = Number(task.percentage_time_elapsed) || 0;

        let execColor = 'primary';
        if (execPercent >= 100) execColor = 'success';
        else if (execPercent >= 70) execColor = 'warning';
        else if (execPercent < 30) execColor = 'error';

        let timeColor = 'primary';
        if (timePercent >= 100) timeColor = 'success';
        else if (timePercent >= 70) timeColor = 'warning';
        else if (timePercent < 30) timeColor = 'error';

        return (
          <Grid
            key={task.id ?? index}
            container
            columnSpacing={2}
            alignItems="center"
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
              py: 1,
            }}
          >
            <Grid size={{ xs: 12, md: 4 }}>
              <ListItemText
                primary={
                  <Tooltip title="Name">
                    <Typography component="span" fontWeight={500}>
                      {task.name || '-'}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <Tooltip title="Code">
                    <Typography component="span" variant="caption">
                      {task.code || '-'}
                    </Typography>
                  </Tooltip>
                }
              />
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Tooltip title="Quantity">
                <Typography variant="body2" noWrap>
                  {(task.quantity ?? 0).toLocaleString()}{' '}
                  {task.measurement_unit?.symbol}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
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

            <Grid size={{ xs: 12, md: 2 }} textAlign={'end'} mt={1}>
              <Tooltip title="Contribution Percentage">
                <Chip
                  size="small"
                  label={`${task.contribution_percentage ?? 0}%`}
                />
              </Tooltip>
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default DeliverableTasks;
