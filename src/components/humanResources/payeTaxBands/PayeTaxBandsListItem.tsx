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
        <Grid size={{ xs: 12, md: 2.2 }}>
          <Tooltip title='Minimum Income'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {payeTaxBand.min_income}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.2 }}>
          <Tooltip title='Maximum Income'>
            <Typography>{payeTaxBand.max_income ?? 'Open-ended'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Rate %'>
            <Typography>{payeTaxBand.rate_percent}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Fixed Amount'>
            <Typography>{payeTaxBand.fixed_amount ?? 0}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.6 }}>
          <Tooltip title='Description'>
            <Typography noWrap>{payeTaxBand.description || '-'}</Typography>
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
