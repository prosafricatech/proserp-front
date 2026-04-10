'use client';

import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { ArrowBackOutlined } from '@mui/icons-material';
import {
  Box,
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

  const gross = run?.basic_salary ?? 0;
  const paye = run?.paye ?? 0;
  const net = gross - paye;

  const earningsRows = [
    { label: 'Basic Salary', value: gross },
  ];

  const deductionsRows = [
    { label: 'PAYE Tax', value: paye },
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
        </Stack>
      }
    >
      <Card sx={{ maxWidth: 640 }}>
        <CardContent>
          {/* Earnings */}
          <Typography variant='h6' gutterBottom>
            Earnings
          </Typography>
          <Table size='small'>
            <TableBody>
              {earningsRows.map(({ label, value }) => (
                <TableRow key={label}>
                  <TableCell>{label}</TableCell>
                  <TableCell align='right'>{fmt(value)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Total Earnings</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  {fmt(gross)}
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
            <TableBody>
              {deductionsRows.map(({ label, value }) => (
                <TableRow key={label}>
                  <TableCell>{label}</TableCell>
                  <TableCell align='right'>{fmt(value)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Total Deductions</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600 }}>
                  {fmt(paye)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Divider sx={{ my: 2 }} />

          {/* Net */}
          <Table size='small'>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>Net Pay</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  {fmt(net)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </JumboContentLayout>
  );
}
