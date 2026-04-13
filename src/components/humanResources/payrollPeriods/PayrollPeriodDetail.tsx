'use client';

import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { ArrowBackOutlined, KeyboardArrowDownOutlined, KeyboardArrowUpOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import humanResourcesServices from '../humanResourcesServices';
import SalarySheetDialog from './SalarySheetDialog';
import PayslipDialog from '../payrollRuns/PayslipDialog';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { getPayslipCalculations } from '../payrollRuns/payslipCalculations';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ProcessSummary = {
  processed: number;
  skipped: number;
  errors: number;
  errorItems: Array<{ label: string; message: string }>;
};

function statusColor(status?: string): 'default' | 'warning' | 'success' | 'info' | 'error' {
  switch ((status || '').toLowerCase()) {
    case 'processed':
      return 'info';
    case 'approved':
      return 'success';
    case 'paid':
      return 'success';
    case 'finalized':
      return 'success';
    case 'draft':
      return 'warning';
    default:
      return 'default';
  }
}

const fmt = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getEmployeeName = (run: PayrollRunType) =>
  [run.employee?.first_name, run.employee?.last_name].filter(Boolean).join(' ').trim();

const extractErrorMessage = (error: any) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Unknown error'
  );
};

const buildProcessSummary = (
  response: any,
  fallback: { processed: number; skipped: number }
): ProcessSummary => {
  const payload = response?.data || response || {};
  const rawErrorItems =
    payload?.error_items || payload?.errors_list || payload?.failed_items || payload?.details || [];
  const errorItems = Array.isArray(rawErrorItems)
    ? rawErrorItems.map((item: any, index: number) => ({
        label: item?.employee || item?.name || item?.label || `Employee ${index + 1}`,
        message: item?.message || item?.error || 'Unknown error',
      }))
    : [];

  const processed = Number(
    payload?.processed ??
      payload?.processed_count ??
      payload?.success_count ??
      payload?.summary?.processed ??
      fallback.processed
  );
  const skipped = Number(
    payload?.skipped ??
      payload?.skipped_count ??
      payload?.summary?.skipped ??
      fallback.skipped
  );
  const errors = Number(
    payload?.errors ??
      payload?.error_count ??
      payload?.failed ??
      payload?.summary?.errors ??
      errorItems.length
  );

  return {
    processed,
    skipped,
    errors,
    errorItems,
  };
};

export default function PayrollPeriodDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [selectedRunIds, setSelectedRunIds] = useState<number[]>([]);
  const [openProcessAllDialog, setOpenProcessAllDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openMarkPaidDialog, setOpenMarkPaidDialog] = useState(false);
  const [openProcessSelectedDialog, setOpenProcessSelectedDialog] = useState(false);
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [runToReprocess, setRunToReprocess] = useState<PayrollRunType | null>(null);
  const [runToFinalize, setRunToFinalize] = useState<PayrollRunType | null>(null);
  const [processSummary, setProcessSummary] = useState<ProcessSummary | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [isProcessingSelected, setIsProcessingSelected] = useState(false);

  useEffect(() => {
    const runIdParam = searchParams?.get('run_id');
    if (!runIdParam) return;

    const parsedRunId = Number(runIdParam);
    if (!Number.isNaN(parsedRunId) && parsedRunId > 0) {
      setActiveRunId(parsedRunId);
    }
  }, [searchParams]);

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
        limit: 500,
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

  const detailedRuns = useMemo(() => {
    return runs.map((run, index) => {
      const detailedRun = runDetailsQueries[index]?.data ?? run;
      return {
        run,
        detailedRun,
        computed: getPayslipCalculations(detailedRun),
      };
    });
  }, [runDetailsQueries, runs]);

  const filteredRuns = useMemo(() => {
    const searchTerm = keyword.trim().toLowerCase();
    if (!searchTerm) return detailedRuns;

    return detailedRuns.filter(({ run }) => {
      const employeeName = getEmployeeName(run).toLowerCase();
      const employeeNumber = String(run.employee?.employee_number || '').toLowerCase();
      return employeeName.includes(searchTerm) || employeeNumber.includes(searchTerm);
    });
  }, [detailedRuns, keyword]);

  const periodStatus = (period?.status || '').toLowerCase();
  const isDraft = periodStatus === 'draft';
  const isProcessed = periodStatus === 'processed';
  const isApproved = periodStatus === 'approved';
  const isPaid = periodStatus === 'paid';

  const periodLabel = period
    ? `${MONTH_NAMES[period.month] ?? period.month} ${period.year}`
    : '';

  const totalGross = detailedRuns.reduce((sum, entry) => sum + entry.computed.grossSalary, 0);
  const totalPaye = detailedRuns.reduce((sum, entry) => sum + entry.computed.paye, 0);
  const totalNet = detailedRuns.reduce((sum, entry) => sum + entry.computed.netSalary, 0);

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
      setOpenMarkPaidDialog(false);
    },
    onError: () => enqueueSnackbar('Error marking payroll period as paid', { variant: 'error' }),
  });

  const { mutate: deletePeriod, isPending: isDeletingPeriod } = useMutation({
    mutationFn: () => humanResourcesServices.deletePayrollPeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      enqueueSnackbar('Payroll period deleted', { variant: 'success' });
      router.push(`/${lang}/humanResources/payroll`);
    },
    onError: () => enqueueSnackbar('Error deleting payroll period', { variant: 'error' }),
  });

  const { mutate: processAllPayroll, isPending: isProcessingAll } = useMutation({
    mutationFn: () => humanResourcesServices.processPayrollPeriodAllEmployees({ id }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['showPayrollPeriod', id] });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunsForPeriod', id] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      setProcessSummary(
        buildProcessSummary(response, {
          processed: detailedRuns.filter((entry) => (entry.run.status || '').toLowerCase() !== 'finalized').length,
          skipped: detailedRuns.filter((entry) => (entry.run.status || '').toLowerCase() === 'finalized').length,
        })
      );
      setShowErrorDetails(false);
      setOpenProcessAllDialog(false);
      enqueueSnackbar('Payroll processing completed', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' });
    },
  });

  const { mutateAsync: reprocessEmployee } = useMutation({
    mutationFn: humanResourcesServices.processPayrollPeriodSingleEmployee,
  });

  const { mutateAsync: processEmployeesBatch } = useMutation({
    mutationFn: humanResourcesServices.processPayrollPeriodEmployees,
  });

  const { mutate: finalizeRun, isPending: isFinalizingRun } = useMutation({
    mutationFn: humanResourcesServices.finalizePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRunsForPeriod', id] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar('Payroll run finalized', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Error finalizing payroll run', { variant: 'error' }),
  });

  const handleToggleRun = (runId: number) => {
    setSelectedRunIds((current) =>
      current.includes(runId) ? current.filter((idValue) => idValue !== runId) : [...current, runId]
    );
  };

  const allVisibleSelected =
    filteredRuns.length > 0 && filteredRuns.every((entry) => selectedRunIds.includes(entry.run.id));

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredRuns.map((entry) => entry.run.id);
      setSelectedRunIds((current) => current.filter((idValue) => !visibleIds.includes(idValue)));
      return;
    }

    setSelectedRunIds((current) => {
      const merged = new Set([...current, ...filteredRuns.map((entry) => entry.run.id)]);
      return Array.from(merged);
    });
  };

  const handleProcessSelected = async () => {
    const selectedEntries = detailedRuns.filter((entry) => selectedRunIds.includes(entry.run.id));
    if (!selectedEntries.length) return;

    setIsProcessingSelected(true);

    const nonFinalizedEntries = selectedEntries.filter(
      (entry) => (entry.run.status || '').toLowerCase() !== 'finalized'
    );
    const finalizedEntries = selectedEntries.filter(
      (entry) => (entry.run.status || '').toLowerCase() === 'finalized'
    );

    const fallbackToPerEmployee = async () => {
      let processed = 0;
      const skipped = finalizedEntries.length;
      const errorItems: Array<{ label: string; message: string }> = [];

      for (const entry of nonFinalizedEntries) {
        const employeeName = getEmployeeName(entry.run) || `Employee #${entry.run.employee_id}`;

        try {
          await reprocessEmployee({ id, employee_id: entry.run.employee_id });
          processed += 1;
        } catch (error: any) {
          errorItems.push({
            label: employeeName,
            message: extractErrorMessage(error),
          });
        }
      }

      return {
        processed,
        skipped,
        errors: errorItems.length,
        errorItems,
      };
    };

    let summary: ProcessSummary;

    try {
      const employeeIds = nonFinalizedEntries.map((entry) => entry.run.employee_id);

      if (!employeeIds.length) {
        summary = {
          processed: 0,
          skipped: finalizedEntries.length,
          errors: 0,
          errorItems: [],
        };
      } else {
        const response = await processEmployeesBatch({
          id,
          employee_ids: employeeIds,
        });

        summary = buildProcessSummary(response, {
          processed: employeeIds.length,
          skipped: finalizedEntries.length,
        });
      }
    } catch (error: any) {
      const statusCode = error?.response?.status;

      if (statusCode === 404 || statusCode === 405) {
        summary = await fallbackToPerEmployee();
      } else {
        setIsProcessingSelected(false);
        enqueueSnackbar(extractErrorMessage(error), { variant: 'error' });
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['showPayrollPeriod', id] });
    queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
    queryClient.invalidateQueries({ queryKey: ['payrollRunsForPeriod', id] });
    queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });

    setProcessSummary(summary);
    setShowErrorDetails(false);
    setSelectedRunIds([]);
    setIsProcessingSelected(false);

    if (summary.errors > 0) {
      enqueueSnackbar('Selected employees processed with some errors', { variant: 'warning' });
    } else {
      enqueueSnackbar('Selected employees processed successfully', { variant: 'success' });
    }
  };

  return (
    <>
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
                    <Chip size='small' label={period?.status ?? 'draft'} color={statusColor(period?.status)} />
                  </Stack>
                  <Typography variant='body2' color='text.secondary'>
                    {runs.length} employee{runs.length !== 1 ? 's' : ''}
                  </Typography>
                </>
              )}
            </Stack>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              {isDraft && (
                <Button variant='contained' onClick={() => setOpenProcessAllDialog(true)}>
                  Process All
                </Button>
              )}
              {isDraft && (
                <Button color='error' variant='outlined' onClick={() => setOpenDeleteDialog(true)}>
                  Delete
                </Button>
              )}
              {isProcessed && (
                <Button
                  variant='contained'
                  color='primary'
                  onClick={() => approve()}
                  disabled={isApproving}
                  startIcon={isApproving ? <CircularProgress size={14} /> : undefined}
                >
                  Approve
                </Button>
              )}
              {(isApproved || isPaid) && (
                <Button variant='outlined' onClick={() => setOpenSalarySheetDialog(true)}>
                  Salary Sheet
                </Button>
              )}
              {isApproved && (
                <Button
                  variant='contained'
                  color='success'
                  onClick={() => setOpenMarkPaidDialog(true)}
                  disabled={isMarkingPaid}
                  startIcon={isMarkingPaid ? <CircularProgress size={14} /> : undefined}
                >
                  Mark as Paid
                </Button>
              )}
            </Stack>
          </Stack>
        }
      >
        {processSummary && (
          <Alert
            severity={processSummary.errors > 0 ? 'warning' : 'success'}
            sx={{ mb: 3 }}
            action={
              processSummary.errors > 0 ? (
                <Button
                  color='inherit'
                  size='small'
                  endIcon={showErrorDetails ? <KeyboardArrowUpOutlined /> : <KeyboardArrowDownOutlined />}
                  onClick={() => setShowErrorDetails((value) => !value)}
                >
                  Details
                </Button>
              ) : undefined
            }
          >
            <Typography variant='body2'>Processed: {processSummary.processed} employees</Typography>
            <Typography variant='body2'>Skipped: {processSummary.skipped} employees</Typography>
            <Typography variant='body2'>Errors: {processSummary.errors}</Typography>
            <Collapse in={showErrorDetails && processSummary.errors > 0}>
              <Stack spacing={0.5} mt={1}>
                {processSummary.errorItems.map((item, index) => (
                  <Typography key={`${item.label}-${index}`} variant='body2'>
                    {item.label}: {item.message}
                  </Typography>
                ))}
              </Stack>
            </Collapse>
          </Alert>
        )}

        <Stack
          id='payroll-period-summary'
          direction='row'
          spacing={2}
          mb={3}
          sx={{ scrollMarginTop: 96, width: '100%' }}
        >
          {[
            { label: 'Total Gross', value: totalGross },
            { label: 'Total PAYE', value: totalPaye },
            { label: 'Total Net', value: totalNet },
          ].map(({ label, value }) => (
            <Card key={label} sx={{ p: 2, flex: 1 }}>
              <Typography variant='body2' color='text.secondary'>{label}</Typography>
              <Typography variant='h5'>{fmt(value)}</Typography>
            </Card>
          ))}
        </Stack>

        <Card id='payroll-period-runs' sx={{ scrollMarginTop: 96 }}>
          <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' p={2} flexWrap='wrap' useFlexGap>
            <TextField
              size='small'
              label='Search employee'
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              sx={{ minWidth: 260 }}
            />
            {selectedRunIds.length > 0 && (
              <Button variant='contained' onClick={() => setOpenProcessSelectedDialog(true)} disabled={isProcessingSelected || isPaid}>
                {isProcessingSelected ? 'Processing Selected...' : `Process Selected (${selectedRunIds.length})`}
              </Button>
            )}
          </Stack>

          {isRunsLoading ? (
            <Box p={2}>
              <Stack spacing={1}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} variant='rectangular' height={48} sx={{ borderRadius: 1 }} />
                ))}
              </Stack>
            </Box>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell padding='checkbox'>
                      <Checkbox checked={allVisibleSelected} indeterminate={!allVisibleSelected && selectedRunIds.length > 0} onChange={handleToggleSelectAll} />
                    </TableCell>
                    <TableCell>Employee #</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell align='right'>Basic Salary</TableCell>
                    <TableCell align='right'>Gross Salary</TableCell>
                    <TableCell align='right'>PAYE</TableCell>
                    <TableCell align='right'>Net Pay</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align='center'>
                        <Typography variant='body2' color='text.secondary' py={2}>
                          No payroll runs found for this period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRuns.map(({ run, computed }) => {
                      const runStatus = (run.status || 'draft').toLowerCase();
                      const canReprocess = runStatus === 'draft' && !isPaid;
                      const canFinalize = runStatus === 'draft' && !isPaid;

                      return (
                        <TableRow key={run.id} hover>
                          <TableCell padding='checkbox'>
                            <Checkbox
                              checked={selectedRunIds.includes(run.id)}
                              onChange={() => handleToggleRun(run.id)}
                            />
                          </TableCell>
                          <TableCell>{run.employee?.employee_number || '—'}</TableCell>
                          <TableCell>{getEmployeeName(run) || '—'}</TableCell>
                          <TableCell>{run.contract?.designation?.title || '—'}</TableCell>
                          <TableCell align='right'>{fmt(Number(run.basic_salary || 0))}</TableCell>
                          <TableCell align='right'>{fmt(computed.grossSalary)}</TableCell>
                          <TableCell align='right'>{fmt(computed.paye)}</TableCell>
                          <TableCell align='right'>{fmt(computed.netSalary)}</TableCell>
                          <TableCell>
                            <Chip size='small' label={run.status || 'draft'} color={statusColor(run.status)} />
                          </TableCell>
                          <TableCell align='right'>
                            <Stack direction='row' spacing={1} justifyContent='flex-end' flexWrap='wrap' useFlexGap>
                              <Button size='small' onClick={() => setActiveRunId(run.id)}>
                                View Payslip
                              </Button>
                              {canReprocess && (
                                <Button
                                  size='small'
                                  onClick={() => setRunToReprocess(run)}
                                >
                                  Reprocess
                                </Button>
                              )}
                              {canFinalize && (
                                <Button
                                  size='small'
                                  color='success'
                                  disabled={isFinalizingRun}
                                  onClick={() => setRunToFinalize(run)}
                                >
                                  Finalize
                                </Button>
                              )}
                            </Stack>
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

      <Dialog open={openProcessAllDialog} onClose={() => setOpenProcessAllDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Process Payroll - {periodLabel}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            This runs payroll for all employees with an active contract in this period. Already-finalized runs are skipped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProcessAllDialog(false)}>Cancel</Button>
          <Button variant='contained' onClick={() => processAllPayroll()} disabled={isProcessingAll}>
            {isProcessingAll ? 'Processing...' : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Delete Payroll Period</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            Delete this payroll period? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color='error' variant='contained' onClick={() => deletePeriod()} disabled={isDeletingPeriod}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMarkPaidDialog} onClose={() => setOpenMarkPaidDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Mark as Paid</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            Mark this payroll period as paid? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarkPaidDialog(false)}>Cancel</Button>
          <Button color='success' variant='contained' onClick={() => markPaid()} disabled={isMarkingPaid}>
            Mark as Paid
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openProcessSelectedDialog}
        onClose={() => setOpenProcessSelectedDialog(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Process Selected Employees</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            Recompute payroll for the {selectedRunIds.length} selected employee{selectedRunIds.length !== 1 ? 's' : ''}? Already-finalized runs will be skipped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProcessSelectedDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={async () => {
              setOpenProcessSelectedDialog(false);
              await handleProcessSelected();
            }}
            disabled={isProcessingSelected}
          >
            Process
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(runToReprocess)}
        onClose={() => setRunToReprocess(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Reprocess Employee</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            Recompute payroll for {runToReprocess ? getEmployeeName(runToReprocess) || `Employee #${runToReprocess.employee_id}` : 'this employee'}? Their current draft run will be replaced.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunToReprocess(null)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={async () => {
              if (!runToReprocess) return;
              try {
                await reprocessEmployee({ id, employee_id: runToReprocess.employee_id });
                queryClient.invalidateQueries({ queryKey: ['showPayrollPeriod', id] });
                queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
                queryClient.invalidateQueries({ queryKey: ['payrollRunsForPeriod', id] });
                queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
                enqueueSnackbar('Payroll run reprocessed', { variant: 'success' });
                setRunToReprocess(null);
              } catch (error: any) {
                enqueueSnackbar(extractErrorMessage(error), { variant: 'error' });
              }
            }}
          >
            Reprocess
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(runToFinalize)}
        onClose={() => setRunToFinalize(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Finalize Run</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            Finalize this run? Once finalized it cannot be reprocessed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunToFinalize(null)}>Cancel</Button>
          <Button
            color='success'
            variant='contained'
            disabled={isFinalizingRun}
            onClick={() => {
              if (!runToFinalize) return;
              finalizeRun(String(runToFinalize.id), {
                onSuccess: () => setRunToFinalize(null),
              });
            }}
          >
            Finalize
          </Button>
        </DialogActions>
      </Dialog>

      <PayslipDialog
        open={Boolean(activeRunId)}
        onClose={() => setActiveRunId(null)}
        runId={activeRunId}
        periodId={id}
      />

      <SalarySheetDialog
        open={openSalarySheetDialog}
        onClose={() => setOpenSalarySheetDialog(false)}
        periodLabel={periodLabel}
        rows={detailedRuns}
      />
    </>
  );
}
