'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import LeaveTypeItemAction from './LeaveTypeItemAction';
import { LeaveType } from './LeaveTypesType';

const LeaveTypesListItem = ({ leaveType }: { leaveType: LeaveType }) => {
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
        <Grid size={{ xs: 12, md: 8 }}>
          <Tooltip title='Leave Type Name'>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {leaveType.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Days Per Year'>
            <Typography>{leaveType.days_per_year}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 1, md: 0.5, lg: 1 }} textAlign={'end'}>
          <LeaveTypeItemAction leaveType={leaveType} />
        </Grid>
      </Grid>
    </>
  );
};

export default LeaveTypesListItem;
