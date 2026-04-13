'use client';

import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { ArrowBackOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { getPayslipCalculations } from '../payrollRuns/payslipCalculations';
import PayrollPeriodItemAction from '../payrollPeriods/PayrollPeriodItemAction';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function statusColor(status?: string): 'default' | 'warning' | 'success' | 'info' | 'error' {
  switch (status) {
    case 'processed': return 'info';
    case 'approved': return 'success';
    case 'paid': return 'success';
    case 'draft': return 'warning';
    default: return 'default';
  }
}

export default function PayrollPeriodDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lang = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: period, isLoading: isPeriodLoading } = useQuery({
    queryKey: ['showPayrollPeriod', id],
    queryFn: () => humanResourcesServices.showPayrollPeriod(id),
    enabled: !!id,
  });

  const { data: runsResponse, isLoading: isRunsLoading } = useQuery({
    queryKey: ['payrollRunsForPeriod', id],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: id,
        page: 1,
        limit: 200,
      }),
    enabled: !!id,
  });

  const runs: PayrollRunType[] = runsResponse?.data || [];

  const runDetailsQueries = useQueries({
    queries: runs.map((run) => ({
      queryKey: ['showPayrollRun', run.id],
      queryFn: () => humanResourcesServices.showPayrollRun(String(run.id)),
      enabled: Boolean(run.id),
      staleTime: 1000 * 60,
    })),
  });

  const runDetailsById = new Map<string, any>();
  runDetailsQueries.forEach((query, index) => {
    const runId = String(runs[index]?.id ?? '');
    if (!runId) return;
    runDetailsById.set(runId, query.data ?? runs[index]);
  });

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: () => humanResourcesServices.approvePayrollPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showPayrollPeriod', id] });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      enqueueSnackbar('Payroll period approved', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Error approving payroll period', { variant: 'error' }),
  });

  const { mutate: markPaid, isPending: isMarkingPaid } = useMutation({
    mutationFn: () => humanResourcesServices.markPayrollPeriodPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showPayrollPeriod', id] });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      enqueueSnackbar('Payroll period marked as paid', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Error marking payroll period as paid', { variant: 'error' }),
  });

  const periodLabel = period
    ? `${MONTH_NAMES[period.month] ?? period.month} ${period.year}`
    : '';

  const runComputed = runs.map((run) => {
    const detailedRun = runDetailsById.get(String(run.id)) ?? run;
    return {
      run,
      computed: getPayslipCalculations(detailedRun),
    };
  });

  const totalGross = runComputed.reduce((sum, entry) => sum + entry.computed.grossSalary, 0);
  const totalPaye = runComputed.reduce((sum, entry) => sum + entry.computed.paye, 0);
  const totalNet = runComputed.reduce((sum, entry) => sum + entry.computed.netSalary, 0);

  return (
    <JumboContentLayout
      header={
        <Stack direction='row' alignItems='center' spacing={2} flexWrap='wrap'>
          <Tooltip title='Back to Payroll'>
            <IconButton onClick={() => router.push(`/${lang}/humanResources/payroll`)}>
              <ArrowBackOutlined />
            </IconButton>
          </Tooltip>
          <Stack flex={1}>
            {isPeriodLoading ? (
              <Skeleton width={200} height={32} />
            ) : (
              <>
                <Stack direction='row' alignItems='center' spacing={1}>
                  <Typography variant='h4'>{periodLabel}</Typography>
                  <Chip
                    size='small'
                    label={period?.status ?? 'draft'}
                    color={statusColor(period?.status)}
                  />
                </Stack>
                <Typography variant='body2' color='text.secondary'>
                  {runs.length} payroll run{runs.length !== 1 ? 's' : ''}
                </Typography>
              </>
            )}
          </Stack>
          <Stack direction='row' spacing={1}>
            {period?.status === 'processed' && (
              <Button
                variant='contained'
                color='primary'
                size='small'
                onClick={() => approve()}
                disabled={isApproving}
                startIcon={isApproving ? <CircularProgress size={14} /> : undefined}
              >
                Approve
              </Button>
            )}
            {period?.status === 'approved' && (
              <Button
                variant='contained'
                color='success'
                size='small'
                onClick={() => markPaid()}
                disabled={isMarkingPaid}
                startIcon={isMarkingPaid ? <CircularProgress size={14} /> : undefined}
              >
                Mark as Paid
              </Button>
            )}
            {period && <PayrollPeriodItemAction payrollPeriod={period} />}
          </Stack>
        </Stack>
      }
    >
      {/* Summary cards */}
      <Stack
        id='payroll-period-summary'
        direction='row'
        spacing={2}
        flexWrap='wrap'
        mb={3}
        sx={{ scrollMarginTop: 96 }}
      >
        {[
          { label: 'Total Gross', value: totalGross },
          { label: 'Total PAYE', value: totalPaye },
          { label: 'Total Net', value: totalNet },
        ].map(({ label, value }) => (
          <Card key={label} sx={{ p: 2, minWidth: 160 }}>
            <Typography variant='body2' color='text.secondary'>{label}</Typography>
            <Typography variant='h5'>
              {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Card>
        ))}
      </Stack>

      {/* Runs table */}
      <Card id='payroll-period-runs' sx={{ scrollMarginTop: 96 }}>
        {isRunsLoading ? (
          <Box p={2}>
            <Stack spacing={1}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant='rectangular' height={48} sx={{ borderRadius: 1 }} />
              ))}
            </Stack>
          </Box>
        ) : (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>S/N</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Employee No.</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell align='right'>Gross (Basic)</TableCell>
                  <TableCell align='right'>PAYE</TableCell>
                  <TableCell align='right'>Net</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align='center'>
                      <Typography variant='body2' color='text.secondary' py={2}>
                        No payroll runs found for this period.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  runComputed.map(({ run, computed }, idx) => {
                    const gross = computed.grossSalary;
                    const paye = computed.paye;
                    const net = computed.netSalary;
                    const name = [run.employee?.first_name, run.employee?.last_name]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <TableRow
                        key={run.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() =>
                          router.push(`/${lang}/humanResources/payroll/${id}/runs/${run.id}`)
                        }
                      >
                        <TableCell>{idx + 1}.</TableCell>
                        <TableCell>{name || '—'}</TableCell>
                        <TableCell>{run.employee?.employee_number || '—'}</TableCell>
                        <TableCell>{run.contract?.designation?.title || '—'}</TableCell>
                        <TableCell align='right'>
                          {gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align='right'>
                          {paye.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align='right'>
                          {net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={run.status ?? 'processed'}
                            color={statusColor(run.status)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </JumboContentLayout>
  );
}
