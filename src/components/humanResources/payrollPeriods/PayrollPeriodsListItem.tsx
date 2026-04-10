'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { PayrollPeriodType } from './PayrollPeriodType';
import PayrollPeriodItemAction from './PayrollPeriodItemAction';

const statusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'approved':
      return 'success';
    case 'processing':
      return 'warning';
    case 'draft':
      return 'default';
    default:
      return 'default';
  }
};

const PayrollPeriodsListItem = ({
  payrollPeriod,
}: {
  payrollPeriod: PayrollPeriodType;
}) => {
  const router = useRouter();
  const lang = useLanguage();

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
        onClick={() => router.push(`/${lang}/hr/payroll/${payrollPeriod.id}`)}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Year'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {payrollPeriod.year}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Month'>
            <Typography>{payrollPeriod.month}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Status'>
            <Chip
              label={payrollPeriod.status || '-'}
              color={statusColor(payrollPeriod.status || '')}
              size='small'
              sx={{ textTransform: 'capitalize' }}
            />
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Runs Count'>
            <Typography>{payrollPeriod.runs_count ?? 0}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Remarks'>
            <Typography noWrap>{payrollPeriod.remarks || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid
          size={{ xs: 2, md: 1.5 }}
          textAlign={'end'}
          onClick={(event) => event.stopPropagation()}
        >
          <PayrollPeriodItemAction payrollPeriod={payrollPeriod} />
        </Grid>
      </Grid>
    </>
  );
};

export default PayrollPeriodsListItem;
