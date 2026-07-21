'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { formatMoney, statusColor } from '../../payrollRuns/payrollUtils';
import MyHrPayslipItemAction from './MyHrPayslipItemAction';
import { MyHrPayslipListItem } from './payslipsType';

const MONTH_NAMES = [
  '',
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

const MyHrPayslipsListItem = ({
  payslip,
}: {
  payslip: MyHrPayslipListItem;
}) => {
  const period = payslip.run?.period;
  const periodLabel = period
    ? `${MONTH_NAMES[period.month] || period.month} ${period.year}`
    : '—';

  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        spacing={1}
        alignItems='center'
        container
      >
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Payroll Period'>
            <div>
              <Typography
                variant='h5'
                fontSize={14}
                lineHeight={1.25}
                mb={0}
                noWrap
              >
                {periodLabel}
              </Typography>
              <Typography variant='body2' color='text.secondary' noWrap>
                {payslip.contract?.designation?.title || '—'}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Basic Salary'>
            <div>
              <Typography noWrap>
                {formatMoney(payslip.basic_salary)}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='PAYE'>
            <div>
              <Typography noWrap>{formatMoney(payslip.paye)}</Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Payroll Run Status'>
            <div>
              <Chip
                size='small'
                label={payslip.run?.status_label || payslip.run?.status || '—'}
                color={statusColor(payslip.run?.status || '')}
                sx={{ textTransform: 'capitalize' }}
              />
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1 }} textAlign='end'>
          <MyHrPayslipItemAction payslipId={payslip.id} />
        </Grid>
      </Grid>
    </>
  );
};

export default MyHrPayslipsListItem;
