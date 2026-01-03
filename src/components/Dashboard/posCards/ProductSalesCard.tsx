'use client'
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import React, { useEffect, useState } from 'react';
import {
    Alert, Autocomplete, Dialog, DialogContent, FormControl, Grid, IconButton, InputLabel, LinearProgress,
    List, ListItem, MenuItem, Select, Stack, TextField, Tooltip, Typography, useMediaQuery
} from '@mui/material';
import PDFContent from '../../pdf/PDFContent';
import { Share } from '@mui/icons-material';
import ProductSalesCardPDF from './ProductSalesCardPDF';
import posServices from '../../pos/pos-services';
import { useDashboardSettings } from '../Dashboard';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { JumboScrollbar } from '@jumbo/components';
import { Organization, User } from '@/types/auth-types';

interface TopOption {
    name: string;
    value: string;
}

interface ProductSalesData {
    name: string;
    unit_symbol: string;
    quantity: number;
    revenue: number;
    cogs: number;
    profit: number;
}

interface TopProductsData {
    params: any;
    costCenters: any;
    user: string;
}

interface DocumentDialogProps {
    open: boolean;
    onClose: () => void;
    popularProducts: ProductSalesData[];
    topProductsData: TopProductsData;
    salesPersonsSelected: string[];
}

const topOptions: TopOption[] = [
    { name: 'Products', value: 'products' },
    { name: 'Categories', value: 'product categories' },
    { name: 'Brands', value: 'brands' }
];

function ProductSalesCard() {
    const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
    const { authUser } = useJumboAuth();
    const user = authUser?.user as User;
    const [salesPersonsSelected, setSalesPersonsSelected] = useState<string[]>([]);

    // Screen handling constants
    const { theme } = useJumboTheme();
    const isDark = theme.type === 'dark';
    const smallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const COLORS = {
        quantity: theme.palette.text.primary,
        revenue: '#2196f3',
        cogs: isDark ? '#EF9A9A' : 'red',
        profit: theme.palette.success.main,
        margin: theme.palette.success.main,
        default: theme.palette.text.primary
    };

    const { chartFilters: { from, to, cost_center_ids, costCenters } } = useDashboardSettings();
    const [params, setParams] = useState({
        from,
        to,
        top: 'products',
        order_by: 'profit',
        cost_center_ids,
        order_direction: 'desc',
        limit: 5
    });

    useEffect(() => {
        setParams(prevParams => ({ ...prevParams, from, to, cost_center_ids }));
    }, [from, to, cost_center_ids]);

    // For Top Products PDF
    const topProductsData: TopProductsData = {
        params: params,
        costCenters,
        user: user?.name,
    };

    const { data: popularProducts = [], isLoading } = useQuery({
        queryKey: ['topProducts', params],
        queryFn: async () => {
            return await posServices.productSales(params);
        }
    });

    const DocumentDialog: React.FC<DocumentDialogProps> = ({ open, onClose, popularProducts, topProductsData, salesPersonsSelected }) => {
        const { authOrganization } = useJumboAuth();
        const organization = authOrganization?.organization;
        return (
            <Dialog
                open={open}
                scroll={(smallScreen || !open) ? 'body' : 'paper'}
                fullWidth
                maxWidth="lg"
                onClose={onClose}
            >
                <DialogContent>
                    <PDFContent
                        fileName='Top Product Sales'
                        document={<ProductSalesCardPDF salesPersonsSelected={salesPersonsSelected} selectedTop={topOptions.find(option => option.value === params.top)?.name || params.top} popularProducts={popularProducts as any} topProductsData={topProductsData} organization={organization as Organization} />}
                    />
                </DialogContent>
            </Dialog>
        );
    };

    const Actions = () => {
        return (
            <Stack direction={'row'} paddingLeft={1} columnGap={1}>
                <Div sx={{ mt: 1 }}>
                    <FormControl fullWidth size='small'>
                        <InputLabel id="top-products-order-by-label">Order By</InputLabel>
                        <Select
                            labelId="top-products-order-by-label"
                            id="products-order-by-label"
                            value={params.order_by}
                            label={'Order By'}
                            onChange={(e) => {
                                setParams(prevParams => ({ ...prevParams, order_by: e.target.value }));
                            }}
                        >
                            <MenuItem value='profit'>Profit</MenuItem>
                            <MenuItem value='revenue'>Sales</MenuItem>
                            <MenuItem value='quantity'>Quantity</MenuItem>
                            <MenuItem value='cogs'>CoGS</MenuItem>
                            <MenuItem value='margin'>Margin</MenuItem>
                        </Select>
                    </FormControl>
                </Div>
                <Div sx={{ mt: 1 }}>
                    <FormControl fullWidth size='small'>
                        <InputLabel id="top-products-order-by-direction-label">Order Direction</InputLabel>
                        <Select
                            labelId="top-products-order-by-direction-label"
                            id="products-order-by-direction"
                            value={params.order_direction}
                            label={'Order Direction'}
                            onChange={(e) => {
                                setParams(prevParams => ({ ...prevParams, order_direction: e.target.value }));
                            }}
                        >
                            <MenuItem value='asc'>Ascending</MenuItem>
                            <MenuItem value='desc'>Descending</MenuItem>
                        </Select>
                    </FormControl>
                </Div>
                <Div sx={{ mt: 1 }}>
                    <FormControl fullWidth size='small'>
                        <InputLabel id="products-limit-label">Limit</InputLabel>
                        <Select
                            labelId="products-limit-label"
                            id="products-limit"
                            value={params.limit}
                            label={'Limit'}
                            onChange={(e) => {
                                setParams(prevParams => ({ ...prevParams, limit: e.target.value }));
                            }}
                        >
                            <MenuItem value='5'>5</MenuItem>
                            <MenuItem value='10'>10</MenuItem>
                            <MenuItem value='20'>20</MenuItem>
                            <MenuItem value='50'>50</MenuItem>
                            <MenuItem value='100'>100</MenuItem>
                        </Select>
                    </FormControl>
                </Div>
                { popularProducts.length > 0 &&
                    <Tooltip title={'Export'}>
                        <IconButton onClick={() => setOpenDocumentDialog(true)}>
                            <Share />
                        </IconButton>
                    </Tooltip>
                }
            </Stack>
        );
    };

    const { data: salesPersons = [], isLoading: isFetchingSalesPeople } = useQuery({
        queryKey: ['salesPerson'],
        queryFn: posServices.getSalesPerson
    });

    return (
        <div>
            <JumboCardQuick
                title={
                    <Grid container spacing={1} width={{ xs: '100%', md: '70%', lg: '100%' }} alignItems="center">
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="h4">Top</Typography>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="top-options-label">-----</InputLabel>
                                    <Select
                                        labelId="top-options-label"
                                        id="top-options"
                                        value={params.top}
                                        label="Top"
                                        onChange={(e) => {
                                            setParams((prevParams) => ({ ...prevParams, top: e.target.value }));
                                        }}
                                        >
                                        {topOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            {
                                isFetchingSalesPeople ? (
                                    <LinearProgress />
                                ) : (
                                <Autocomplete
                                    id="checkboxes-salesPerson"
                                    options={salesPersons}
                                    multiple
                                    disableCloseOnSelect
                                    isOptionEqualToValue={(option, value) => option === value}
                                    getOptionLabel={(option: string) => option}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Sales Person" size="small" fullWidth />
                                    )}
                                    onChange={(e, newValue: string[] | null) => {
                                        if (newValue) {
                                            setParams((prevParams) => ({ ...prevParams, sales_persons: newValue }));
                                            setSalesPersonsSelected(newValue);
                                        } else {
                                            setParams((prevParams) => ({ ...prevParams, sales_persons: [] }));
                                            setSalesPersonsSelected([]);
                                        }
                                    }}
                                />
                            )}
                        </Grid>
                    </Grid>
                }
                sx={{
                    height: !isLoading && popularProducts.length < 1 ? (smallScreen ? 400 : 300) : (smallScreen ? 500 : null)
                }}
                action={
                    !smallScreen && <Actions />
                }
            >
                {smallScreen && <Actions />}
                <Grid container columnSpacing={1} mt={smallScreen ? 2 : 0} mb={1} justifyContent={'center'}>
                    <Grid size={{ xs: 4, md: 3, lg: 1 }}>
                        <Typography sx={{ color: COLORS.default}}>
                            - {topOptions.find(option => option.value === params.top)?.name || params.top}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 4, md: 3, lg: 1 }}>
                        <Typography sx={{ color: COLORS.quantity}}>
                            - Quantity
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 4, md: 3, lg: 1 }}>
                        <Typography sx={{ color: COLORS.revenue}}>
                            - Revenue
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 4, md: 3, lg: 1 }}>
                        <Typography sx={{ color: COLORS.cogs}}>
                            - CoGS
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 4 }}>
                        <Typography sx={{ color: COLORS.profit}}>
                            - Profit & Margin
                        </Typography>
                    </Grid>
                </Grid>
                <JumboScrollbar
                    autoHeight
                    autoHeightMin={!isLoading && popularProducts.length < 1 ? (smallScreen ? 400 : 300) : (smallScreen ? 0 : 173)}
                    autoHide
                    autoHideDuration={200}
                    autoHideTimeout={500}
                >
                    <List>
                        {
                            isLoading ? <LinearProgress /> :
                                popularProducts.length > 0 ? popularProducts.map((product: any, index: number) => (
                                    <React.Fragment key={index}>
                                        <ListItem
                                            sx={{
                                                cursor: 'pointer',
                                                borderTop: 1,
                                                borderColor: 'divider',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                }
                                            }}
                                        >
                                            <Grid container width={'100%'}>
                                                <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
                                                    <Tooltip title={'Product Name'}>
                                                        <Typography sx={{ color: COLORS.default }}>
                                                            {product.name}
                                                        </Typography>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 6, lg: 1.5 }} textAlign={'end'}>
                                                    <Tooltip title={'Quantity Sold'}>
                                                        <Typography sx={{ color: COLORS.quantity }}>
                                                            {`${product.unit_symbol} ${product.quantity.toLocaleString()}`}
                                                        </Typography>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 6, lg: 2 }} textAlign={'end'}>
                                                    <Tooltip title={'Sales'}>
                                                        <Typography sx={{ color: COLORS.revenue }}>
                                                            {product.revenue.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 6, lg: 2 }} textAlign={'end'}>
                                                    <Tooltip title={'CoGS'}>
                                                        <Typography sx={{ color: COLORS.cogs }}>
                                                            {product.cogs.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 6, lg: 2 }} textAlign={'end'}>
                                                    <Tooltip title={'Profit'}>
                                                        <Typography sx={{ color: COLORS.profit }}>
                                                            {product.profit.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                                        </Typography>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 6, lg: 1 }} textAlign={'end'}>
                                                    <Tooltip title={'Margin'}>
                                                        <Typography sx={{ color: COLORS.margin }}>
                                                            {`${(product.profit * 100 / product.revenue).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`}
                                                        </Typography>
                                                    </Tooltip>
                                                </Grid>
                                            </Grid>
                                        </ListItem>
                                    </React.Fragment>
                                )) : <Alert variant={'outlined'} severity={'info'}>No product data was found</Alert>
                        }
                    </List>
                </JumboScrollbar>
            </JumboCardQuick>

            {/* Render the DocumentDialog */}
            <DocumentDialog 
                open={openDocumentDialog} 
                salesPersonsSelected={salesPersonsSelected} 
                topProductsData={topProductsData} 
                popularProducts={popularProducts} 
                onClose={() => setOpenDocumentDialog(false)} 
            />
        </div>
    );
}

export default ProductSalesCard;