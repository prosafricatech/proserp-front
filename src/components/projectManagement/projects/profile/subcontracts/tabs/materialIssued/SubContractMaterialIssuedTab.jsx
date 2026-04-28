'use client';

import projectsServices from '@/components/projectManagement/projects/project-services';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Card, Grid, useMediaQuery } from '@mui/material';
import { useParams } from 'next/navigation';
import React from 'react';
import MaterialIssuedSelector from './MaterialIssuedSelector';
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
      aggregated: false,
    },
    countKey: 'total',
    dataKey: 'data',
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
          actionTail={
            <Grid
              container
              columnSpacing={{ md: 8, lg: 4 }}
              rowSpacing={1}
              justifyContent={'end'}
            >
              {isLargeScreen && (
                <Grid size={{ xs: 6, md: 4 }}>
                  <MaterialIssuedSelector
                    aggregated={queryOptions.queryParams.aggregated}
                    onChange={handleAggregatedChange}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 8 }}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
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
