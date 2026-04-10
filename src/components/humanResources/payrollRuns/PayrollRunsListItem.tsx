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

const PayrollRunsListItem = ({ payrollRun }: { payrollRun: PayrollRunType }) => {
  const router = useRouter();
  const lang = useLanguage();
  const employeeName = `${payrollRun.employee?.first_name || ''} ${payrollRun.employee?.last_name || ''}`.trim();

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
          router.push(`/${lang}/hr/payroll/${payrollRun.payroll_period_id}/runs/${payrollRun.id}`)
        }
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Employee'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {employeeName || `Employee #${payrollRun.employee_id}`}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Employee Number'>
            <Typography>{payrollRun.employee?.employee_number || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Basic Salary'>
            <Typography>
              {Number(payrollRun.basic_salary || 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'TZS',
              })}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='PAYE'>
            <Typography>
              {Number(payrollRun.paye || 0).toLocaleString('en-US', {
                style: 'currency',
                currency: 'TZS',
              })}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
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
          size={{ xs: 2, md: 2 }}
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
