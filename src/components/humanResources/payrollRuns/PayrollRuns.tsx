'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import PayrollRunsListItem from './PayrollRunsListItem';
import { PayrollRunType } from './PayrollRunType';

const PayrollRuns = () => {
  const params = useParams<{ keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'payrollRuns',
    queryParams: {
      keyword: params.keyword || '',
      payroll_period_id: searchParams?.get('payroll_period_id') || '',
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
        payroll_period_id: searchParams?.get('payroll_period_id') || '',
      },
    }));
    setMounted(true);
  }, [searchParams]);

  if (!mounted) return null;

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Payroll Runs
      </Typography>
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
    </>
  );
};

export default PayrollRuns;
