import React from 'react';
import { Box, Chip, Grid, Tooltip, Typography } from '@mui/material';
import ProductionBatchesItemAction from './ProductionBatchesItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

const ProductionBatchesListItem = ({ batch }) => {

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
        paddingBottom:1,
        paddingRight:2,
    }}
    >
        <Grid size={{xs: 6, md: 3}}>
            <Tooltip title='Batch No'>
                <Typography fontWeight={'bold'}>
                    {batch.batchNo}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
            <Tooltip title='Start Date'>
                <Typography>
                    {readableDate(batch.start_date, true)}
                </Typography>
            </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
            {batch.end_date &&
                <Tooltip title='End Date'>
                    <Typography>
                        {readableDate(batch.end_date, true)}
                    </Typography>
                </Tooltip>
            }
        </Grid>
        <Grid size={{xs: 6, md: 2}}>
            <Tooltip title='Status'>
                <Chip
                    size='small'
                    label={batch.status}
                    color={batch.status === 'closed'? 'success' : 'primary'}
                /> 
            </Tooltip>
        </Grid>
        <Grid size={{xs: 12, md: 1}}>
            <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'} > 
                <ProductionBatchesItemAction batch={batch} />
            </Box>
        </Grid>
    </Grid>
  );
};

export default ProductionBatchesListItem;