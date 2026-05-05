'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import DeductionTypeActionTail from './DeductionTypeActionTail';
import { DeductionType } from './DeductionType';
import DeductionTypesListItem from './DeductionTypesListItem';

const DeductionTypes = () => {
  const params = useParams<{ keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'deductionTypes',
    queryParams: { keyword: params.keyword || '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderDeductionTypes = React.useCallback(
    (deductionType: DeductionType) => {
      return <DeductionTypesListItem deductionType={deductionType} />;
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
      <Typography variant={'h4'} mb={2}>
        Deduction Types
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getDeductionTypesList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={50}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderDeductionTypes}
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
                <DeductionTypeActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default DeductionTypes;
