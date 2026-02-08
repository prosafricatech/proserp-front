import { DisabledByDefault } from '@mui/icons-material'
import { Chip, Divider, Grid, IconButton, ListItemText, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import projectsServices from '@/components/projectManagement/projects/project-services';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function ProductItemsRow({ productItem, index}) {
    const {enqueueSnackbar} = useSnackbar();
    const {showDialog,hideDialog} = useJumboDialog();
    const queryClient = useQueryClient();

    const deleteExistingBudgetItem = useMutation({
        mutationFn: (variables) => projectsServices.deleteExistingBudgetItem(variables),
        onSuccess: (data) => {
            enqueueSnackbar(data.message,{variant : 'success'});
            queryClient.invalidateQueries({queryKey: ['budgetItemsDetails']});
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data.message,{variant : 'error'});
        },
    });

    const handleDelete = () => {
        showDialog({
            title: 'Confirm Delete?',
            content: 'If you click yes, this Product Item will be deleted',
        onYes: () => {
            hideDialog();
            deleteExistingBudgetItem.mutate({ id: productItem.id, type: 'product' });
        },
        onNo: () => hideDialog(),
            variant: 'confirm'
        });
    };  

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
                               <Typography component="span">{productItem.product_name || productItem.product.name}</Typography>
                            </Tooltip>
                        }
                        secondary={
                            <Tooltip title="Description">
                               <Typography component="span">{productItem.description}</Typography>
                            </Tooltip>
                        }
                    />
                </Grid>
                <Grid size={{xs: 6, md: productItem.alternative_products?.length > 0 ? 1.6 : 1.5}} textAlign={{xs: 'left', md: 'center'}}>
                    <Tooltip title="Quantity">
                        <Typography>{productItem.quantity.toLocaleString()} {productItem?.unit_symbol ? productItem.unit_symbol : (productItem.measurement_unit?.symbol ? productItem.measurement_unit?.symbol : productItem.product.unit_symbol)}</Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: productItem.alternative_products.length > 0 ? 2 : 1.5}} paddingRight={productItem.alternative_products?.length > 0 ? 2 : 0} textAlign={productItem.alternative_products?.length > 0 ? 'center' : 'right'}>
                    <Tooltip title="Rate">
                        <Typography>{productItem.rate?.toLocaleString('en-US', 
                            {
                                style: 'currency',
                                currency: productItem.currency?.code,
                            })}
                        </Typography>
                    </Tooltip>
                </Grid>
                <Grid size={{xs: 4, md: productItem.alternative_products.length > 0 ? 2.4 : 2.5}} textAlign={{xs: 'left', md: 'center'}}>
                    <Tooltip title="Amount">
                        <Typography>{(productItem.rate * productItem.quantity)?.toLocaleString('en-US', 
                            {
                                style: 'currency',
                                currency: productItem.currency?.code,
                            })}
                        </Typography>
                    </Tooltip>
                </Grid>
                {productItem.alternative_products?.length > 0 &&
                    <Grid size={{xs: 8, md: 11}}>
                        <Tooltip title="Alternative Products">
                            <div>
                                {productItem.alternative_products?.map((product, index) => (
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
                <Grid size={{xs: productItem.alternative_products.length > 0 ? 12 : 8, md: 1}} textAlign={'end'}>
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