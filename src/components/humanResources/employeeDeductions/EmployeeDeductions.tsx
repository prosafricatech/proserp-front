'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import EmployeeDeductionActionTail from './EmployeeDeductionActionTail';
import { EmployeeDeductionType } from './EmployeeDeductionType';
import EmployeeDeductionsListItem from './EmployeeDeductionsListItem';

const EmployeeDeductions = () => {
  const params = useParams<{ employee_id?: string }>();
  const searchParams = useSearchParams();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'employeeDeductions',
    queryParams: {
      employee_id: searchParams?.get('employee_id') || params.employee_id,
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderEmployeeDeductions = React.useCallback(
    (employeeDeduction: EmployeeDeductionType) => {
      return <EmployeeDeductionsListItem employeeDeduction={employeeDeduction} />;
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
        Employee Deductions
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getEmployeeDeductionsList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={20}
        itemsPerPageOptions={[10, 20, 30, 50]}
        renderItem={renderEmployeeDeductions}
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
                <EmployeeDeductionActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default EmployeeDeductions;
