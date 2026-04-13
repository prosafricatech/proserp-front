'use client';

import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { ArrowBackOutlined, HighlightOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
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
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import { useState } from 'react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import humanResourcesServices from '../humanResourcesServices';
import { getPayslipCalculations } from './payslipCalculations';
import PayslipPDF from './PayslipPDF';
import PDFContent from '@/components/pdf/PDFContent';

function fmt(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtStatus(value?: string) {
  if (!value) return '-';
  return value
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
  const authObject = useJumboAuth() as any;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openExportDialog, setOpenExportDialog] = useState(false);

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

  const getRowSx = (index: number) => ({
    backgroundColor:
      index % 2 === 0
        ? theme.palette.background.paper
        : theme.palette.action.hover,
  });

  const deductionsTableRows = [
    { label: 'PAYE', category: 'Tax', amount: paye },
    ...deductionRows.map((row) => ({
      label: row.label,
      category: row.category,
      amount: row.amount,
    })),
  ];

  const netSummaryRows = [
    { label: 'Gross Salary', amount: fmt(grossSalary) },
    { label: 'Pre-Tax Deductions', amount: `- ${fmt(preTaxDeductions)}` },
    { label: 'Taxable Income', amount: fmt(taxableIncome) },
    { label: 'PAYE', amount: `- ${fmt(paye)}` },
    { label: 'Other Deductions', amount: `- ${fmt(otherDeductions)}` },
    { label: 'Net Salary', amount: fmt(netSalary), isTotal: true },
  ];

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
        <Stack direction='row' alignItems='center' spacing={2} flexWrap='wrap' paddingTop={belowLargeScreen ? 5 : 0}>
          <Tooltip title='Back to Period'>
            <IconButton onClick={() => router.push(`/${lang}/humanResources/payroll/${id}`)}>
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
            onClick={() => setOpenExportDialog(true)}
          >
            Export
          </Button>
        </Stack>
      }
    >
      <Card sx={{ maxWidth: 900 }} style={{ paddingTop: 2 }}>
        <CardContent>
          {/* Earnings */}
          <Typography variant='h6' sx={{ textAlign: 'center', mb: 0 }}>
            EARNINGS
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {earningsRows.map(({ label, amount, taxable }, index) => (
                <TableRow key={label} sx={getRowSx(index)}>
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
          <Typography variant='h6' sx={{ textAlign: 'center', mb: 0 }}>
            DEDUCTIONS
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
              {deductionsTableRows.map(({ label, category, amount }, index) => (
                <TableRow key={`${label}-${category}-${index}`} sx={getRowSx(index)}>
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
          <Typography variant='h6' sx={{ textAlign: 'center', mb: 0 }}>
            NET PAY SUMMARY
          </Typography>
          <Table size='small'>
            <TableBody>
              {netSummaryRows.map((row, index) => (
                <TableRow
                  key={`${row.label}-${index}`}
                  sx={row.isTotal ? undefined : getRowSx(index)}
                >
                  <TableCell
                    sx={
                      row.isTotal
                        ? { fontWeight: 700, fontSize: '1rem' }
                        : undefined
                    }
                  >
                    {row.label}
                  </TableCell>
                  <TableCell
                    align='right'
                    sx={
                      row.isTotal
                        ? { fontWeight: 700, fontSize: '1rem' }
                        : undefined
                    }
                  >
                    {row.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={openExportDialog}
        scroll='paper'
        fullWidth
        maxWidth='md'
        onClose={() => setOpenExportDialog(false)}
      >
        <DialogContent>
          {belowLargeScreen && (
            <Box display='flex' justifyContent='flex-end' mb={1}>
              <Tooltip title='Close'>
                <IconButton size='small' onClick={() => setOpenExportDialog(false)}>
                  <HighlightOff color='primary' />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          <PDFContent
            document={
              <PayslipPDF
                payrollRun={run as any}
                organization={authObject?.authOrganization?.organization}
              />
            }
            fileName={`Payslip-${run?.employee?.first_name || 'Employee'}-${run?.employee?.last_name || ''}`}
          />
        </DialogContent>
      </Dialog>
    </JumboContentLayout>
  );
}
