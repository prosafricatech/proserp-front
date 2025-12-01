'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import OutletListItem from './OutletListItem';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import type { Outlet } from './OutletType';
import OutletActionTail from './OutletActionTail';
import outletServices from './outlet-services';

  const Outlet = () => {
    const params = useParams<{ category?: string; id?: string; keyword?: string }>();
    const listRef = useRef<any>(null);
    const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
    const [mounted, setMounted] = useState(false);

    const [queryOptions, setQueryOptions] = useState({
      queryKey: 'Outlets',
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

    const renderOutlet = React.useCallback((outlet: Outlet) => {
      return <OutletListItem outlet={outlet} />;
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

    if (!organizationHasSubscribed(MODULES.POINT_OF_SALE)) {
      return <UnsubscribedAccess modules="Point of Sale (POS)" />;
    }

    if (!checkOrganizationPermission([PERMISSIONS.OUTLETS_READ])) {
      return <UnauthorizedAccess />;
    }

  return (
      <React.Fragment>
        <LedgerSelectProvider>
          <Typography variant="h4" mb={2}>
            Sales Outlets
          </Typography>
            <JumboRqList
              ref={listRef}
              wrapperComponent={Card}
              service={outletServices.getList}
              primaryKey="id"
              queryOptions={queryOptions}
              itemsPerPage={10}
              itemsPerPageOptions={[5, 10, 15, 20]}
              renderItem={renderOutlet}
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
                      <OutletActionTail />
                    </Stack>
                  }
                />
              }
            />
        </LedgerSelectProvider>
      </React.Fragment> 
  );
};

export default Outlet;
