'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RFQListItem from './listItem/RFQListItem';
import rfqServices from './rfq-services';
import { STATUS_OPTIONS } from './rfq-types';
import RFQActionTail from './RFQActionTail';

function RFQs() {
  const params = useParams();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const {
    authOrganization,
    checkOrganizationPermission,
    organizationHasSubscribed,
  } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'rfqs',
    queryParams: {
      id: params.id,
      keyword: getSanitizedSearchKeyword('RFQs', searchParams),
      status: '',
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

  const handleOnKeywordChange = React.useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  const renderItem = useCallback((rfq: any) => <RFQListItem rfq={rfq} />, []);

  if (!mounted) return null;
  if (!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
    return <UnsubscribedAccess modules={'Procurement & Supply'} />;
  }
  if (
    !checkOrganizationPermission([
      PERMISSIONS.RFQS_READ,
      PERMISSIONS.RFQS_CREATE,
      PERMISSIONS.RFQS_EDIT,
      PERMISSIONS.RFQS_DELETE,
    ])
  ) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant='h4' mb={2}>
        RFQs
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={rfqServices.getList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 15, 20, 50, 100]}
        renderItem={renderItem}
        componentElement='div'
        wrapperSx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        toolbar={
          <JumboListToolbar
            hideItemsPerPage={true}
            action={
              <Grid
                container
                columnSpacing={1}
                rowSpacing={1}
                justifyContent={'end'}
                alignItems={'center'}
              >
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    label='Status'
                    value={queryOptions.queryParams.status}
                    onChange={(e) => {
                      setQueryOptions((state) => ({
                        ...state,
                        queryParams: {
                          ...state.queryParams,
                          status: e.target.value,
                        },
                      }));
                    }}
                  >
                    {STATUS_OPTIONS.map((option: any) => {
                      return (
                        <MenuItem key={option.value} value={option.value}>
                          {option.lable}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <JumboSearch
                    value={queryOptions.queryParams.keyword}
                    onChange={handleOnKeywordChange}
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
