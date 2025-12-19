'use client';

import React from 'react';
import { Card, Stack, Grid, IconButton, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { EventAvailableOutlined, FilterAltOffOutlined, FilterAltOutlined } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import { useParams } from 'next/navigation';
import { useProjectProfile } from '../ProjectProfileProvider';
import projectsServices from '../../project-services';
import UpdatesListItem from './UpdatesListItem';
import UpdatesActionTail from './UpdatesActionTail';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';

const Updates = () => {
  const params = useParams();
  const { project } = useProjectProfile();
  const listRef = React.useRef();

  // State for date filters
  const [openFilters, setOpenFilters] = React.useState(true);
  const [filterDate, setFilterDate] = React.useState({
    from: null,
    to: null
  });

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'projectUpdates',
    queryParams: { 
      id: params.id, 
      keyword: '', 
      project_id: project?.id,
      from: null,
      to: null
    },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderUpdate = React.useCallback((update) => {
    return <UpdatesListItem update={update} />;
  }, []);

  const handleOnChange = React.useCallback((keyword) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword,
      },
    }));
  }, []);

  // Date filter handlers
  const handleDateChange = React.useCallback((date) => {
    setFilterDate(prev => ({
      ...prev,
      [field]: date?.toISOString() || null
    }));
  }, []);

  const applyDateFilters = React.useCallback(() => {
    setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        from: filterDate.from,
        to: filterDate.to
      }
    }));
    setOpenFilters(false); // Close filters after applying
  }, [filterDate.from, filterDate.to]);

  const resetFilters = React.useCallback(() => {
    setOpenFilters(false);
    setFilterDate({ from: null, to: null });
    setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        from: null,
        to: null
      }
    }));
  }, []);

  return (
    <ProductsSelectProvider>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={projectsServices.projectUpdatesList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 10, 15, 20]}
        renderItem={renderUpdate}
        componentElement="div"
        bulkActions={null}
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            action={
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
                {/* Date Filters Section */}
                {openFilters && (
                  <Grid size={6}>
                    <Grid container spacing={1} alignItems={'center'}>
                      <Grid size={{xs: 12, md: 5}}>
                        <DateTimePicker
                          label="From Date"
                          value={filterDate.from ? dayjs(filterDate.from) : null}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            }
                          }}
                          onChange={(value) => handleDateChange(value, 'from')}
                        />
                      </Grid>
                      <Grid size={{xs: 12, md: 5}}>
                        <DateTimePicker
                          label="To Date"
                          value={filterDate.to ? dayjs(filterDate.to) : null}
                          minDate={filterDate.from ? dayjs(filterDate.from) : undefined}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            }
                          }}
                          onChange={(value) => handleDateChange(value, 'to')}
                        />
                      </Grid>
                      <Grid size={{xs: 12, md: 2}} textAlign={'center'}>
                        <Tooltip title="Apply Date Filters">
                          <IconButton onClick={applyDateFilters} size="small">
                            <EventAvailableOutlined/>
                          </IconButton> 
                        </Tooltip>   
                      </Grid>
                    </Grid>
                  </Grid>
                )}
                
                {/* Main Actions Row */}
                <Grid size={{xs: 1}}>
                  <Tooltip title={!openFilters ? 'Show Filters' : 'Clear and Hide Filters'}>
                    <IconButton 
                      size='small' 
                      onClick={!openFilters ? () => setOpenFilters(true) : resetFilters}
                    >
                      {!openFilters ? <FilterAltOutlined/> : <FilterAltOffOutlined/>}
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                <Grid size={{xs: 10, md: !openFilters ? 5 : 4}}>
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Grid>
                
                <Grid size={{xs: 1, md: 1}}>
                  <UpdatesActionTail />
                </Grid>
              </Grid>
            }
          />
        }
      />
    </ProductsSelectProvider>
  );
};

export default Updates;