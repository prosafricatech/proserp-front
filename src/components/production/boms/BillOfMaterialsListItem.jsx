import React from 'react';
import {Grid, Tooltip, Typography } from '@mui/material';
import BillOfMaterialItemAction from './BillOfMaterialItemAction';

const BillOfMaterialsListItem = ({ billOfMaterial }) => {
  return (
    <React.Fragment>
      <Grid
        container 
        columnSpacing={1}
        width={'100%'}
        sx={{
          cursor: 'pointer',
          borderTop: 1,
          borderColor: 'divider',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          paddingLeft: 2,
          paddingRight: 3
        }}
        alignItems={'center'}
      >
        <Grid size={{xs: 3, md: 2}}>
          <Tooltip title='BomNo.'>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {billOfMaterial.bomNo}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 9, md: 5}}>
          <Tooltip title='Material'>
            <Typography>{billOfMaterial.product?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <Tooltip title='Quantity'>
            <Typography>{billOfMaterial.quantity.toLocaleString()} {billOfMaterial.measurement_unit.symbol}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 1}} textAlign={"end"}>
          <BillOfMaterialItemAction billOfMaterial={billOfMaterial}/>
        </Grid> 
      </Grid>
    </React.Fragment>
  );
};

export default BillOfMaterialsListItem;