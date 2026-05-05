'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import CostCenterListItem from './CostCenterListItem';
import costCenterServices from './cost-center-services';
import { useParams } from 'next/navigation';
import CostCenterActionTail from './CostCenterActionTail';
import { CostCenter } from './CostCenterType';

interface QueryParams {
  id?: string;
  keyword: string;
}

interface QueryOptions {
  queryKey: string;
  queryParams: QueryParams;
  countKey: string;
  dataKey: string;
}

const CostCenters = () => {
  const params = useParams<{ category?: string; id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: 'costCenters',
    queryParams: {
      id: params.id,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        id: params.id,
      },
    }));
  }, [params.id]);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((prev) => ({
      ...prev,
      queryParams: {
        ...prev.queryParams,
        keyword,
      },
    }));
  }, []);

  const renderCostCenter = useCallback((costCenter: CostCenter) => {
    return <CostCenterListItem costCenter={costCenter} />;
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Typography variant="h4" mb={2}>
        Cost Centers
      </Typography>

      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={costCenterServices.getList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderCostCenter}
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage
            actionTail={
              <Stack direction="row" spacing={1}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
                <CostCenterActionTail />
              </Stack>
            }
          />
        }
      />
    </>
  );
};

export default CostCenters;
