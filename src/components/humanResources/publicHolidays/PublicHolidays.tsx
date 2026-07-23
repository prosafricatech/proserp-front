'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import {
  Autocomplete,
  Card,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PublicHolidaysType } from './PublicHOlidaysType';
import PublicHolidaysActionTail from './PublicHolidaysActionTail';
import PublicHolidaysListItem from './PublicHolidaysListItem';

const YEAR_OPTIONS: Array<any> = [];
let nextYear = dayjs().year() + 1;
[1, 2, 3, 4].map(() => YEAR_OPTIONS.push(String(nextYear--)));

const PublicHolidays = () => {
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [year, setYear] = useState<string>('');

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'publicHolidays',
    queryParams: { keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderPublicHolidays = useCallback(
    (publicHoliday: PublicHolidaysType) => {
      return <PublicHolidaysListItem publicHoliday={publicHoliday} />;
    },
    []
  );

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Public Holidays
      </Typography>
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
        service={humanResourcesServices.publicHolidaysLIst}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderPublicHolidays}
        componentElement='div'
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            actionTail={
              <Stack direction='row' justifyContent={'end'}>
                <PublicHolidaysActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default PublicHolidays;
