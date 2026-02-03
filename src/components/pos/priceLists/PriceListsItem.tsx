import React from 'react';
import { ListItemText, Tooltip, Typography, Grid, Box } from '@mui/material';
import PriceListsItemAction from './PriceListsItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PriceList } from './PriceListType';

interface PriceListsItemProps {
  priceList: PriceList;
  fuelPriceLists?: boolean;
}

const PriceListsItem: React.FC<PriceListsItemProps> = ({ fuelPriceLists, priceList }) => {
  return (
    <Grid 
      container
      columnSpacing={1}
      sx={{
        cursor: 'pointer',
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        paddingLeft: 2,
        mt: 1
      }}
      alignItems={'center'}
    >
      <Grid size={5}>
        <ListItemText
          primary={
            <Tooltip title="Effective Date">
              <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0}>
                {readableDate(priceList.effective_date)}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>
      <Grid size={6}>
        <ListItemText
          primary={
            <Tooltip title="Narration">
              <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0}>
                {priceList.narration || '-'}
              </Typography>
            </Tooltip>
          }
        />
      </Grid>
      <Grid size={1}>
        <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
          <PriceListsItemAction fuelPriceLists={fuelPriceLists} priceList={priceList} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default PriceListsItem;