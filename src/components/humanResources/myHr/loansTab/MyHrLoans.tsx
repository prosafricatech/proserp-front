'use client';

import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Autocomplete, Card, Grid, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LoanRequest } from './LoanRequestType';
import MyHrLoanRequestsListItem from './MyHrLoanRequestsListItem';
import MyHrLoansActionTail from './MyHrLoansActionTail';

const STATUS_OPTIONS = [
  { label: 'In Review', value: 'in_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'On Hold', value: 'on hold' },
];

type LeaveSubTab = 'balances' | 'requests';
const MyHrLoans = () => {
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'myHrLoanRequests',
    queryParams: {
      status: status?.value,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  const renderLoanRequests = useCallback((loanRequest: LoanRequest) => {
    return <MyHrLoanRequestsListItem loanRequest={loanRequest} />;
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
        service={humanResourcesServices.myHrLoanRequests}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 20, 50]}
        renderItem={renderLoanRequests}
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
              <Stack direction='row' justifyContent={'end'}>
                {/* <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                /> */}
                <MyHrLoansActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default MyHrLoans;
