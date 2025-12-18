"use client";

import React, { createContext, useState } from 'react';
import { Alert, Box, Grid, IconButton, Tooltip } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import fuelStationServices from '../fuelStationServices';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useParams } from 'next/navigation';
import SalesShiftsActionTail from './SalesShiftsActionTail';
import SalesShiftsListItem from './SalesShiftsListItem';
import StationShiftsStatusSelector from './StationShiftsStatusSelector';
import ShiftTeamsSelector from './ShiftTeamsSelector';

export const StationFormContext = createContext({});

const SalesShifts = ({activeStation}) => {
  const [openFilters, setOpenFilters] = useState(false)
  const params = useParams();
  const listRef = React.useRef();
  const {authOrganization} = useJumboAuth();
  const [filterDate, setFilterDate] = useState({})

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'closedShifts',
    queryParams: { id: params.id, shift_team_id: 'null', status: 'All', keyword: '', stationId: !!activeStation?.id && activeStation?.id},
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryKey: 'closedShifts',
      queryParams: { ...state.queryParams, stationId: !!activeStation?.id && activeStation.id },
    }));
  }, [activeStation]);

  const salesShifts  = React.useCallback((ClosedShift) => {
    return <SalesShiftsListItem ClosedShift={ClosedShift}/>;
  }, []);

  const handleOnTeamChange = React.useCallback((shift_team_id) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        shift_team_id: shift_team_id
      }
    }));
  }, [queryOptions.queryParams.shift_team_id]);

  const handleOnStatusChange = React.useCallback((status) => {
    setQueryOptions(state => ({
      ...state,
      queryParams: {
          ...state.queryParams,
          status: status
      }
    }));
  }, [queryOptions.queryParams.status]);

  const handleOnChange = React.useCallback(
    (keyword) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword: keyword,
        },
      }));
    },
    []
  );

  return (
    <LedgerSelectProvider>
      <StakeholderSelectProvider>
        <ProductsSelectProvider>
          <StationFormContext.Provider value={{activeStation}}>
            {
              activeStation ? 
                <JumboRqList
                  ref={listRef}
                  wrapperComponent={Box}
                  service={fuelStationServices.getStationShifts}
                  primaryKey="id"
                  queryOptions={queryOptions}
                  itemsPerPage={10}
                  itemsPerPageOptions={[5,8,10,15,20,30,50]}
                  renderItem={salesShifts}
                  componentElement="div"
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
                              <Grid size={{xs: 12, md: 5.5 , lg: 3}}>
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
                             <Grid size={{xs: 10.5, md: 5.5 , lg: 3}}>
                                <DateTimePicker
                                  label="To"
                                  defaultValue={filterDate.to ? dayjs(filterDate.to) : null}
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
                              <Grid size={{xs: 1.5, md: 1, lg: 0.5}} alignContent={'end'}>
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
                         <Grid size={{ xs: 12, md: 12, lg: openFilters ? 2.5 : 3 }} alignItems="center">
                          <StationShiftsStatusSelector
                            value={queryOptions.queryParams.status}
                            onChange={handleOnStatusChange}
                          />
                        </Grid>
                        <Grid size={{ xs: 10.5, md: 12, lg: openFilters ? 2.5 : 3 }} alignItems="center">
                          <ShiftTeamsSelector
                            value={queryOptions.queryParams.shift_team_id}
                            onChange={handleOnTeamChange}
                          />
                        </Grid>
                       <Grid size={{xs: 1.5, md: 0.5}}>
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
                        <Grid size={{xs: 11.5, md: 10 , lg: 5}}>
                          <JumboSearch
                            onChange={handleOnChange}
                            value={queryOptions.queryParams.keyword}
                          />
                        </Grid>
                       <Grid size={{xs: 0.5, md: 0.5}}>
                          <SalesShiftsActionTail /> 
                        </Grid>
                      </Grid>
                    }
                    >
                  </JumboListToolbar>
                  }
                />
                :
              <Alert variant='outlined' severity='info'>Please select a Station</Alert>
            } 
          </StationFormContext.Provider>
        </ProductsSelectProvider>
      </StakeholderSelectProvider>
    </LedgerSelectProvider>
  );
};

export default SalesShifts;
