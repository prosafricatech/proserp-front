'use client';

import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { ArrowBackOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import humanResourcesServices from '../humanResourcesServices';
import { getPayslipCalculations } from './payslipCalculations';

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusColor(status?: string): 'default' | 'warning' | 'success' | 'info' | 'error' {
  switch (status) {
    case 'finalized': return 'success';
    case 'draft': return 'warning';
    default: return 'default';
  }
}

export default function PayslipDetail() {
  const { id, runId } = useParams<{ id: string; runId: string }>();
  const router = useRouter();
  const lang = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: run, isLoading } = useQuery({
    queryKey: ['showPayrollRun', runId],
    queryFn: () => humanResourcesServices.showPayrollRun(runId),
    enabled: !!runId,
  });

  const { mutate: finalize, isPending: isFinalizing } = useMutation({
    mutationFn: () => humanResourcesServices.finalizePayrollRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showPayrollRun', runId] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunsForPeriod', id] });
      enqueueSnackbar('Payslip finalized', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Error finalizing payslip', { variant: 'error' }),
  });

  const name = run
    ? [run.employee?.first_name, run.employee?.last_name].filter(Boolean).join(' ')
    : '';

  const {
    paye,
    earningsRows,
    deductionRows,
    grossSalary,
    preTaxDeductions,
    taxableIncome,
    otherDeductions,
    totalDeductions,
    netSalary,
  } = getPayslipCalculations(run);

  if (isLoading) {
    return (
      <Box p={4}>
        <Stack spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant='rectangular' height={48} sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <JumboContentLayout
      header={
        <Stack direction='row' alignItems='center' spacing={2} flexWrap='wrap'>
          <Tooltip title='Back to Period'>
            <IconButton onClick={() => router.push(`/${lang}/hr/payroll/${id}`)}>
              <ArrowBackOutlined />
            </IconButton>
          </Tooltip>
          <Stack flex={1} spacing={0.25}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography variant='h4'>Payslip — {name || 'Unknown Employee'}</Typography>
              <Chip
                size='small'
                label={run?.status ?? 'draft'}
                color={statusColor(run?.status)}
              />
            </Stack>
            <Typography variant='body2' color='text.secondary'>
              {run?.employee?.employee_number}
              {run?.contract?.designation?.title ? ` · ${run.contract.designation.title}` : ''}
            </Typography>
          </Stack>
          {run?.status !== 'finalized' && (
            <LoadingButton
              variant='contained'
              color='primary'
              size='small'
              loading={isFinalizing}
              onClick={() => finalize()}
            >
              Finalize
            </LoadingButton>
          )}
          <Button
            variant='outlined'
            color='primary'
            size='small'
            onClick={() => window.print()}
          >
            Print / Export
          </Button>
        </Stack>
      }
    >
      <Card sx={{ maxWidth: 900 }}>
        <CardContent>
          {/* Earnings */}
          <Typography variant='h6' gutterBottom>
            Earnings
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {earningsRows.map(({ label, amount, taxable }) => (
                <TableRow key={label}>
                  <TableCell>
                    {label}
                    {!taxable && ' (non-taxable)'}
                  </TableCell>
                  <TableCell align='right'>{fmt(amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Gross Salary</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  {fmt(grossSalary)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />

          {/* Deductions */}
          <Typography variant='h6' gutterBottom>
            Deductions
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>PAYE</TableCell>
                <TableCell>Tax</TableCell>
                <TableCell align='right'>{fmt(paye)}</TableCell>
              </TableRow>
              {deductionRows.map(({ label, category, amount }) => (
                <TableRow key={`${label}-${category}`}>
                  <TableCell>{label}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{category}</TableCell>
                  <TableCell align='right'>{fmt(amount)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Total Deductions</TableCell>
                <TableCell />
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  {fmt(totalDeductions)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />

          {/* Net Summary */}
          <Typography variant='h6' gutterBottom>
            Net Pay Summary
          </Typography>
          <Table size='small'>
            <TableBody>
              <TableRow>
                <TableCell>Gross Salary</TableCell>
                <TableCell align='right'>{fmt(grossSalary)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pre-Tax Deductions</TableCell>
                <TableCell align='right'>- {fmt(preTaxDeductions)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Taxable Income</TableCell>
                <TableCell align='right'>{fmt(taxableIncome)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PAYE</TableCell>
                <TableCell align='right'>- {fmt(paye)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Other Deductions</TableCell>
                <TableCell align='right'>- {fmt(otherDeductions)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Net Salary</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  {fmt(netSalary)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </JumboContentLayout>
  );
}
