import React from 'react';
import { Box, Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import GrnsListItemAction from './GrnsListItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

const GrnsListItem = ({ grn }) => {
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
        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title='Date'>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {readableDate(grn.date_received)}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 6, md: 3, lg: 3 }}>
          <Tooltip title='Grn No'>
            <Typography>{grn.grnNo}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 5, md: 2, lg: 2 }}>
          <Tooltip title='Reference'>
            <Typography>{grn.reference}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 7, md: 3, lg: 3 }}>
          <Tooltip title='Cost Center'>
            <Chip
              size='small'
              label={grn.cost_centers.map((costcenter) => costcenter.name).join(', ')}
              color='default'
            />
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 1, lg: 1 }}>
          <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
            <GrnsListItemAction grn={grn} />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default GrnsListItem;
