'use client';
import { getSanitizedSearchKeyword } from '@/utilities/getSanitizedSearchKeyword';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Autocomplete, Card, Grid, TextField, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import EmployeeSelector from '../employees/EmployeeSelector';
import { EmployeesProvider } from '../employees/EmployeesProvider';
import { Employee } from '../employees/EmployeesType';
import humanResourcesServices from '../humanResourcesServices';
import LoanRequestsListItem from './LoanRequestsListItem';
import { LoanRequestType } from './LoanRequestType';

const STATUS_OPTIONS = [
  { label: 'In Review', value: 'in_review' },
  { label: 'On Hold', value: 'on hold' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const LoanRequests = () => {
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee | null>(
    null
  );

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'loanRequests',
    queryParams: {
      status: null,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderLoanRequests = React.useCallback(
    (loanRequest: LoanRequestType) => {
      return <LoanRequestsListItem loanRequest={loanRequest} />;
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
        keyword: getSanitizedSearchKeyword('Loan Requests', searchParams),
      },
    }));
    setMounted(true);
  }, [searchParams, selectedEmployees]);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        employee_id: selectedEmployees?.id ?? null,
      },
    }));
    setMounted(true);
  }, [selectedEmployees]);

  if (!mounted) return null;
  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Loan Requests
      </Typography>
      <EmployeesProvider>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={humanResourcesServices.getLoanRequestsList}
          primaryKey='id'
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[10, 20, 30, 50]}
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
              action={
                <Grid
                  container
                  spacing={2}
                  mb={2}
                  mt={2}
                  justifyContent='center'
                >
                  <Grid size={{ xs: 12, md: 4 }}>
                    <EmployeeSelector
                      value={selectedEmployees}
                      onChange={(value) => {
                        if (value) {
                          Array.isArray(value)
                            ? setSelectedEmployees(value[0])
                            : setSelectedEmployees(value);
                        } else {
                          setSelectedEmployees(null);
                        }
                      }}
                    />
                  </Grid>
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
              }
            />
          }
        />
      </EmployeesProvider>
    </>
  );
};

export default LoanRequests;
