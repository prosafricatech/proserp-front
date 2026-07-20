import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PaidOutlined } from '@mui/icons-material';
import { Chip, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { LoanRequest } from './LoanRequestType';

const formatCurrency = (value?: number | null) =>
  value != null ? Number(value).toLocaleString() : '—';

const STATUS_COLOR: Record<string, any> = {
  in_review: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
  'on hold': 'info',
};

const STATUS_LABEL: Record<string, string> = {
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  'on hold': 'On Hold',
};

const MyHrLoanRequestsListItem = ({
  loanRequest,
}: {
  loanRequest: LoanRequest;
}) => {
  const statusColor = STATUS_COLOR[loanRequest.status] || 'default';
  const statusLabel =
    STATUS_LABEL[loanRequest.status] || loanRequest.status || 'Pending';

  const hasDecision =
    loanRequest.amount_approved != null ||
    loanRequest.installments_approved != null;

  return (
    <>
      <Divider />
      <Grid
        container
        spacing={1}
        alignItems='center'
        width='100%'
        paddingLeft={1}
        paddingRight={1}
        my={1}
      >
        <Grid size={{ xs: 12, md: 2.8 }}>
          <Tooltip title='Requested Amount'>
            <Typography>{formatCurrency(loanRequest.amount)}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.2 }}>
          <Tooltip title='Requested Installments'>
            <Typography>{loanRequest.installments} months</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.8 }}>
          <Tooltip title='Approved Amount / Installments'>
            <Typography>
              {hasDecision
                ? `${formatCurrency(loanRequest.amount_approved)} / ${loanRequest.installments_approved} mo`
                : '—'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.9 }}>
          <Tooltip title='Requested On'>
            <Typography>
              {readableDate(loanRequest.created_at, false)}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.3 }}>
          <Stack direction='row' spacing={0.5} alignItems='center'>
            <Chip
              label={statusLabel}
              size='small'
              color={statusColor}
              variant='outlined'
              sx={{ textTransform: 'capitalize' }}
            />
            {loanRequest.disbursed_at && (
              <Tooltip
                title={`Disbursed ${readableDate(loanRequest.disbursed_at, false)}`}
              >
                <PaidOutlined color='success' fontSize='small' />
              </Tooltip>
            )}
          </Stack>
        </Grid>
      </Grid>
    </>
  );
};

export default MyHrLoanRequestsListItem;
