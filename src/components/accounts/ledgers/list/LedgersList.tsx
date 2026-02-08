'use client';

import JumboListToolbar from "@jumbo/components/JumboList/components/JumboListToolbar";
import JumboRqList from "@jumbo/components/JumboReactQuery/JumboRqList";
import JumboSearch from "@jumbo/components/JumboSearch";
import { Card, Grid } from "@mui/material";
import React, { useRef, useEffect, useCallback, useState } from "react";
import ledgerServices from "../ledger-services";
import LedgerSelectProvider from "../forms/LedgerSelectProvider";
import LedgerActionTail from "./LedgerActionTail";
import LedgerListItem from "./LedgerListItem";
import { useParams } from "next/navigation";

interface LedgerItem {
  id: number;
  name: string;
  alias: string | null;
  ledger_group: {
    name: string;
    nature: {
      name: string;
    };
  };
  balance?: {
    amount: number;
    side: string;
  };
}

interface QueryParams {
  category?: string;
  id?: string;
  keyword: string;
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}

interface JumboRqListRef {
  refresh: () => Promise<void>;
}

const LedgersList = () => {
  const params = useParams<{ category?: string; id?: string; keyword?: string }>();
  const listRef = useRef<JumboRqListRef>(null);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'ledgers-list',
    queryParams: {
      category: params?.category,
      id: params?.id,
      keyword: params?.keyword || '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        category: params?.category,
        id: params?.id,
        keyword: params?.keyword || '',
      },
    }));
  }, [params]);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions(prev => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        keyword,
      },
    }));
  }, []);

  const renderLedgerItem = useCallback((ledgerItem: LedgerItem) => {
    return <LedgerListItem ledger={ledgerItem} />;
  }, []);

  return (
    <LedgerSelectProvider>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        queryOptions={queryOptions}
        primaryKey="id"
        service={ledgerServices.getLedgers}
        renderItem={renderLedgerItem}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 15, 30, 60]}
        componentElement="div"
        wrapperSx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            actionTail={
              <Grid container columnSpacing={1} direction="row">
                <Grid size={{xs: 9.5, lg: 10.5}}>
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Grid>
                <Grid size={{xs: 2.5, lg: 1.5}}>
                  <LedgerActionTail />
                </Grid>
              </Grid>
            }
          />
        }
      />
    </LedgerSelectProvider>
  );
};

export default LedgersList;
