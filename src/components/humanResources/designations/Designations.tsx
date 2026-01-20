'use client';

import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import DesignationActionTail from './DesignationActionTail';
import DesignationsListItem from './DesignationsListItem';
import { Designation } from './DesignationsType';

const Designations = () => {
  const params = useParams<{ id?: string; keyword?: string }>();
  const listRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'designations',
    queryParams: { id: params.id, keyword: params.keyword || '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderDesignations = React.useCallback((designation: Designation) => {
    return <DesignationsListItem designation={designation} />;
  }, []);

  useEffect(() => {
    const fetchDesignations = async () => {
      const response = await humanResourcesServices.getDesignationsList();
    };
    fetchDesignations();
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
        Designations
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getDesignationsList}
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
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
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
