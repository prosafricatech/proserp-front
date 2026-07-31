'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { getPayslipCalculations } from './payslipCalculations';

type PayslipDialogProps = {
  open: boolean;
  onClose: () => void;
  runId?: string | number | null;
  periodId?: string | number | null;
};

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusColor(
  status?: string
): 'default' | 'warning' | 'success' | 'info' | 'error' {
  switch ((status || '').toLowerCase()) {
    case 'finalized':
      return 'success';
    case 'draft':
      return 'warning';
    default:
      return 'default';
  }
}

const PayslipDialog = ({
  open,
  onClose,
  runId,
  periodId,
}: PayslipDialogProps) => {
  const authObject = useJumboAuth() as any;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);

  const { data: run, isLoading } = useQuery({
    queryKey: ['showPayrollRun', String(runId)],
    queryFn: () => humanResourcesServices.showPayrollRun(String(runId)),
    enabled: open && !!runId,
  });

  const { mutate: finalize, isPending: isFinalizing } = useMutation({
    mutationFn: () => humanResourcesServices.finalizePayrollRun(String(runId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['showPayrollRun', String(runId)],
      });
      if (periodId) {
        queryClient.invalidateQueries({
          queryKey: ['payrollRunsForPeriod', String(periodId)],
        });
      }
      enqueueSnackbar('Payslip finalized', { variant: 'success' });
    },
    onError: () =>
      enqueueSnackbar('Error finalizing payslip', { variant: 'error' }),
  });

  const name = run
    ? [run.employee?.first_name, run.employee?.last_name]
        .filter(Boolean)
        .join(' ')
    : '';

  const {
    paye,
    earningsRows,
    deductionRows,
    employerContributionRows,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    otherDeductions,
    totalDeductions,
    netSalary,
    totalEmployerContributions,
    totalEmployerCost,
  } = getPayslipCalculations(run);

  const deductionsTableRows = [
    { label: 'PAYE', category: 'tax', amount: paye },
    ...deductionRows.map((row) => ({
      label: row.label,
      category: row.category,
      amount: row.amount,
    })),
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        <DialogTitle>
          <Stack direction='row' alignItems='center' spacing={2}>
            <Box flex={1}>
              <Typography variant='h6'>Payslip</Typography>
              <Typography variant='body2' color='text.secondary'>
                {run?.payroll_period?.period_name || 'Payroll Period'}
              </Typography>
            </Box>
            <Chip
              size='small'
              label={run?.status || 'draft'}
              color={statusColor(run?.status)}
            />
          </Stack>
        </DialogTitle>

        <DialogContent>
          {isLoading ? (
            <Stack spacing={2}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant='rectangular'
                  height={56}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Stack>
          ) : (
            <Box id='payslip-print-area'>
              <Card variant='outlined'>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction='row'
                      justifyContent='space-between'
                      flexWrap='wrap'
                      useFlexGap
                    >
                      <Box>
                        <Typography variant='h5'>PAYSLIP</Typography>
                        <Typography variant='body1'>
                          {run?.payroll_period?.period_name || '-'}
                        </Typography>
                      </Box>
                      <Box textAlign='right'>
                        <Typography variant='subtitle1'>
                          {authObject?.authOrganization?.organization?.name ||
                            'Organization'}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {name || ''}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider />

                    <Stack
                      direction='row'
                      spacing={3}
                      flexWrap='wrap'
                      useFlexGap
                    >
                      <Box minWidth={220}>
                        <Typography variant='body2' color='text.secondary'>
                          Employee
                        </Typography>
                        <Typography variant='body1'>{name || '-'}</Typography>
                      </Box>
                      <Box minWidth={180}>
                        <Typography variant='body2' color='text.secondary'>
                          Employee No.
                        </Typography>
                        <Typography variant='body1'>
                          {run?.employee?.employee_number || '-'}
                        </Typography>
                      </Box>
                      <Box minWidth={220}>
                        <Typography variant='body2' color='text.secondary'>
                          Designation
                        </Typography>
                        <Typography variant='body1'>
                          {run?.contract?.designation?.title || '-'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider />

                    <Typography variant='h6'>Earnings</Typography>
                    <Table size='small'>
                      <TableBody>
                        {earningsRows.map((row) => (
                          <TableRow key={`${row.label}-${row.amount}`}>
                            <TableCell>
                              {row.label}
                              {!row.taxable ? ' (Non-Taxable)' : ''}
                            </TableCell>
                            <TableCell align='right'>
                              {fmt(row.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Gross Salary
                          </TableCell>
                          <TableCell align='right' sx={{ fontWeight: 700 }}>
                            {fmt(grossSalary)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <Divider />

                    <Typography variant='h6'>Deductions</Typography>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align='right'>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {deductionsTableRows.map((row, index) => (
                          <TableRow key={`${row.label}-${index}`}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>
                              {row.category}
                            </TableCell>
                            <TableCell align='right'>
                              {fmt(row.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Total Deductions
                          </TableCell>
                          <TableCell />
                          <TableCell align='right' sx={{ fontWeight: 700 }}>
                            {fmt(totalDeductions)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <Divider />

                    <Stack
                      direction='row'
                      alignItems='center'
                      justifyContent='space-between'
                    >
                      <Typography variant='h6'>Net Pay</Typography>
                      <Typography variant='h5'>{fmt(netSalary)}</Typography>
                    </Stack>

                    <Card variant='outlined'>
                      <CardContent>
                        <Stack
                          direction='row'
                          alignItems='center'
                          justifyContent='space-between'
                        >
                          <Typography variant='subtitle1'>
                            Taxable Income Breakdown
                          </Typography>
                          <IconButton
                            size='small'
                            onClick={() =>
                              setShowTaxBreakdown((value) => !value)
                            }
                          >
                            {showTaxBreakdown ? (
                              <KeyboardArrowUpOutlined />
                            ) : (
                              <KeyboardArrowDownOutlined />
                            )}
                          </IconButton>
                        </Stack>
                        <Collapse in={showTaxBreakdown}>
                          <Table size='small'>
                            <TableBody>
                              <TableRow>
                                <TableCell>Basic Salary</TableCell>
                                <TableCell align='right'>
                                  {fmt(run?.basic_salary || 0)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Taxable Allowances</TableCell>
                                <TableCell align='right'>
                                  {fmt(
                                    earningsRows
                                      .slice(1)
                                      .filter((row) => row.taxable)
                                      .reduce((sum, row) => sum + row.amount, 0)
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Pre-Tax Deductions</TableCell>
                                <TableCell align='right'>
                                  - {fmt(preTaxDeductions)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>
                                  Taxable Income
                                </TableCell>
                                <TableCell
                                  align='right'
                                  sx={{ fontWeight: 700 }}
                                >
                                  {fmt(taxableIncome)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Collapse>
                      </CardContent>
                    </Card>

                    <Divider />

                    <Typography variant='h6'>
                      Employer Contributions (for reference only)
                    </Typography>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align='right'>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employerContributionRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align='center'>
                              No employer contributions
                            </TableCell>
                          </TableRow>
                        ) : (
                          employerContributionRows.map((row, index) => (
                            <TableRow key={`${row.label}-${index}`}>
                              <TableCell>{row.label}</TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>
                                {row.category}
                              </TableCell>
                              <TableCell align='right'>
                                {fmt(row.amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Total Employer Contributions
                          </TableCell>
                          <TableCell />
                          <TableCell align='right' sx={{ fontWeight: 700 }}>
                            {fmt(totalEmployerContributions)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            Total Employer Cost
                          </TableCell>
                          <TableCell />
                          <TableCell align='right' sx={{ fontWeight: 700 }}>
                            {fmt(totalEmployerCost)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {run?.status !== 'finalized' && (
            <LoadingButton
              loading={isFinalizing}
              variant='contained'
              onClick={() => finalize()}
            >
              Finalize
            </LoadingButton>
          )}
          <Button
            variant='outlined'
            onClick={() => setOpenPdfDialog(true)}
            disabled={!run}
          >
            Print Payslip
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPdfDialog}
        onClose={() => setOpenPdfDialog(false)}
        fullWidth
        maxWidth='lg'
      >
        <DialogActions>
          <Button onClick={() => setOpenPdfDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PayslipDialog;
