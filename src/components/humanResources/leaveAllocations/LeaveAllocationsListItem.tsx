'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useEmployees } from '../employees/EmployeesProvider';
import { LeaveAllocationType } from './LeaveAllocationType';
import LeaveAllocationItemAction from './LeaveAllocationItemAction';

const LeaveAllocationsListItem = ({
  leaveAllocation,
}: {
  leaveAllocation: LeaveAllocationType;
}) => {
  const { employees } = useEmployees();
  const employee = employees?.find((item) => item.id === leaveAllocation.employee_id);
  const employeeName = employee
    ? `${employee.first_name || ''} ${employee.middle_name || ''} ${employee.last_name || ''}`.trim()
    : `${leaveAllocation.employee?.first_name || ''} ${leaveAllocation.employee?.last_name || ''}`.trim() ||
      `Employee #${leaveAllocation.employee_id}`;

  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 2.4 }}>
          <Tooltip title='Employee'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {employeeName}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.3 }}>
          <Tooltip title='Leave Type'>
            <Typography>{leaveAllocation.leave_type?.name || `Type #${leaveAllocation.leave_type_id}`}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.2 }}>
          <Tooltip title='Year'>
            <Typography>{leaveAllocation.year}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Allocated Days'>
            <Typography>{leaveAllocation.allocated_days}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.4 }}>
          <Tooltip title='Used Days'>
            <Typography>{leaveAllocation.used_days ?? 0}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.7 }}>
          <Tooltip title='Remaining Days'>
            <Typography>{leaveAllocation.remaining_days ?? leaveAllocation.allocated_days}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <LeaveAllocationItemAction leaveAllocation={leaveAllocation} />
        </Grid>
      </Grid>
    </>
  );
};

export default LeaveAllocationsListItem;
