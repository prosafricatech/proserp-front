'use client';

import projectsServices from '@/components/projectManagement/projects/project-services';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Card, Grid, useMediaQuery } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import React from 'react';
import MaterialIssuedSelector from './MaterialIssuedSelector';
import SubContratorTasksFilter from './SubContratorTasksFilter';
import SubContractMaterialIssuedListItem from './SubContractMaterialIssuedListItem';

const SubContractMaterialIssuedTab = ({ subContract }) => {
  const params = useParams();
  const listRef = React.useRef();

  const { theme } = useJumboTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'SubContractMaterialIssued',
    queryParams: {
      id: subContract?.id,
      keyword: '',
      subcontract_id: subContract?.id,
      aggregated: true,
      project_task_ids: [],
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const { data: subContractTasks = [] } = useQuery({
    queryKey: ['subContractTasksForMaterialIssued', { id: subContract?.id }],
    queryFn: async () => projectsServices.getSubContractTasks(subContract.id),
    enabled: !!subContract?.id,
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: subContract?.id },
    }));
  }, [params]);

  const renderSubcontractMaterialIssued = React.useCallback(
    (subContractMaterialsUsed) => {
      return (
        <SubContractMaterialIssuedListItem
          subContractMaterialsUsed={subContractMaterialsUsed}
        />
      );
    },
    []
  );

  const handleOnChange = React.useCallback((keyword) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword,
      },
    }));
  }, []);

  const handleAggregatedChange = React.useCallback((aggregated) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        aggregated,
      },
    }));
  }, []);

  const handleTaskIdsChange = React.useCallback((projectTaskIds) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        project_task_ids: projectTaskIds,
      },
    }));
  }, []);

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={projectsServices.getSubContractMaterialIssued}
      primaryKey={queryOptions.queryParams.aggregated ? 'product_name' : 'id'}
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[5, 8, 10, 15, 20]}
      renderItem={renderSubcontractMaterialIssued}
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
              columnSpacing={{ md: 2 }}
              rowSpacing={1}
              justifyContent={'end'}
            >
              {isLargeScreen && (
                <Grid size={{ xs: 12, md: 3 }}>
                  <MaterialIssuedSelector
                    aggregated={queryOptions.queryParams.aggregated}
                    onChange={handleAggregatedChange}
                  />
                </Grid>
              )}
              {isLargeScreen && (
                <Grid size={{ xs: 12, md: 5 }}>
                  <SubContratorTasksFilter
                    tasks={subContractTasks}
                    value={queryOptions.queryParams.project_task_ids}
                    onChange={handleTaskIdsChange}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 4 }}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
              {!isLargeScreen && (
                <Grid size={{ xs: 12 }}>
                  <SubContratorTasksFilter
                    tasks={subContractTasks}
                    value={queryOptions.queryParams.project_task_ids}
                    onChange={handleTaskIdsChange}
                  />
                </Grid>
              )}
              {!isLargeScreen && (
                <Grid size={{ xs: 12 }}>
                  <MaterialIssuedSelector
                    aggregated={queryOptions.queryParams.aggregated}
                    onChange={handleAggregatedChange}
                  />
                </Grid>
              )}
            </Grid>
          }
        />
      }
    />
  );
};

export default SubContractMaterialIssuedTab;
