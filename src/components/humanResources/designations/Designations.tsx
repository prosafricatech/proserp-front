'use client';

import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card, Stack, Typography } from '@mui/material';
import React, { useRef } from 'react';
import DesignationActionTail from './DesignationActionTail';
import DesignationsListItem from './DesignationsListItem';
import { Designation } from './DesignationsType';

const Designations = () => {
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'designations',
    queryParams: {},
    countKey: 'total',
    dataKey: 'data',
  });

  const renderDesignations = React.useCallback((designation: Designation) => {
    return <DesignationsListItem designation={designation} />;
  }, []);

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Designations
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getAllDesignations}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderDesignations}
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
                <DesignationActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default Designations;
