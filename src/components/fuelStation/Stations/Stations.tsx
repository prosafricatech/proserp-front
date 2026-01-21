'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import StationActionTail from './StationActionTail';
import stationServices from './station-services';
import ProductsProvider from '@/components/productAndServices/products/ProductsProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import StationListItem from './StationListItem';
import { Station } from './StationType';

const Stations = () => {
  const params = useParams<{ station?: string; id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'station',
    queryParams: { id: params.id, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderStation = React.useCallback((station: Station) => {
    return <StationListItem station={station} />;
  }, []);

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
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.FUEL_STATION)) {
    return <UnsubscribedAccess modules="Fuel Stations" />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.FUEL_STATIONS_READ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <React.Fragment>
    <ProductsProvider>
      <ProductsSelectProvider>
       <LedgerSelectProvider>
        <Typography variant="h4" mb={2}>
          Fuel Stations
        </Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={stationServices.getList}
          primaryKey="id"
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          renderItem={renderStation}
          componentElement="div"
          wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
          toolbar={
            <JumboListToolbar
              hideItemsPerPage={true}
              actionTail={
                <Stack direction="row">
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                  <StationActionTail />
                </Stack>
              }
            />
          }
        />
      </LedgerSelectProvider>
       </ProductsSelectProvider>
      </ProductsProvider>
    </React.Fragment>
  );
};

export default Stations;