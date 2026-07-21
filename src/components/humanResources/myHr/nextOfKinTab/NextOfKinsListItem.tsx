'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { NextOfKinType } from '../../employees/profile/nextOfKins/NextOfKinType';

const NextOfKinsListItem = ({ nextOfKin }: { nextOfKin: NextOfKinType }) => {
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
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title='Name'>
            <Typography>{nextOfKin.name}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3.0 }}>
          <Tooltip title='Relationship'>
            <Typography>{nextOfKin.relationship}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.0 }}>
          <Tooltip title='Phone'>
            <Typography>{nextOfKin.phone || '-'}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }} textAlign={'right'}>
          {nextOfKin.is_primary ? (
            <Chip
              label='Primary'
              size='small'
              color='success'
              variant='outlined'
            />
          ) : (
            <Chip label='Secondary' size='small' variant='outlined' />
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default NextOfKinsListItem;
