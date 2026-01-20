'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import EmployeeActionTail from './EmployeeActionTail';
import EmployeesListItem from './EmployeesListItem';
import { Employee } from './EmployeesType';

const Employees = () => {
  const listRef = useRef<any>(null);
  const params = useParams<{ id?: string; keyword?: string }>();
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'employees',
    queryParams: { id: params.id, keyword: params.keyword || '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderEmployees = React.useCallback((employee: Employee) => {
    return <EmployeesListItem employee={employee} />;
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

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Employees
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getEmployeesList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderEmployees}
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
                <EmployeeActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default Employees;
