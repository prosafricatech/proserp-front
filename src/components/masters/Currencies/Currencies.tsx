'use client';

import React, { useRef } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import CurrencyListItem from './CurrencyListItem';
import currencyServices from './currency-services';
import CurrencyActionTail from './CurrencyActionTail';
import CurrencySelectProvider from './CurrencySelectProvider';
import { useParams } from 'next/navigation';
import { Currency } from './CurrencyType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const Currencies = () => {
  const params = useParams<{ category?: string; id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);
  const dictionary =useDictionary()

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'currencies',
    queryParams: { id: params.id, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderCurrency = React.useCallback((currency: Currency) => {
    return <CurrencyListItem currency={currency} />;
  }, []);

  const handleOnChange = React.useCallback(
    (keyword: string) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword: keyword,
        },
      }));
    },
    []
  );

  if (!mounted) return null;

  return (
    <CurrencySelectProvider>
      <Typography variant={'h4'} mb={2}>{dictionary.currencies.form.labels.listHeader}</Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={currencyServices.getList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderCurrency}
        componentElement="div"
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar hideItemsPerPage={true} actionTail={
            <Stack direction="row">
              <JumboSearch
                onChange={handleOnChange}
                value={queryOptions.queryParams.keyword}
              />
              <CurrencyActionTail />
            </Stack>
        }/>
        }
      />
    </CurrencySelectProvider>
  );
};

export default Currencies;
