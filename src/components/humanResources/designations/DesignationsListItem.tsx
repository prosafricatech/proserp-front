'use client';

import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import DesignationItemAction from './DesignationItemAction';
import { Designation } from './DesignationsType';

const DesignationsListItem = ({
  designation,
}: {
  designation: Designation;
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
        <Grid size={{ xs: 12, md: 5 }}>
          <Tooltip title='Designation Title'>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {designation.title}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Designation Code'>
            <Typography>{designation.code}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Designation Description'>
            <Typography>{designation.description}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 1, md: 0.5, lg: 1 }} textAlign={'end'}>
          <DesignationItemAction designation={designation} />
        </Grid>
      </Grid>
    </>
  );
};

export default DesignationsListItem;
