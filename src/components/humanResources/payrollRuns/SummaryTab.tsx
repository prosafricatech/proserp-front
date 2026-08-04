import { LoadingButton } from '@mui/lab';
import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import EmployeeSelector from '../employees/EmployeeSelector';
import { Employee } from '../employees/EmployeesType';

interface SummaryTabProps {
  basic_salary?: number;
  employees?: number;
  gross_salary?: number;
  net_salary?: number;
  paye?: number;
  total_allowances?: number;
  total_deductions?: number;
  onSimulate?: (employeeId: number) => void;
  isSimulating?: boolean;
}

const SummaryTab = ({
  basic_salary = 0,
  employees = 0,
  gross_salary = 0,
  net_salary = 0,
  paye = 0,
  total_allowances = 0,
  total_deductions = 0,
  onSimulate,
  isSimulating = false,
}: SummaryTabProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const sumarryData = {
    'Basic Salary': basic_salary.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    Employees: employees,
    'Gross Salary': gross_salary.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    'Net Salary': net_salary.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    Paye: paye.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    'Total Allowances': total_allowances.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    'Total Deductions': total_deductions.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
  return (
    <Grid container columnSpacing={2} rowSpacing={2}>
      {onSimulate && (
        <Grid size={12}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
          >
            <Grid size={{ xs: 12, sm: 5, md: 3 }}>
              <EmployeeSelector
                multiple={false}
                value={selectedEmployee}
                onChange={(value) =>
                  setSelectedEmployee(
                    Array.isArray(value) ? value[0] || null : value
                  )
                }
              />
            </Grid>
            <LoadingButton
              variant='outlined'
              size='small'
              loading={isSimulating}
              disabled={!selectedEmployee}
              onClick={() =>
                selectedEmployee && onSimulate(selectedEmployee.id)
              }
            >
              Simulate Payslip
            </LoadingButton>
          </Stack>
        </Grid>
      )}
      {Object.entries(sumarryData).map(([Key, value]) => (
        <Grid size={{ xs: 12, md: 6, lg: 3 }} key={Key}>
          <Card sx={{ minWidth: 275 }}>
            <CardContent>
              <Typography
                gutterBottom
                sx={{ color: 'text.secondary', fontSize: 16 }}
              >
                {Key}
              </Typography>
              <Typography variant='body2' fontSize={20} fontWeight={500}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryTab;
