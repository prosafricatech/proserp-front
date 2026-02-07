'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { Employee } from './EmployeesType';

const EmployeesListItem = ({ employee }: { employee: Employee }) => {
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
        <Grid size={{ xs: 12, md: 5 }}>
          <Tooltip title='Employee name'>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {employee.first_name} {employee.middle_name} {employee.last_name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Employee EMail'>
            <Typography>{employee.email}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Employee Phone Number'>
            <Typography>{employee.phone_number}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 1, md: 0.5, lg: 1 }} textAlign={'end'}></Grid>
      </Grid>
    </>
  );
};

export default EmployeesListItem;
