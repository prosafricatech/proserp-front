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

// Status options with display names and values
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Sent', label: 'Sent' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Canceled', label: 'Canceled' },
];

function RFQs() {
  const params = useParams();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const { authOrganization, checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  
  // Separate state for keyword to prevent infinite loops
  const [keyword, setKeyword] = useState(getSanitizedSearchKeyword('RFQs', searchParams));
  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'rfqs',
    queryParams: {
      id: params.id,
      keyword: getSanitizedSearchKeyword('RFQs', searchParams),
      status: '', // Empty string for 'All'
    },
    countKey: 'total',
    dataKey: 'data',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update keyword when searchParams change
  useEffect(() => {
    const newKeyword = getSanitizedSearchKeyword('RFQs', searchParams);
    setKeyword(newKeyword);
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: newKeyword,
        id: params.id,
      },
    }));
  }, [params, searchParams]);

  // Handle keyword change without causing infinite loops
  const handleKeywordChange = useCallback((newKeyword: string) => {
    setKeyword(newKeyword);
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, keyword: newKeyword },
    }));
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, status: event.target.value },
    }));
  }, []);

  const renderItem = useCallback((rfq: any) => <RFQListItem rfq={rfq} />, []);

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
                    onChange={handleStatusChange}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <JumboSearch
                    value={keyword}
                    onChange={handleKeywordChange}
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