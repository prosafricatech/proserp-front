// payrollPeriods/PayrollPeriods.tsx
'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import PayrollPeriodActionTail from './PayrollPeriodActionTail';
import PayrollPeriodsListItem from './PayrollPeriodsListItem';
import { PayrollPeriodType } from './PayrollPeriodType';
import LedgerGroupProvider from '@/components/accounts/ledgerGroups/LedgerGroupProvider';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

const PayrollPeriods = () => {
  const params = useParams<{ keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'payrollPeriods',
    queryParams: {
      keyword: params.keyword || '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderPayrollPeriod = React.useCallback((payrollPeriod: PayrollPeriodType) => {
    return <PayrollPeriodsListItem payrollPeriod={payrollPeriod} />;
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
        keyword: getSanitizedSearchKeyword('Payroll Periods', searchParams),
      },
    }));
    setMounted(true);
  }, [searchParams]);

  if (!mounted) return null;

  return (
    <LedgerSelectProvider>
      <LedgerGroupProvider>
        <Typography variant={'h4'} mb={2}>
          Payroll Periods
        </Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={humanResourcesServices.getPayrollPeriodsList}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={20}
          itemsPerPageOptions={[10, 20, 30, 50]}
          renderItem={renderPayrollPeriod}
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
                  <PayrollPeriodActionTail />
                </Stack>
              }
            />
          }
        />
      </LedgerGroupProvider>
    </LedgerSelectProvider>
  );
};

export default PayrollPeriods;