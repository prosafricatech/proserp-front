'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import LeaveRequestActionTail from './LeaveRequestActionTail';
import { LeaveRequestType } from './LeaveRequestType';
import LeaveRequestsListItem from './LeaveRequestsListItem';

const LeaveRequests = () => {
  const params = useParams<{ employee_id?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'leaveRequests',
    queryParams: {
      employee_id: searchParams?.get('employee_id') || params.employee_id,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLeaveRequests = React.useCallback((leaveRequest: LeaveRequestType) => {
    return <LeaveRequestsListItem leaveRequest={leaveRequest} />;
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
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        employee_id: searchParams?.get('employee_id') || params.employee_id,
        keyword: searchParams?.get('search') || '',
      },
    }));
    setMounted(true);
  }, [params, searchParams]);

  if (!mounted) return null;

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Leave Requests
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getLeaveRequestsList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={20}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderLeaveRequests}
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
                <LeaveRequestActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default LeaveRequests;
