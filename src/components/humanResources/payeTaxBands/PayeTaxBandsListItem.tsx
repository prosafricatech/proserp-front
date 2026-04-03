'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { PayeTaxBandType } from './PayeTaxBandType';
import PayeTaxBandItemAction from './PayeTaxBandItemAction';

const PayeTaxBandsListItem = ({
  payeTaxBand,
}: {
  payeTaxBand: PayeTaxBandType;
}) => {
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Country Code'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {payeTaxBand.country_code}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Minimum Income'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {payeTaxBand.min_income.toLocaleString()}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Maximum Income'>
            <Typography>{payeTaxBand.max_income != null ? payeTaxBand.max_income.toLocaleString() : 'Open-ended'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Rate (%)'>
            <Typography>{payeTaxBand.rate}%</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Fixed Tax'>
            <Typography>{payeTaxBand.fixed_tax.toLocaleString()}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Excess Over'>
            <Typography>{payeTaxBand.excess_over.toLocaleString()}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1.5 }}>
          <Tooltip title='Effective From'>
            <Typography>{payeTaxBand.effective_from ? new Date(payeTaxBand.effective_from).toLocaleDateString() : '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1.0 }} textAlign={'end'}>
          <PayeTaxBandItemAction payeTaxBand={payeTaxBand} />
        </Grid>
      </Grid>
    </>
  );
};

export default PayeTaxBandsListItem;
