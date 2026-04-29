'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import PayrollRunItemAction from './PayrollRunItemAction';
import { PayrollRunType } from './PayrollRunType';

const statusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'finalized':
    case 'approved':
    case 'paid':
      return 'success';
    case 'processing':
      return 'warning';
    case 'rejected':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'TZS',
  });

const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const PayrollRunsListItem = ({ payrollRun }: { payrollRun: PayrollRunType }) => {
  const router = useRouter();
  const lang = useLanguage();
  const employeeName = `${payrollRun.employee?.first_name || ''} ${payrollRun.employee?.last_name || ''}`.trim();
  const grossPay = Number(payrollRun.basic_salary || 0);
  const totalDeductions = Number(payrollRun.paye || 0);
  const netPay = Math.max(grossPay - totalDeductions, 0);
  const taxRate = grossPay > 0 ? (totalDeductions / grossPay) * 100 : 0;

  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() =>
          router.push(`/${lang}/humanResources/payroll/${payrollRun.payroll_period_id}?run_id=${payrollRun.id}`)
        }
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Employee'>
            <div>
              <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0} noWrap>
                {employeeName}
              </Typography>
              <Typography variant='body2' color='text.secondary' noWrap>
                {payrollRun.employee?.employee_number || '-'}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.75 }}>
          <Tooltip title='Basic Salary'>
            <Typography>
              {formatMoney(grossPay)}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.5 }}>
          <Tooltip title='PAYE'>
            <Typography>
              {formatMoney(totalDeductions)}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.75 }}>
          <Tooltip title='Net Pay (Basic Salary - PAYE)'>
            <Typography fontWeight={600}>{formatMoney(netPay)}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1 }}>
          <Tooltip title='Tax Rate (PAYE / Basic Salary)'>
            <Typography>{formatPercent(taxRate)}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1 }}>
          <Tooltip title='Status'>
            <Chip
              label={payrollRun.status || '-'}
              color={statusColor(payrollRun.status || '')}
              size='small'
              sx={{ textTransform: 'capitalize' }}
            />
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 12, md: 2 }}
          textAlign={'end'}
          onClick={(event) => event.stopPropagation()}
        >
          <PayrollRunItemAction payrollRun={payrollRun} />
        </Grid>
      </Grid>
    </>
  );
};

export default PayrollRunsListItem;
