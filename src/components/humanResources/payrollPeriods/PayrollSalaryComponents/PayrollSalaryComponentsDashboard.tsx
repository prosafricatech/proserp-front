'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import {
  Alert,
  Box,
  Button,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import PayrollSalarySummaryReportDocument from '../PayrollSalaryComponents/PayrollSalarySummaryReportDocument';
import PayrollSalarySummaryReportOnScreen from '../PayrollSalaryComponents/PayrollSalarySummaryReportOnScreen';

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

export default function PayrollSalaryComponentsDashboard() {
  const { authOrganization, authUser } = useJumboAuth() as any;
  const now = new Date();
  const mainColor = authOrganization?.organization?.settings?.main_color || '#2113AD';
  const contrastText = authOrganization?.organization?.settings?.contrast_text || '#FFFFFF';
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedCostCenters, setSelectedCostCenters] = useState<CostCenter[]>([]);
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    costCenterIds: [] as number[],
  });

  const costCenterIds = useMemo(
    () => selectedCostCenters.map((costCenter) => costCenter.id),
    [selectedCostCenters]
  );

  useEffect(() => {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [now, selectedMonth, selectedYear]);

  const { data, isFetching, isError, error } = useQuery<SalarySummaryResponse>({
    queryKey: ['payroll-salary-components-summary', appliedFilters.year, appliedFilters.month, appliedFilters.costCenterIds.join(',')],
    queryFn: async () => {
      return humanResourcesServices.getSalaryComponentsSummary({
        year: appliedFilters.year,
        month: appliedFilters.month,
        ...(appliedFilters.costCenterIds.length
          ? { cost_center_ids: appliedFilters.costCenterIds }
          : {}),
      });
    },
    enabled: true,
    staleTime: 60_000,
  });

  const handleFilter = () => {
    setAppliedFilters({
      year: selectedYear,
      month: selectedMonth,
      costCenterIds: costCenterIds,
    });
  };

  const yearOptions = Array.from({ length: 5 }, (_, index) => now.getFullYear() - index);
  const maxMonth = selectedYear === now.getFullYear() ? now.getMonth() + 1 : 12;
  const monthOptions = monthNames
    .slice(0, maxMonth)
    .map((name, index) => ({ value: index + 1, label: name }));
  const appliedCostCenters = useMemo(
    () => selectedCostCenters.filter((cc) => appliedFilters.costCenterIds.includes(cc.id)),
    [selectedCostCenters, appliedFilters.costCenterIds]
  );
  const appliedCostCentersLabel =
    appliedCostCenters.length > 0
      ? appliedCostCenters.map((cc) => cc.name).join(', ')
      : `${authOrganization?.organization?.name || 'All'} (company wide)`;

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Grid container spacing={1.5} alignItems='center'>
          <Grid size={{ xs: 12, md: 12 }} textAlign={'center'} marginBottom={2}>
            <Typography variant='h3'>Payroll Components Summary</Typography>
            <Typography variant='body2' color='text.secondary'>
              Summary for {monthNames[appliedFilters.month - 1] ?? 'Current Month'} {appliedFilters.year}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {appliedCostCentersLabel}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label='Year'
              size='small'
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              fullWidth
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              label='Month'
              size='small'
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              fullWidth
            >
              {monthOptions.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <CostCenterSelector
              multiple
              allowSameType={true}
              label='Cost Centers'
              defaultValue={selectedCostCenters}
              onChange={(value) => {
                setSelectedCostCenters(Array.isArray(value) ? value : []);
              }}
            />
          </Grid>

          <Grid
            size={{ xs: 12, md: 12 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button variant='contained' size='small' onClick={handleFilter}>
              Filter
            </Button>
            <FileExportGrid
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
            />
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Box>

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
            {!showOnScreen ? (
              <PDFContent
                document={
                  <PayrollSalarySummaryReportDocument
                    data={data}
                    selectedYear={appliedFilters.year}
                    selectedMonth={appliedFilters.month}
                    selectedCostCenters={appliedCostCenters}
                    organization={authOrganization?.organization}
                    userName={authUser?.user?.name || 'ProsERP'}
                  />
                }
                fileName={`Payroll Components Summary ${monthNames[appliedFilters.month - 1] ?? 'Month'} ${appliedFilters.year}`}
              />
            ) : (
              <PayrollSalarySummaryReportOnScreen
                data={data}
                mainColor={mainColor}
                contrastText={contrastText}
              />
              )}
          </Box>
        )}
        </Box>
      </DialogContent>
    </>
  );
}
