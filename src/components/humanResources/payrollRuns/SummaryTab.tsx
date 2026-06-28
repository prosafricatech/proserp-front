import { Card, CardContent, Grid, Typography } from '@mui/material';

interface SummaryTabProps {
  basic_salary?: number;
  employees?: number;
  gross_salary?: number;
  net_salary?: number;
  paye?: number;
  total_allowances?: number;
  total_deductions?: number;
}

const SummaryTab = ({
  basic_salary = 0,
  employees = 0,
  gross_salary = 0,
  net_salary = 0,
  paye = 0,
  total_allowances = 0,
  total_deductions = 0,
}: SummaryTabProps) => {
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
    Paye: paye,
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
