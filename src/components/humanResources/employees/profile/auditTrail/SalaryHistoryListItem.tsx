// components/humanResources/employees/auditTrail/SalaryHistoryListItem.tsx
'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { ArrowForward, Person } from '@mui/icons-material';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
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
  console.log('SalaryHistoryListItem change:', change); // Debugging line
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          '&:hover': { bgcolor: 'action.hover' },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems="center"
        container
      >
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title="Salary Change">
            <Typography variant="body2">
              {formatMoney(change.from_basic_salary)} 
              <ArrowForward fontSize="small" sx={{ mx: 1 }} /> 
              {formatMoney(change.to_basic_salary)}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title="Effective Date">
            <Typography variant="body2">
              {change.effective_date ? readableDate(change.effective_date) : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          {change.reason && (
            <Tooltip title="Reason">
              <Typography variant="body2" color="text.secondary" noWrap>
                {change.reason}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title="Change Date">
            <Typography variant="caption" color="text.secondary">
              {change.created_at ? readableDate(change.created_at) : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1 }} textAlign="end">
          {change.creator && (
            <Tooltip title={`Changed by: ${change.creator.first_name || ''} ${change.creator.last_name || ''}`}>
              <Person fontSize="small" color="action" />
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default SalaryHistoryListItem;