'use client';

import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { AllowanceType } from './AllowanceType';
import AllowanceTypeActionTail from './AllowanceTypeActionTail';
import AllowanceTypesListItem from './AllowanceTypesListItem';

const AllowanceTypes = () => {
  const params = useParams<{ keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'allowanceTypes',
    queryParams: { keyword: params.keyword || '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderAllowanceTypes = React.useCallback(
    (allowanceType: AllowanceType) => {
      return <AllowanceTypesListItem allowanceType={allowanceType} />;
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
  }, [searchParams]);

  if (!mounted) return null;

  return (
    <>
      <LedgerSelectProvider>
        <Typography variant={'h4'} mb={2}>
          Allowance Types
        </Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={humanResourcesServices.getAllowanceTypesList}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={50}
          itemsPerPageOptions={[10, 20, 30, 50]}
          renderItem={renderAllowanceTypes}
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
                <Stack direction='row'>
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                  <AllowanceTypeActionTail />
                </Stack>
              }
            ></JumboListToolbar>
          }
        />
      </LedgerSelectProvider>
    </>
  );
};

export default AllowanceTypes;
