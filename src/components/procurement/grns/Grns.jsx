'use client'

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import React, { useState } from 'react'
import GrnsListItem from './GrnsListItem';
import grnServices from './grn-services';
import { useStoreProfile } from '../stores/[store_id]/StoreProfileProvider';
import CurrencySelectProvider from '../../masters/Currencies/CurrencySelectProvider';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

function Grns() {
    const params = useParams();
    const listRef = React.useRef();
    const {activeStore:store} = useStoreProfile();
    const [openFilters, setOpenFilters] = useState(false);
    const {authOrganization} = useJumboAuth();
    const [filterDate, setFilterDate] = useState({})

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: 'Grns',
        queryParams: { store_id: params.id, keyword: '' },
        countKey: 'total',
        dataKey: 'data',
      });

      React.useEffect(() => {
        setQueryOptions((state) => ({
          ...state,
          queryParams: {...state.queryParams, store_id: store?.id ? store.id : params.id},
        }));
      }, [params,store]);

    const renderGrns = React.useCallback((grn) => {
        return <GrnsListItem grn={grn} />
    });

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
    <CurrencySelectProvider>
        <JumboRqList
            ref={listRef}
            wrapperComponent={Box}
            service={grnServices.getGrnsList}
            primaryKey={"id"}
            queryOptions={queryOptions}
            itemsPerPage={10}
            itemsPerPageOptions={[8,10, 15, 20]}
            renderItem={renderGrns}
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
                            { 
                                openFilters &&
                                <>
                                    <Grid item xs={12} md={5.5} lg={3}>
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
                                    <Grid item xs={11.5} md={5.5} lg={3}>
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
                                    <Grid item xs={0.5} md={1} lg={0.5} alignContent={'end'}>
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
                            <Grid item xs={1.5} md={1} lg={0.5}>
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
                            <Grid item xs={10.5} md={11} lg={5}>
                                <Stack direction={'row'} spacing={0.2}>       
                                    <JumboSearch
                                        onChange={handleOnKeywordChange}
                                        value={queryOptions.queryParams.keyword}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    }
                >
            </JumboListToolbar>
            }
        />
    </CurrencySelectProvider>
);
}

export default Grns;