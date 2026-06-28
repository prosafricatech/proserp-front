// components/humanResources/employees/auditTrail/AuditTrailListItem.tsx
'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { ArrowForward, Person } from '@mui/icons-material';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { Movement } from './AuditTrailType';

const AuditTrailListItem = ({ movement }: { movement: Movement }) => {
  const isCostCenter = movement.from_cost_center_id || movement.to_cost_center_id;
  const isDepartment = movement.from_department_id || movement.to_department_id;

  const fromName = isCostCenter 
    ? movement.from_cost_center?.name 
    : movement.from_department?.name;
  const toName = isCostCenter 
    ? movement.to_cost_center?.name 
    : movement.to_department?.name;

  const movementType = isCostCenter ? 'Cost Center' : 'Department';

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
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title="Movement Type">
            <Chip 
              label={movementType} 
              size="small" 
              color={isCostCenter ? 'primary' : 'info'}
              variant="outlined"
            />
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title="From → To">
            <Typography variant="body2">
              {fromName || '-'} <ArrowForward fontSize="small" sx={{ mx: 0.5 }} /> {toName || '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title="Movement Date">
            <Typography variant="body2">
              {movement.moved_date ? readableDate(movement.moved_date) : '-'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          {movement.reason && (
            <Tooltip title="Reason">
              <Typography variant="body2" color="text.secondary" noWrap>
                {movement.reason}
              </Typography>
            </Tooltip>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 1 }} textAlign="end">
          {movement.creator && (
            <Tooltip title={`Changed by: ${movement.creator.first_name || ''} ${movement.creator.last_name || ''}`}>
              <Person fontSize="small" color="action" />
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default AuditTrailListItem;