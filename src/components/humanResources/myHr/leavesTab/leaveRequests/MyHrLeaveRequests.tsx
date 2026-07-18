import { LeaveRequestType } from '@/components/humanResources/employees/profile/leaveRequests/LeaveRequestType';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Autocomplete, Card, Grid, TextField } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import MyHrLeaveRequestsListItem from './MyHrLeaveRequestsListItem';

const STATUS_OPTIONS = [
  { label: 'In Review', value: 'in_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'On Hold', value: 'on hold' },
];

const MyHrLeaveRequests = () => {
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'myHrLeaveRequests',
    queryParams: {
      status: status?.value,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLeaveRequests = useCallback((leaveRequest: LeaveRequestType) => {
    return <MyHrLeaveRequestsListItem leaveRequest={leaveRequest} />;
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: getSanitizedSearchKeyword('Leave Requests', searchParams),
      },
    }));
    setMounted(true);
  }, [searchParams, status]);

  if (!mounted) return null;

  return (
    <>
      <Grid container spacing={2} mb={2} mt={2} justifyContent='center'>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            size='small'
            options={STATUS_OPTIONS}
            value={status}
            isOptionEqualToValue={(option, value) =>
              option?.value === value?.value
            }
            getOptionLabel={(option) => option.label}
            onChange={(_, newValue) => {
              setStatus(newValue);
              setQueryOptions((state) => ({
                ...state,
                queryParams: {
                  ...state.queryParams,
                  status: newValue?.value,
                },
              }));
            }}
            renderInput={(inputParams) => (
              <TextField {...inputParams} label='Status' fullWidth />
            )}
          />
        </Grid>
      </Grid>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.myHrLeaveRequests}
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
      />
    </>
  );
};

export default MyHrLeaveRequests;
