'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEmployees } from '../employees/EmployeesProvider';
import EmployeeDeductionItemAction from './EmployeeDeductionItemAction';
import { EmployeeDeductionType } from './EmployeeDeductionType';

const EmployeeDeductionsListItem = ({
  employeeDeduction,
}: {
  employeeDeduction: EmployeeDeductionType;
}) => {
  const { employees } = useEmployees();
  const employee = employees?.find((item) => item.id === employeeDeduction.employee_id);
  const employeeName = employee
    ? `${employee.first_name || ''} ${employee.middle_name || ''} ${employee.last_name || ''}`.trim()
    : `${employeeDeduction.employee?.first_name || ''} ${employeeDeduction.employee?.last_name || ''}`.trim() ||
      `Employee #${employeeDeduction.employee_id}`;

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
          <Tooltip title='Deduction Type'>
            <Typography>{employeeDeduction.deduction_type?.name || `Type #${employeeDeduction.deduction_type_id}`}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Value'>
            <Typography>{employeeDeduction.value}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Effective From'>
            <Typography>{employeeDeduction.effective_from ? dayjs(employeeDeduction.effective_from).format('YYYY-MM-DD') : '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.3 }}>
          <Tooltip title='Effective To'>
            <Typography>{employeeDeduction.effective_to ? dayjs(employeeDeduction.effective_to).format('YYYY-MM-DD') : 'Open-ended'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <EmployeeDeductionItemAction employeeDeduction={employeeDeduction} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeDeductionsListItem;
