'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from '../payrollPeriods/PayrollPeriodType';
import PayrollRunsListItem from './PayrollRunsListItem';
import { PayrollRunType } from './PayrollRunType';

const PayrollRuns = () => {
  const params = useParams<{ keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] =
    useState<PayrollPeriodType | null>(null);

  const { data: payrollPeriodsResponse, isFetching: isPayrollPeriodsFetching } =
    useQuery({
      queryKey: ['payrollPeriodsForRunsSelector'],
      queryFn: () =>
        humanResourcesServices.getPayrollPeriodsList({ page: 1, limit: 200 }),
    });

  const payrollPeriods: PayrollPeriodType[] =
    payrollPeriodsResponse?.data || [];

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'payrollRuns',
    queryParams: {
      keyword: params.keyword || '',
      payroll_period_id: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderPayrollRuns = React.useCallback((payrollRun: PayrollRunType) => {
    return <PayrollRunsListItem payrollRun={payrollRun} />;
  }, []);

  const handleOnChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, keyword },
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
  }, [searchParams]);

  useEffect(() => {
    const initialPayrollPeriodId = searchParams?.get('payroll_period_id');
    if (!initialPayrollPeriodId || selectedPayrollPeriod || !payrollPeriods.length) {
      return;
    }

    const foundPayrollPeriod = payrollPeriods.find(
      (period) => String(period.id) === String(initialPayrollPeriodId)
    );

    if (foundPayrollPeriod) {
      setSelectedPayrollPeriod(foundPayrollPeriod);
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          payroll_period_id: String(foundPayrollPeriod.id),
        },
      }));
    }
  }, [payrollPeriods, searchParams, selectedPayrollPeriod]);

  if (!mounted) return null;

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Payroll Runs
      </Typography>
      <Grid container spacing={2} mb={2} mt={2} justifyContent='center'>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            size='small'
            loading={isPayrollPeriodsFetching}
            options={payrollPeriods}
            value={selectedPayrollPeriod}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            getOptionLabel={(option) =>
              `${option.year} - ${option.month}${
                option.status ? ` (${option.status})` : ''
              }`
            }
            onChange={(_, newValue) => {
              setSelectedPayrollPeriod(newValue);
              setQueryOptions((state) => ({
                ...state,
                queryParams: {
                  ...state.queryParams,
                  payroll_period_id: newValue?.id
                    ? String(newValue.id)
                    : '',
                },
              }));
            }}
            renderInput={(inputParams) => (
              <TextField {...inputParams} label='Payroll Period' fullWidth />
            )}
          />
        </Grid>
      </Grid>

      {selectedPayrollPeriod ? (
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={humanResourcesServices.getPayrollRunsList}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={20}
          itemsPerPageOptions={[10, 20, 30, 50]}
          renderItem={renderPayrollRuns}
          componentElement='div'
          wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          toolbar={
            <JumboListToolbar
              hideItemsPerPage={true}
              actionTail={
                <Stack direction='row'>
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Stack>
              }
            />
          }
        />
      ) : (
        <Box width='100%'>
          <Alert variant='outlined' severity='info' sx={{ width: '100%' }}>
            Please select a Payroll Period
          </Alert>
        </Box>
      )}
    </>
  );
};

export default PayrollRuns;
