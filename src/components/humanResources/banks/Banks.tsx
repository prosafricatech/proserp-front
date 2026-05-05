'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import BankActionTail from './BankActionTail';
import BanksListItem from './BanksListItem';
import { BankType } from './BankType';

const Banks = () => {
  const params = useParams<{ keyword?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'banks',
    queryParams: { keyword: params.keyword || '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderBanks = React.useCallback((bank: BankType) => {
    return <BanksListItem bank={bank} />;
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

  if (!mounted) return null;

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Banks
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getBanksList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={50}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderBanks}
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
                <BankActionTail />
              </Stack>
            }
          />
        }
      />
    </>
  );
};

export default Banks;
