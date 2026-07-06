// components/humanResources/employees/auditTrail/SalaryHistoryListItem.tsx
'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { ArrowForward, Person } from '@mui/icons-material';
import { Grid, Tooltip, Typography, Paper } from '@mui/material';
import { SalaryChange } from './AuditTrailType';

const formatMoney = (value: number) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const SalaryHistoryListItem = ({ change }: { change: SalaryChange }) => {

  return (
    <Paper
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover' },
        borderRadius: 0,
      }}
    >
      <Grid
        container
        spacing={1}
        alignItems="center"
        sx={{ py: 1.5, px: 2 }}
      >
        {/* Effective Date */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip title="Effective Date">
            <Typography variant="body2">
              {change.effective_date ? readableDate(change.effective_date, false) : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        {/* Salary Change: From → To */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip title={`From → To`}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {formatMoney(Number(change.from_basic_salary))}
              <ArrowForward fontSize="small" sx={{ mx: 0.5 }} />
              {formatMoney(Number(change.to_basic_salary))}
            </Typography>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SalaryHistoryListItem;