import React from 'react';
import { Box, Grid, Tooltip, Typography } from '@mui/material';
import { readableDate } from 'app/helpers/input-sanitization-helpers';
import DippingsItemAction from './DippingsItemAction';

const DippingsListItem = ({ dipping }) => {

  return (
    <Grid 
      container 
      columnSpacing={2}   
      alignItems={'center'}
      sx={{
        cursor: 'pointer',
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        paddingTop: 2,
    }}
    >
        <Grid item xs={7} md={4}>
            <Tooltip title='As At'>
                <Typography>
                    {readableDate(dipping.as_at, true)}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid item xs={5} md={3}>
            <Tooltip title='Dipping No'>
                <Typography fontWeight={'bold'}>
                    {dipping.dipping_no}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid item xs={11} md={4}>
            <Tooltip title='Remarks'>
                <Typography>
                    {dipping.remarks}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid item xs={1} md={1}>
            <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'} > 
                <DippingsItemAction dipping={dipping} />
            </Box>
        </Grid>
    </Grid>
  );
};

export default DippingsListItem;