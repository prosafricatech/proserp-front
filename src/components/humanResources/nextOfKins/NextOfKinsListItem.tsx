'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useEmployees } from '../employees/EmployeesProvider';
import { NextOfKinType } from './NextOfKinType';
import NextOfKinItemAction from './NextOfKinItemAction';

const NextOfKinsListItem = ({
  nextOfKin,
}: {
  nextOfKin: NextOfKinType;
}) => {
  const { employees } = useEmployees();
  const employee = employees?.find((item) => item.id === nextOfKin.employee_id);
  const employeeName = employee
    ? `${employee.first_name || ''} ${employee.middle_name || ''} ${employee.last_name || ''}`.trim()
    : `${nextOfKin.employee?.first_name || ''} ${nextOfKin.employee?.last_name || ''}`.trim() ||
      `Employee #${nextOfKin.employee_id}`;

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
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Employee'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {employeeName}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Name'>
            <Typography>{nextOfKin.name}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Relationship'>
            <Typography>{nextOfKin.relationship}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Phone'>
            <Typography>{nextOfKin.phone || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 10, md: 1.5 }}>
          {nextOfKin.is_primary ? (
            <Chip label='Primary' size='small' color='success' variant='outlined' />
          ) : (
            <Chip label='Secondary' size='small' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <NextOfKinItemAction nextOfKin={nextOfKin} />
        </Grid>
      </Grid>
    </>
  );
};

export default NextOfKinsListItem;
