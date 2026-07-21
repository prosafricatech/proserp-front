import { LeaveAllocationType } from '@/components/humanResources/employees/profile/leaveAllocations/LeaveAllocationType';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Autocomplete, Card, Grid, TextField } from '@mui/material';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import MyHrLeaveBalancesListItem from './MyHrLeaveBalancesListItem';

const YEAR_OPTIONS: Array<any> = [];
let nextYear = dayjs().year() + 1;
[1, 2, 3, 4].map(() => YEAR_OPTIONS.push(String(nextYear--)));

const MyHrLeaveBalances = () => {
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [year, setYear] = useState<string>('');
  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'myHrleaveBalances',
    queryParams: {
      year: year,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLeaveBalances = React.useCallback(
    (leaveAllocation: LeaveAllocationType) => {
      return <MyHrLeaveBalancesListItem leaveAllocation={leaveAllocation} />;
    },
    []
  );

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: searchParams?.get('search') || '',
      },
    }));
    setMounted(true);
  }, [searchParams, year]);

  if (!mounted) return null;
  return (
    <>
      <Grid container spacing={2} mb={2} mt={2} justifyContent='center'>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            size='small'
            options={YEAR_OPTIONS}
            value={year}
            isOptionEqualToValue={(option, value) => option === value}
            getOptionLabel={(option) => option}
            onChange={(_, newValue) => {
              newValue ? setYear(newValue) : setYear('');
              setQueryOptions((state) => ({
                ...state,
                queryParams: {
                  ...state.queryParams,
                  year: newValue ?? '',
                },
              }));
            }}
            renderInput={(inputParams) => (
              <TextField {...inputParams} label='Select Year' fullWidth />
            )}
          />
        </Grid>
      </Grid>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.myHrLeaveBalances}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderLeaveBalances}
        componentElement='div'
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        // toolbar={
        //   <JumboListToolbar
        //     hideItemsPerPage={true}
        //     actionTail={
        //       <Stack direction='row'>
        //         <JumboSearch
        //           onChange={handleOnChange}
        //           value={queryOptions.queryParams.keyword}
        //         />
        //       </Stack>
        //     }
        //   ></JumboListToolbar>
        // }
      />
    </>
  );
};

export default MyHrLeaveBalances;
