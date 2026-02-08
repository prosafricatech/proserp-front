'use client'

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import React, { useState } from 'react'
import TransferListItem from './listItem/InventoryTransferListItem';
import InventoryTransferTypeSelector from './InventoryTransferTypeSelector';
import InventoryTransferDirectionSelector from './InventoryTransferDirectionSelector';
import InventoryTransferActionTail from './InventoryTransferActionTail';
import inventoryTransferServices from './inventoryTransfer-services';
import { useStoreProfile } from '../StoreProfileProvider';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

function Transfer() {
    const params = useParams();
    const listRef = React.useRef();
    const {activeStore:store} = useStoreProfile();
    const [openFilters, setOpenFilters] = useState(false);
    const {authOrganization} = useJumboAuth();
    const [filterDate, setFilterDate] = useState({})

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: 'inventoryTransfers',
        queryParams: { store_id: params.id, keyword: '',type: 'external' },
        countKey: 'total',
        dataKey: 'data',
    });

      React.useEffect(() => {
        setQueryOptions((state) => ({
          ...state,
          queryParams: {...state.queryParams, store_id: store?.id ? store.id : params.id},
        }));
      }, [params,store]);

    const renderTransfers = React.useCallback((transfer) => {
        return <TransferListItem transfer={transfer} type={queryOptions.queryParams.type}/>
    });
    
    const handleOnTypeChange = React.useCallback((type) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                type: type
            }
        }));
    }, [queryOptions.queryParams.type]);

    const handleOnDirectionChange = React.useCallback((direction) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                direction: direction,
            }
        }))
    }, [queryOptions.queryParams.direction]);

    const handleOnKeywordChange = React.useCallback((keyword) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            }
        }))
    }, []);

return (
    <LedgerSelectProvider>
        <JumboRqList
            ref={listRef}
            wrapperComponent={Box}
            service={inventoryTransferServices.getList}
            primaryKey={"id"}
            queryOptions={queryOptions}
            itemsPerPage={10}
            itemsPerPageOptions={[10, 15, 20,50,100]}
            renderItem={renderTransfers}
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
                    action={
                        <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
                            <Grid size={{xs: 12, md:queryOptions.queryParams.type === 'cost center change' ? 12 : 5.5,lg: 6}}>
                                <InventoryTransferTypeSelector
                                    value={queryOptions.queryParams.type}
                                    onChange={handleOnTypeChange}
                                />
                            </Grid>
                            {
                                queryOptions.queryParams.type !== 'cost center change' &&
                                <Grid size={{xs: 12, md: 6.5,lg: 6}}>
                                    <InventoryTransferDirectionSelector
                                        value={queryOptions.queryParams.direction}
                                        onChange={handleOnDirectionChange}
                                    />
                                </Grid>
                            }
                            { 
                            openFilters &&
                                <>
                                    <Grid size={{xs: 12, md: 5.5,lg: 3}}>
                                        <DateTimePicker
                                        label="From"
                                        defaultValue={filterDate.from ? dayjs(filterDate.from) : null}
                                        minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                                        slotProps={{
                                            textField : {
                                            size: 'small',
                                            fullWidth: true,
                                            }
                                        }}
                                        onChange={(value) => {
                                            setFilterDate((filters) => { return {...filters,from: value.toISOString()}; });
                                        }}
                                        />
                                    </Grid>
                                    <Grid size={{xs: 12, md: 5.5,lg: 3}}>
                                        <DateTimePicker
                                        label="To"
                                        defaultValue={ filterDate.to ? dayjs(filterDate.to) : null}
                                        minDate={dayjs(filterDate.from)}
                                        slotProps={{
                                            textField : {
                                            size: 'small',
                                            fullWidth: true,
                                            }
                                        }}
                                        onChange={(value) => {
                                            setFilterDate((filters) => { return {...filters,to: value.toISOString()}; });
                                        }}
                                        />
                                    </Grid>
                                    <Grid size={{xs: 1.5, md: 1,lg: 0.5}} alignContent={'end'}>
                                        <Tooltip title="Filter Dates">
                                            <IconButton onClick={() => {
                                                setQueryOptions(state => ({
                                                    ...state,
                                                    queryParams: {
                                                        ...state.queryParams,
                                                        from: filterDate.from,
                                                        to: filterDate.to
                                                    }
                                                }));
                                            }}>
                                                <EventAvailableOutlined/>
                                            </IconButton> 
                                        </Tooltip>   
                                    </Grid>
                                </>
                            }
                            <Grid size={{xs: 1.5, md: 1,lg: 0.5}}>
                                <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                                    <IconButton onClick={() => {
                                        setOpenFilters(!openFilters);
                                        openFilters && setFilterDate({from: null, to: null});
                                        openFilters &&
                                            setQueryOptions(state => ({
                                                ...state,
                                                queryParams: {
                                                ...state.queryParams,
                                                from: null,
                                                to: null,
                                                }
                                            }));
                                    }}>
                                        {!openFilters ? <FilterAltOutlined/> : <FilterAltOffOutlined/>}
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            <Grid size={{xs: openFilters ? 9 : 10.5, md: 11,lg: 5}}>
                                <Stack direction={'row'}>
                                    <JumboSearch
                                        onChange={handleOnKeywordChange}
                                        value={queryOptions.queryParams.keyword}
                                    />
                                    {queryOptions.queryParams.type !== 'all' && <InventoryTransferActionTail type={queryOptions.queryParams.type} /> } 
                                </Stack>
                            </Grid>
                        </Grid>
                    }
                >
            </JumboListToolbar>
            }
        />
    </LedgerSelectProvider>
);
}

export default Transfer;