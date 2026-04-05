'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEmployees } from '../../EmployeesProvider';
import LeaveRequestItemAction from './LeaveRequestItemAction';
import { LeaveRequestType } from './LeaveRequestType';

const LeaveRequestsListItem = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestType;
}) => {
  const { employees } = useEmployees();
  const employee = employees?.find((item) => item.id === leaveRequest.employee_id);
  const employeeName = employee
    ? `${employee.first_name || ''} ${employee.middle_name || ''} ${employee.last_name || ''}`.trim()
    : `${leaveRequest.employee?.first_name || ''} ${leaveRequest.employee?.last_name || ''}`.trim() ||
      `Employee #${leaveRequest.employee_id}`;

  const statusColor: any =
    leaveRequest.status === 'approved'
      ? 'success'
      : leaveRequest.status === 'rejected'
      ? 'error'
      : leaveRequest.status === 'cancelled'
      ? 'default'
      : 'warning';

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
        <Grid size={{ xs: 12, md: 2.2 }}>
          <Tooltip title='Employee'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {employeeName}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title='Leave Type'>
            <Typography>{leaveRequest.leave_type?.name || `Type #${leaveRequest.leave_type_id}`}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.6 }}>
          <Tooltip title='Start Date'>
            <Typography>{dayjs(leaveRequest.start_date).format('YYYY-MM-DD')}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.6 }}>
          <Tooltip title='End Date'>
            <Typography>{dayjs(leaveRequest.end_date).format('YYYY-MM-DD')}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.2 }}>
          <Tooltip title='Days'>
            <Typography>{leaveRequest.days_requested}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.6 }}>
          <Chip
            label={leaveRequest.status}
            size='small'
            color={statusColor}
            variant='outlined'
            sx={{ textTransform: 'capitalize' }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 1.0 }}>
          <Tooltip title='Reason'>
            <Typography noWrap>{leaveRequest.reason || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <LeaveRequestItemAction leaveRequest={leaveRequest} />
        </Grid>
      </Grid>
    </>
  );
};

export default LeaveRequestsListItem;
