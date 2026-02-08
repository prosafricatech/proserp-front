'use client'
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Box, Dialog, IconButton, Stack, Tooltip, useMediaQuery } from '@mui/material';
import React from 'react'
import storeServices from '../../store-services';
import { useStoreProfile } from '../StoreProfileProvider';
import StockListItem from './StockListItem';
import LowStockThresholds from './lowStockThresholds/LowStockThresholds';
import { PrintOutlined } from '@mui/icons-material';
import StockReport from './StockReport';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

function StoreStock() {
    const [openDialog, setOpenDialog] = useState(false);
    const params = useParams();
    const listRef = React.useRef();
    const {activeStore:store} = useStoreProfile();
    const {theme} = useJumboTheme();
    const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: "storeStock",
        queryParams: {id: params.id, keyword : ''},
        countKey: "total",
        dataKey: "data",
    });

    React.useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {...state.queryParams, id: store?.id ? store.id : params.id}
        }))
    }, [params,store]);

    const renderProductStock = React.useCallback((productStock) => {
        return <StockListItem productStock={productStock} />
    });

    const handleOnChange = React.useCallback((keyword) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            }
        }))
    }, []);
    
return (
    <JumboRqList
        ref={listRef}
        wrapperComponent={Box}
        service={storeServices.getStockList}
        primaryKey={"id"}
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 15, 20,50,100]}
        renderItem={renderProductStock}
        componentElement={"div"}
        bulkActions={null}
        wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
        }}
        toolbar={
            <JumboListToolbar
                hideItemsPerPage={true}
                actionTail={
                <Stack direction={'row'}>
                    <JumboSearch
                        onChange={handleOnChange}
                        value={queryOptions.queryParams.keyword}
                    />
                    <LowStockThresholds/>
                    <React.Fragment>
                        <Tooltip title='Stock Report'>
                            <IconButton onClick={() => setOpenDialog(true)}>
                                <PrintOutlined/>
                            </IconButton>
                        </Tooltip>
                        <Dialog fullWidth open={openDialog} scroll={'paper'} maxWidth='md' fullScreen={belowLargeScreen}>
                            <StockReport setOpenDialog={setOpenDialog}/>
                        </Dialog>
                    </React.Fragment>
                </Stack>
            }
            >
            </JumboListToolbar>
        }
    />
);
}

export default StoreStock