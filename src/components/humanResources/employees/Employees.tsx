'use client';

import { useOrganizationProfile } from '@/components/Organizations/profile/OrganizationProfileProvider';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import React, { useRef } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import EmployeeActionTail from './EmployeeActionTail';
import EmployeesList from './EmployeesList';
import { Employee } from './EmployeesType';

const Employees = () => {
  const params = useParams();
  const { organization } = useOrganizationProfile();
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'employees',
    queryParams: { id: params.id, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderEmployees = React.useCallback((employee: Employee) => {
    return <EmployeesList employee={employee} />;
  }, []);

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Employees
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getAllEmployees}
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
                {/* <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                /> */}
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
