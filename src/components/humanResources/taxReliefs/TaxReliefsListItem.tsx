'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import TaxReliefItemAction from './TaxReliefItemAction';
import { TaxReliefType } from './TaxReliefType';

const TaxReliefsListItem = ({
  taxRelief,
}: {
  taxRelief: TaxReliefType;
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
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Name'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {taxRelief.name}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Amount'>
            <Typography>{taxRelief.amount}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          {taxRelief.is_active ? (
            <Chip label='Active' size='small' color='success' variant='outlined' />
          ) : (
            <Chip label='Inactive' size='small' color='default' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Description'>
            <Typography noWrap>{taxRelief.description || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <TaxReliefItemAction taxRelief={taxRelief} />
        </Grid>
      </Grid>
    </>
  );
};

export default TaxReliefsListItem;
