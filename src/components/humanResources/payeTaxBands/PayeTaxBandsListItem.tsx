'use client';

import { Chip, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { PayeTaxBandType } from './PayeTaxBandType';
import PayeTaxBandItemAction from './PayeTaxBandItemAction';

const formatMoney = (value?: number | null) =>
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString();
};

const getBandStatus = (effectiveFrom?: string, effectiveTo?: string | null) => {
  const now = new Date();
  const fromDate = effectiveFrom ? new Date(effectiveFrom) : null;
  const toDate = effectiveTo ? new Date(effectiveTo) : null;

  if (fromDate && fromDate > now) {
    return { label: 'Upcoming', color: 'info' as const };
  }

  if (toDate && toDate < now) {
    return { label: 'Expired', color: 'default' as const };
  }

  return { label: 'Active', color: 'success' as const };
};

const PayeTaxBandsListItem = ({
  payeTaxBand,
}: {
  payeTaxBand: PayeTaxBandType;
}) => {
  const status = getBandStatus(
    payeTaxBand.effective_from,
    payeTaxBand.effective_to
  );

  return (
    <>
      <Divider />
      <Grid
        mt={0.5}
        mb={0.5}
        sx={{
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={1.5}
        paddingRight={1.5}
        paddingY={1}
        columnSpacing={1.5}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 4 }}>
          <Tooltip title='Income Band'>
            <Stack spacing={0.25}>
              <Typography variant='h6' fontSize={14} lineHeight={1.25}>
                {formatMoney(payeTaxBand.min_income)}
                {' - '}
                {payeTaxBand.max_income != null
                  ? formatMoney(payeTaxBand.max_income)
                  : 'Open-ended'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Min to max taxable income
              </Typography>
            </Stack>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.4 }}>
          <Tooltip title='Rate'>
            <Chip
              label={`${payeTaxBand.rate}%`}
              size='small'
              color='warning'
              variant='outlined'
            />
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.7 }}>
          <Tooltip title='Fixed Tax'>
            <Stack spacing={0.25}>
              <Typography>{formatMoney(payeTaxBand.fixed_tax)}</Typography>
              <Typography variant='caption' color='text.secondary'>
                Fixed tax
              </Typography>
            </Stack>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 1.7 }}>
          <Tooltip title='Excess Over'>
            <Stack spacing={0.25}>
              <Typography>{formatMoney(payeTaxBand.excess_over)}</Typography>
              <Typography variant='caption' color='text.secondary'>
                Excess over
              </Typography>
            </Stack>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.8 }}>
          <Tooltip title='Effective Dates'>
            <Stack spacing={0.25}>
              <Typography variant='body2'>
                {formatDate(payeTaxBand.effective_from)}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                to {formatDate(payeTaxBand.effective_to)}
              </Typography>
            </Stack>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 8, md: 0.9 }}>
          <Chip
            label={status.label}
            size='small'
            color={status.color}
            variant='outlined'
          />
        </Grid>

        <Grid size={{ xs: 4, md: 0.5 }} textAlign={'end'}>
          <PayeTaxBandItemAction payeTaxBand={payeTaxBand} />
        </Grid>
      </Grid>
    </>
  );
};

export default PayeTaxBandsListItem;
