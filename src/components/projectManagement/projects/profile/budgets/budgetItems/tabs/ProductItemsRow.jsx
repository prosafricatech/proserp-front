import { DisabledByDefault } from '@mui/icons-material'
import { Chip, Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React from 'react'

function ProductItemsRow({ productItem, index, setProductItems }) { 

    const handleDelete = () => {
        if (typeof setProductItems !== 'function') return;
        setProductItems((prevItems) => {
            const nextItems = [...prevItems];
            nextItems.splice(index, 1);
            return nextItems;
        });
    };

    const alternativeProducts = productItem?.alternative_products || [];
    const currencyCode = productItem?.currency?.code || 'USD';

  return (
    <React.Fragment>
        <Divider/>
            <Grid container 
                width={'100%'}
                sx={{
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: 'action.hover',
                    }
                }}
            >
                <Grid size={{xs: 1, md: 0.5}}>
                    {index+1}.
                </Grid>
                <Grid size={{xs: 11, md: 5}}>
                    <ListItemText
                        primary={
                            <Tooltip title="Product name">
                               <Typography component="span">{productItem.product_name || productItem?.product?.name || '-'}</Typography>
                            </Tooltip>
                        }
                        secondary={
                            <Tooltip title="Description">
                               <Typography component="span">{productItem.description || '-'}</Typography>
                            </Tooltip>
                        }
                    />
                </Grid>
                <Grid size={{xs: 6, md: alternativeProducts.length > 0 ? 1.6 : 1.5}} textAlign={{xs: 'left', md: 'center'}}>
                    <Tooltip title="Quantity">
                        <Typography>{Number(productItem.quantity || 0).toLocaleString()} {productItem?.unit_symbol ? productItem.unit_symbol : (productItem.measurement_unit?.symbol ? productItem.measurement_unit?.symbol : productItem?.product?.unit_symbol || '')}</Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: alternativeProducts.length > 0 ? 2 : 1.5}} paddingRight={alternativeProducts.length > 0 ? 2 : 0} textAlign={alternativeProducts.length > 0 ? 'center' : 'right'}>
                    <Tooltip title="Rate">
                        <Typography>{Number(productItem.rate || 0).toLocaleString('en-US', 
                            {
                                style: 'currency',
                                currency: currencyCode,
                            })}
                        </Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 4, md: alternativeProducts.length > 0 ? 2.4 : 2.5}} textAlign={{xs: 'left', md: 'center'}}>
                    <Tooltip title="Amount">
                        <Typography>{(Number(productItem.rate || 0) * Number(productItem.quantity || 0))?.toLocaleString('en-US', 
                            {
                                style: 'currency',
                                currency: currencyCode,
                            })}
                        </Typography>
                    </Tooltip>
                </Grid>
                {alternativeProducts.length > 0 &&
                    <Grid size={{xs: 8, md: 11}}>
                        <Tooltip title="Alternative Products">
                            <div>
                                {alternativeProducts.map((product, index) => (
                                    <Chip
                                        key={index} 
                                        size='small'
                                        label={product.name} 
                                        style={{ marginRight: 4 }}
                                    />
                                ))}
                            </div>
                        </Tooltip>
                    </Grid>
                }
                <Grid size={{xs: alternativeProducts.length > 0 ? 12 : 8, md: 1}} textAlign={'end'}>
                    <Tooltip title='Remove Product Item'>
                        <IconButton size='small' 
                            onClick={() => {
                                handleDelete();
                            }}
                        >
                            <DisabledByDefault fontSize='small' color='error'/>
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
    </React.Fragment>
  )
}

export default ProductItemsRow