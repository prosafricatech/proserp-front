'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card, Stack, Typography } from '@mui/material';
import React, { useRef } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import DepartmentActionTail from './DepartmentActionTail';
import DepartmentsListItem from './DepartmentsListItem';
import { Department } from './DepertmentsType';

const Departments = () => {
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'departments',
    queryParams: {},
    countKey: 'total',
    dataKey: 'data',
  });

  const renderEmployees = React.useCallback((department: Department) => {
    return <DepartmentsListItem department={department} />;
  }, []);

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Departments
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getAllDepartments}
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
                <DepartmentActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default Departments;
