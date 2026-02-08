import { Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react'
import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import ByProductsItemForm from './ByProductsItemForm';

function ByProductsItemRow({ setClearFormKey, submitMainForm, setSubmitItemForm, submitItemForm, setIsDirty, by_products, setBy_products, item, index}) {
  const product = item.product;
  const [showForm, setShowForm] = useState(false);

  return (
    <React.Fragment>
      <Divider/>
      { !showForm ? (
          <Grid container 
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <Grid size={0.5}>
              {index+1}.
            </Grid>
            <Grid size={{xs: 11.5, md: 3.5}}>
              <ListItemText
                primary={
                  <Tooltip title={'Product'}>
                    <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                      {product.name}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <Tooltip title={'Remarks'}>
                    <Typography variant={"span"} fontSize={14} lineHeight={1.25} mb={0} >
                      {item.remarks}
                    </Typography>
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={{xs: 6, md: 3}}>
              <Tooltip title="Store">
                <Typography>{item.store?.name}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}} textAlign={'end'}>
              <Tooltip title="Quantity">
                <Typography>{item.quantity?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product.unit_symbol)}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2}} textAlign={{md: 'end'}}>
              {item.market_value &&
                <Tooltip title="Market Value">
                  <Typography>{item.market_value?.toLocaleString()} {item?.unit_symbol ? item.unit_symbol : (item.measurement_unit?.symbol ? item.measurement_unit?.symbol : item.product.unit_symbol)}</Typography>
                </Tooltip>
              }
            </Grid>
            <Grid textAlign={'end'} size={{xs: item.market_value ? 6 : 12, md: 1}}>
              <Tooltip title='Edit Item'>
                <IconButton size='small' onClick={() => {setShowForm(true)}}>
                  <EditOutlined fontSize='small'/>
                </IconButton>
              </Tooltip>
              <Tooltip title='Remove Item'>
                <IconButton size='small' 
                  onClick={() => setBy_products(items => {
                    const newItems = [...items];
                    newItems.splice(index,1);
                    return newItems;
                  })}
                >
                  <DisabledByDefault fontSize='small' color='error'/>
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        ) : (
          <ByProductsItemForm setClearFormKey={setClearFormKey} submitMainForm={submitMainForm} setSubmitItemForm={setSubmitItemForm} submitItemForm={submitItemForm} setIsDirty={setIsDirty} item={item} setShowForm={setShowForm} index={index} by_products={by_products} setBy_products={setBy_products}/>
        )
      }
    </React.Fragment>
  )
}

export default ByProductsItemRow