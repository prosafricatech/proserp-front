'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import LeaveRequestActionTail from './LeaveRequestActionTail';
import { LeaveRequestType } from './LeaveRequestType';
import LeaveRequestsListItem from './LeaveRequestsListItem';

const LeaveRequests = ({ employeeId }: { employeeId?: number }) => {
  const params = useParams<{ employee_id?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const resolvedEmployeeId =
    employeeId ??
    (searchParams?.get('employee_id')
      ? Number(searchParams.get('employee_id'))
      : params.employee_id
        ? Number(params.employee_id)
        : undefined);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'leaveRequests',
    queryParams: {
      employee_id: resolvedEmployeeId,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLeaveRequests = React.useCallback(
    (leaveRequest: LeaveRequestType) => {
      return <LeaveRequestsListItem leaveRequest={leaveRequest} />;
    },
    []
  );

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
        employee_id: resolvedEmployeeId,
        keyword: getSanitizedSearchKeyword('Leave Requests', searchParams),
      },
    }));
    setMounted(true);
  }, [params, searchParams, resolvedEmployeeId]);

  if (!mounted) return null;

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={humanResourcesServices.getLeaveRequestsList}
      primaryKey='id'
      queryOptions={queryOptions}
      itemsPerPage={10}
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
              <LeaveRequestActionTail employeeId={resolvedEmployeeId} />
            </Stack>
          }
        ></JumboListToolbar>
      }
    />
  );
};

export default LeaveRequests;
