'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboSearch from '@jumbo/components/JumboSearch';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import rfqServices from './rfq-services';
import RFQListItem from './listItem/RFQListItem';
import RFQActionTail from './RFQActionTail';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';

function RFQs() {
  const params = useParams();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const { authOrganization, checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'rfqs',
    queryParams: {
      id: params.id,
      keyword: getSanitizedSearchKeyword('RFQs', searchParams),
      status: 'all',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: getSanitizedSearchKeyword('RFQs', searchParams),
        id: params.id,
      },
    }));
  }, [params, searchParams]);

  const renderItem = useCallback((rfq) => <RFQListItem rfq={rfq} />, []);

  if (!mounted) return null;
  if (!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
    return <UnsubscribedAccess modules={'Procurement & Supply'} />;
  }
  if (!checkOrganizationPermission([PERMISSIONS.RFQS_READ, PERMISSIONS.RFQS_CREATE, PERMISSIONS.RFQS_EDIT, PERMISSIONS.RFQS_DELETE])) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant="h4" mb={2}>
        RFQs
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={rfqServices.getList}
        primaryKey="id"
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 15, 20, 50, 100]}
        renderItem={renderItem}
        componentElement="div"
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            action={
              <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'} alignItems={'center'}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Status"
                    value={queryOptions.queryParams.status}
                    onChange={(e) => {
                      setQueryOptions((state) => ({
                        ...state,
                        queryParams: { ...state.queryParams, status: e.target.value },
                      }));
                    }}
                  >
                    {['all', 'draft', 'sent', 'closed', 'canceled'].map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <JumboSearch
                    value={queryOptions.queryParams.keyword}
                    onChange={(keyword) => {
                      setQueryOptions((state) => ({
                        ...state,
                        queryParams: { ...state.queryParams, keyword },
                      }));
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 1 }}>
                  <RFQActionTail />
                </Grid>
              </Grid>
            }
          />
        }
      />
    </>
  );
}

export default RFQs;
