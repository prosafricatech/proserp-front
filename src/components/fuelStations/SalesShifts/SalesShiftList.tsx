import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Station } from '../Stations/StationType';
import { useSalesStation } from '../Stations/StationProvider';
import SalesShiftsListItem from './SalesShiftsListItem';
import salesShiftServices from './salesShift-services';
import SalesShiftsActionTail from './SalesShiftsActionTail';

interface FilterDate {
  from?: string | null;
  to?: string | null;
}

interface QueryOptions {
  queryKey: string;
  queryParams: {
    stationId?: string;
    keyword: string;
    from?: string | null;
    to?: string | null;
  };
  countKey: string;
  dataKey: string;
}

interface RqListProps {
  activeStation: Station;
}

const RqList: React.FC<RqListProps> = ({ activeStation }) => {
  const params = useParams();
  const listRef = useRef<any>(null);
  const [openFilters, setOpenFilters] = useState(false);
  const { authOrganization } = useJumboAuth();
  const [filterDate, setFilterDate] = useState<FilterDate>({});

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'salesShifts',
    queryParams: { 
      stationId: activeStation.id?.toString(), 
      keyword: '' 
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQueryOptions(state => ({
      ...state,
      queryParams: { ...state.queryParams, stationId: activeStation.id?.toString() }
    }));
  }, [activeStation]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id as string },
    }));
  }, [params]);

  const renderSalesShifts = useCallback((salesShift: any) => {
    return <SalesShiftsListItem salesShift={salesShift} />;
  }, []);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  if (!mounted) return null;

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Box}
      service={salesShiftServices.getStationShifts}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[5, 8, 10, 15, 20]}
      renderItem={renderSalesShifts}
      componentElement="div"
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
              {openFilters && (
                <>
                  <Grid size={{ xs: 12, md: 5.5, lg: 3 }}>
                    <DateTimePicker
                      label="From"
                      defaultValue={filterDate.from ? dayjs(filterDate.from) : null}
                      minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        }
                      }}
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          setFilterDate((filters) => ({ ...filters, from: value.toISOString() }));
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 11.5, md: 5.5, lg: 3 }}>
                    <DateTimePicker
                      label="To"
                      defaultValue={filterDate.to ? dayjs(filterDate.to) : null}
                      minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        }
                      }}
                      onChange={(value: Dayjs | null) => {
                        if (value) {
                          setFilterDate((filters) => ({ ...filters, to: value.toISOString() }));
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 0.5, lg: 0.5 }} alignContent={'end'}>
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
                        <EventAvailableOutlined />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 1.5, md: 1, lg: 0.5 }}>
                <Tooltip title={!openFilters ? 'Filter' : 'Clear Filters'}>
                  <IconButton onClick={() => {
                    setOpenFilters(!openFilters);
                    if (openFilters) {
                      setFilterDate({ from: null, to: null });
                      setQueryOptions(state => ({
                        ...state,
                        queryParams: {
                          ...state.queryParams,
                          from: null,
                          to: null,
                        }
                      }));
                    }
                  }}>
                    {!openFilters ? <FilterAltOutlined /> : <FilterAltOffOutlined />}
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 10.5, md: 11, lg: 5 }}>
                <Stack direction="row">
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                  {String(activeStation?.id) !== 'all' &&
                    <SalesShiftsActionTail />
                  }
                </Stack>
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
};

const SalesShiftList: React.FC = () => {
  const { activeStation } = useSalesStation();
  
  return (
    activeStation ? 
      <RqList activeStation={activeStation} /> :
      <Alert severity='info' variant='outlined'>
        Please select a station
      </Alert>
  );
};

export default SalesShiftList;