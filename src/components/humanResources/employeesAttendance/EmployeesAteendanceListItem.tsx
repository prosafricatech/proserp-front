'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { EmployeeAttendanceType } from './EmployeeAttendanceType';

const EmployeesAteendanceListItem = ({
  employeeAttendance,
}: {
  employeeAttendance: EmployeeAttendanceType;
}) => {
  const employeeName = `${employeeAttendance.employee?.first_name ?? ''} ${employeeAttendance.employee?.last_name ?? ''} ${employeeAttendance.employee?.last_name ?? ''}`;
  const employeeNumber = employeeAttendance.employee.employee_number;
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
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Employee'>
            <Typography
              variant='h3'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {employeeName}
            </Typography>
          </Tooltip>
          {employeeNumber && (
            <Tooltip title='Employee NUmber'>
              <Typography
                variant='h6'
                fontSize={12}
                lineHeight={1.25}
                mb={0}
                noWrap
                color='text.secondary'
              >
                {employeeNumber}
              </Typography>
            </Tooltip>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Attendance Status'>
            <Typography>{employeeAttendance.type}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Hours Worked'>
            <Typography>{employeeAttendance.hours_worked ?? '-'}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Date'>
            <Typography>
              {readableDate(employeeAttendance.date, false) ?? '-'}
            </Typography>
          </Tooltip>
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeesAteendanceListItem;
