'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEmployees } from '../employees/EmployeesProvider';
import EmployeeAllowanceItemAction from '@/components/humanResources/employeeAllowances/EmployeeAllowanceItemAction';
import { EmployeeAllowanceType } from './EmployeeAllowanceType';

const EmployeeAllowancesListItem = ({
  employeeAllowance,
}: {
  employeeAllowance: EmployeeAllowanceType;
}) => {
  const { employees } = useEmployees();
  const employee = employees?.find((item) => item.id === employeeAllowance.employee_id);
  const employeeName = employee
    ? `${employee.first_name || ''} ${employee.middle_name || ''} ${employee.last_name || ''}`.trim()
    : `${employeeAllowance.employee?.first_name || ''} ${employeeAllowance.employee?.last_name || ''}`.trim() ||
      `Employee #${employeeAllowance.employee_id}`;

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
          <Tooltip title='Allowance Type'>
            <Typography>{employeeAllowance.allowance_type?.name || `Type #${employeeAllowance.allowance_type_id}`}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Amount'>
            <Typography>{employeeAllowance.amount}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Effective From'>
            <Typography>{employeeAllowance.effective_from ? dayjs(employeeAllowance.effective_from).format('YYYY-MM-DD') : '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.3 }}>
          <Tooltip title='Effective To'>
            <Typography>{employeeAllowance.effective_to ? dayjs(employeeAllowance.effective_to).format('YYYY-MM-DD') : 'Open-ended'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <EmployeeAllowanceItemAction employeeAllowance={employeeAllowance} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeAllowancesListItem;
