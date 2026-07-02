'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type GroupedSummaryItem = {
  type_id?: number | null;
  type_name?: string | null;
  total?: number;
  average?: number;
  employee_count?: number;
  label?: string;
  name?: string;
};

type SalarySummaryResponse = {
  summary?: {
    period?: string;
    total_employees?: number;
    total_payroll_runs?: number;
    cost_centers?: number[];
    generated_at?: string;
  };
  salary_components?: {
    basic_salary?: {
      total?: number;
      average_per_employee?: number;
      employee_count?: number;
    };
    allowances?: GroupedSummaryItem[];
    gross_salary?: number;
  };
  deductions?: GroupedSummaryItem[];
  employer_contributions?: GroupedSummaryItem[];
  net_salary?: {
    total?: number;
    average?: number;
  };
};

function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function aggregateGroupedItems(items: GroupedSummaryItem[] = []) {
  const grouped = new Map<string, GroupedSummaryItem>();

  items.forEach((item) => {
    const key = String(item.type_id ?? item.type_name ?? item.label ?? item.name ?? 'unknown');
    const existing = grouped.get(key) ?? {
      type_id: item.type_id,
      type_name: item.type_name || item.label || item.name || 'Unknown',
      total: 0,
      average: 0,
      employee_count: 0,
      label: item.label || item.name,
      name: item.name,
    };

    existing.total = Number(existing.total ?? 0) + Number(item.total ?? 0);
    existing.employee_count = Number(existing.employee_count ?? 0) + Number(item.employee_count ?? 0);
    existing.average = existing.employee_count
      ? Number(existing.total ?? 0) / existing.employee_count
      : Number(existing.average ?? 0) + Number(item.average ?? 0);

    grouped.set(key, existing);
  });

  return Array.from(grouped.values()).sort((a, b) => {
    const left = String(a.type_name || a.label || a.name || '');
    const right = String(b.type_name || b.label || b.name || '');
    return left.localeCompare(right);
  });
}

function aggregateResponses(responses: SalarySummaryResponse[], selectedYear: number, selectedMonth: number) {
  const validResponses = responses.filter(Boolean);
  const latest = validResponses[validResponses.length - 1] ?? {};

  const basicSalary = validResponses.reduce(
    (acc, response) => {
      const current = response.salary_components?.basic_salary;
      return {
        total: acc.total + Number(current?.total ?? 0),
        average_per_employee: acc.average_per_employee + Number(current?.average_per_employee ?? 0),
        employee_count: acc.employee_count + Number(current?.employee_count ?? 0),
      };
    },
    { total: 0, average_per_employee: 0, employee_count: 0 }
  );

  const allowances = aggregateGroupedItems(
    validResponses.flatMap((response) => response.salary_components?.allowances ?? [])
  );
  const deductions = aggregateGroupedItems(validResponses.flatMap((response) => response.deductions ?? []));
  const employerContributions = aggregateGroupedItems(
    validResponses.flatMap((response) => response.employer_contributions ?? [])
  );

  const grossSalary = validResponses.reduce(
    (sum, response) => sum + Number(response.salary_components?.gross_salary ?? 0),
    0
  );

  const netSalary = validResponses.reduce(
    (acc, response) => ({
      total: acc.total + Number(response.net_salary?.total ?? 0),
      average: acc.average + Number(response.net_salary?.average ?? 0),
    }),
    { total: 0, average: 0 }
  );

  const summary = latest.summary ?? {};
  const monthLabel = selectedMonth > 0 ? monthNames[selectedMonth - 1] : 'Month';

  return {
    summary: {
      period: `Jan ${selectedYear} to ${monthLabel} ${selectedYear}`,
      total_employees: summary.total_employees ?? basicSalary.employee_count,
      total_payroll_runs: validResponses.reduce(
        (sum, response) => sum + Number(response.summary?.total_payroll_runs ?? 0),
        0
      ),
      cost_centers: Array.from(
        new Set(validResponses.flatMap((response) => response.summary?.cost_centers ?? []))
      ),
      generated_at: summary.generated_at,
    },
    salary_components: {
      basic_salary: {
        total: basicSalary.total,
        average_per_employee: basicSalary.employee_count
          ? basicSalary.total / basicSalary.employee_count
          : basicSalary.average_per_employee,
        employee_count: basicSalary.employee_count,
      },
      allowances,
      gross_salary: grossSalary,
    },
    deductions,
    employer_contributions: employerContributions,
    net_salary: {
      total: netSalary.total,
      average: netSalary.total && basicSalary.employee_count ? netSalary.total / basicSalary.employee_count : netSalary.average,
    },
  };
}

export default function PayrollSalaryComponentsDashboard() {
  const { authOrganization } = useJumboAuth() as any;
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedCostCenters, setSelectedCostCenters] = useState<CostCenter[]>([]);

  const costCenterIds = useMemo(
    () => selectedCostCenters.map((costCenter) => costCenter.id),
    [selectedCostCenters]
  );

  const { data, isFetching, isError, error, refetch } = useQuery<SalarySummaryResponse>({
    queryKey: ['payroll-salary-components-summary', selectedYear, selectedMonth, costCenterIds.join(',')],
    queryFn: async () => {
      const months = Array.from({ length: selectedMonth }, (_, index) => index + 1);
      const responses = await Promise.all(
        months.map((month) =>
          humanResourcesServices.getSalaryComponentsSummary({
            year: selectedYear,
            month,
            ...(costCenterIds.length ? { cost_center_ids: costCenterIds } : {}),
          })
        )
      );

      return aggregateResponses(responses, selectedYear, selectedMonth);
    },
    staleTime: 60_000,
  });

  const summary = data?.summary;
  const basicSalary = data?.salary_components?.basic_salary;
  const allowances = data?.salary_components?.allowances ?? [];
  const deductions = data?.deductions ?? [];
  const employerContributions = data?.employer_contributions ?? [];
  const netSalary = data?.net_salary;

  const yearOptions = Array.from({ length: 5 }, (_, index) => now.getFullYear() - index);
  const monthOptions = monthNames.map((name, index) => ({ value: index + 1, label: name }));

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent='space-between'
          alignItems={{ xs: 'stretch', md: 'center' }}
          mb={2}
        >
          <Box>
            <Typography variant='h6'>Payroll Components Summary</Typography>
            <Typography variant='body2' color='text.secondary'>
              Cumulative view from January to {monthNames[selectedMonth - 1] ?? 'Current Month'} {selectedYear}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap='wrap'>
            <TextField
              select
              label='Year'
              size='small'
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              sx={{ minWidth: 120 }}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label='Month'
              size='small'
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              sx={{ minWidth: 140 }}
            >
              {monthOptions.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ minWidth: 260 }}>
              <CostCenterSelector
                multiple
                label='Cost Centers'
                defaultValue={selectedCostCenters}
                onChange={(value) => {
                  setSelectedCostCenters(Array.isArray(value) ? value : []);
                }}
              />
            </Box>
          </Stack>
        </Stack>

        {isFetching && <LinearProgress sx={{ mb: 2 }} />}

        {isError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {(error as Error)?.message || 'Unable to load payroll summary.'}
          </Alert>
        )}

        {!isFetching && !data && !isError && (
          <Alert severity='info'>No payroll summary data is available for the selected filters.</Alert>
        )}

        {data && (
          <Box>
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>Period</Typography>
                    <Typography variant='h6'>{summary?.period || '-'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>Employees</Typography>
                    <Typography variant='h6'>{formatNumber(summary?.total_employees)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>Payroll Runs</Typography>
                    <Typography variant='h6'>{formatNumber(summary?.total_payroll_runs)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>Cost Centers</Typography>
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      {(summary?.cost_centers?.length ? summary.cost_centers : [authOrganization?.organization?.name || 'All']).map((value) => (
                        <Chip key={String(value)} label={String(value)} size='small' />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>Basic Salary</Typography>
                    <Typography variant='h5'>TZS {formatCurrency(basicSalary?.total)}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Avg/employee: TZS {formatCurrency(basicSalary?.average_per_employee)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>Gross Salary</Typography>
                    <Typography variant='h5'>TZS {formatCurrency(data?.salary_components?.gross_salary)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>Net Salary</Typography>
                    <Typography variant='h5'>TZS {formatCurrency(netSalary?.total)}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Avg: TZS {formatCurrency(netSalary?.average)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='subtitle1' fontWeight={600} mb={1}>Allowances</Typography>
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell align='right'>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allowances.length ? (
                            allowances.map((allowance) => (
                              <TableRow key={String(allowance.type_id ?? allowance.type_name ?? allowance.label)}>
                                <TableCell>{allowance.type_name || allowance.label || allowance.name || '-'}</TableCell>
                                <TableCell align='right'>TZS {formatCurrency(allowance.total)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2}>No allowances</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='subtitle1' fontWeight={600} mb={1}>Deductions</Typography>
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell align='right'>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deductions.length ? (
                            deductions.map((deduction) => (
                              <TableRow key={String(deduction.type_id ?? deduction.type_name ?? deduction.label)}>
                                <TableCell>{deduction.type_name || deduction.label || deduction.name || '-'}</TableCell>
                                <TableCell align='right'>TZS {formatCurrency(deduction.total)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2}>No deductions</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='subtitle1' fontWeight={600} mb={1}>Employer Contributions</Typography>
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell align='right'>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {employerContributions.length ? (
                            employerContributions.map((contribution) => (
                              <TableRow key={String(contribution.type_id ?? contribution.type_name ?? contribution.label)}>
                                <TableCell>{contribution.type_name || contribution.label || contribution.name || '-'}</TableCell>
                                <TableCell align='right'>TZS {formatCurrency(contribution.total)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2}>No employer contributions</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
