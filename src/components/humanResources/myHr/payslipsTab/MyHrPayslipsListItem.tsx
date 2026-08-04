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

  // This payslip's own paid/unpaid state, not the whole run's — an employee
  // on a "partially paid" run who personally hasn't been paid yet should not
  // see "Partially Paid" themselves. "partially_paid"/"paid" describe the RUN
  // in aggregate, so they're only trustworthy as a fallback for this payslip
  // when neither applies (nobody on the run has been paid at all yet);
  // otherwise an untouched payslip shows the honest "Unpaid" instead.
  const balanceRemaining = payslip.balance_remaining ?? 0;
  const paidAmount = payslip.paid_amount ?? 0;
  const isPaid =
    balanceRemaining <= 0.01 && (paidAmount > 0 || payslip.basic_salary > 0);
  const isPartiallyPaid = !isPaid && paidAmount > 0;
  const runStatusRaw = (payslip.run?.status || '').toLowerCase();
  const paymentStatusLabel = isPaid
    ? 'Paid'
    : isPartiallyPaid
      ? 'Partially Paid'
      : ['partially_paid', 'paid'].includes(runStatusRaw)
        ? 'Unpaid'
        : payslip.run?.status_label || payslip.run?.status || '—';
  const paymentStatusColor = isPaid
    ? 'success'
    : isPartiallyPaid
      ? 'warning'
      : ['partially_paid', 'paid'].includes(runStatusRaw)
        ? 'default'
        : statusColor(payslip.run?.status || '');

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
          <Tooltip title='Payment Status'>
            <div>
              <Chip
                size='small'
                label={paymentStatusLabel}
                color={paymentStatusColor}
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
