'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import LeaveRequestItemAction from './LeaveRequestItemAction';
import { LeaveRequestType } from './LeaveRequestType';

const LeaveRequestsListItem = ({
  leaveRequest,
}: {
  leaveRequest: LeaveRequestType;
}) => {
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
          <Tooltip title='Leave Type'>
            <Typography>{leaveRequest.leave_type?.name || `Type #${leaveRequest.leave_type_id}`}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title='Start Date'>
            <Typography>{dayjs(leaveRequest.start_date).format('YYYY-MM-DD')}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title='End Date'>
            <Typography>{dayjs(leaveRequest.end_date).format('YYYY-MM-DD')}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.2 }}>
          <Tooltip title='Days'>
            <Typography>
              {leaveRequest.days_granted != null
                ? `${leaveRequest.days_granted}/${leaveRequest.days_requested}`
                : leaveRequest.days_requested}
            </Typography>
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

        <Grid size={{ xs: 12, md: 2.4 }}>
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
