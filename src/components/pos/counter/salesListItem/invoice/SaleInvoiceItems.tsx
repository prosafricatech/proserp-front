import { Div } from '@jumbo/shared';
import { Alert, Divider, Grid, LinearProgress, ListItemText, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';

interface SaleItem {
  product?: {
    name: string;
  };
  description: string;
  product_name?: string;
  measurement_unit?: {
    symbol: string;
  };
  unit?: string;
  quantity: number;
  rate: number;
}

interface ExtendedFormContext {
  formState: any;
  watch: any;
  setValue: any;
  isRetrieving: boolean;
  sale_items: SaleItem[];
}

function SaleInvoiceItems() {
    const context = useFormContext() as unknown as ExtendedFormContext;
    const { isRetrieving, sale_items = [] } = context;

    if (isRetrieving) {
        return <LinearProgress />;
    }

    if (!sale_items || sale_items.length === 0) {
        return (
            <Alert variant='outlined' severity='info'>
                No Items found to Invoice, Please Select Delivery Note(s)
            </Alert>
        );
    }

    return (
        <>
            {sale_items.map((item: SaleItem, index: number) => (
                <Grid
                    container
                    spacing={1}
                    key={`${item.product?.name || item.product_name}-${index}`}
                    sx={{
                        cursor: 'pointer',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <Grid size={12}>
                        <Divider />
                    </Grid>
                    <Grid size={0.5}>
                        <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
                    </Grid>
                    <Grid size={{xs: 11.5, md: 8, lg: 5}}>
                        <Div sx={{ mt: 1.7, mb: 1.7 }}>
                            <Tooltip title='Product'>
                                <ListItemText
                                    primary={
                                        <Tooltip title={'Product'}>
                                            <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                                {item.product?.name || item.product_name}
                                            </Typography>
                                        </Tooltip>
                                    }
                                    secondary={
                                        <Tooltip title={'Description'}>
                                            <Typography component="span" variant="body2" fontSize={14} lineHeight={1.25} mb={0}>
                                                {item.description}
                                            </Typography>
                                        </Tooltip>
                                    }
                                />
                            </Tooltip>
                        </Div>
                    </Grid>
                    <Grid size={{xs: 2, md: 3.5, lg: 1.5}} sx={{ textAlign: 'center' }}>
                        <Div sx={{ mt: 1.7, mb: 1.7 }}>
                            <Tooltip title='Quantity'>
                                <Typography variant="body1">
                                    {`${item?.measurement_unit?.symbol || item.unit || ''} ${item.quantity}`}
                                </Typography>
                            </Tooltip>
                        </Div>
                    </Grid>
                    <Grid size={{xs: 4, md: 4, lg: 2.5}} sx={{ textAlign: 'center' }}>
                        <Div sx={{ mt: 1.7, mb: 1.7 }}>
                            <Tooltip title='Rate'>
                                <Typography variant="body1">
                                    {item.rate?.toLocaleString() || '0'}
                                </Typography>
                            </Tooltip>
                        </Div>
                    </Grid>
                    <Grid size={{xs: 4, md: 4, lg: 2.5}} sx={{ textAlign: 'center' }}>
                        <Div sx={{ mt: 1.7, mb: 1.7 }}>
                            <Tooltip title='Amount'>
                                <Typography variant="body1">
                                    {((item.rate || 0) * (item.quantity || 0)).toLocaleString()}
                                </Typography>
                            </Tooltip>
                        </Div>
                    </Grid>
                </Grid>
            ))}
        </>
    );
}

export default SaleInvoiceItems;