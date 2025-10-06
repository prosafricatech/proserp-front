import React from 'react';
import { Card, Grid } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import SubContractMaterialUsedListItem from './SubContractMaterialUsedListItem';
import { useParams } from 'next/navigation';
import projectsServices from '@/components/projectManagement/projects/project-services';
import MaterialUsedSelector from './MaterialUsedSelector';

const SubContractMaterialUsedTab = ({ subContract }) => {
  const params = useParams();
  const listRef = React.useRef();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'SubContractMaterialUsed',
    queryParams: { 
      id: subContract?.id,
      keyword: '', 
      subcontract_id: subContract?.id, 
      aggregated: false
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

  const renderSubcontractMaterialUsed = React.useCallback((subContractMaterialsUsed) => {
    return <SubContractMaterialUsedListItem subContractMaterialsUsed={subContractMaterialsUsed} />;
  }, []);

  const handleOnChange = React.useCallback(
    (keyword) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword,
        },
      }));
    },
    []
  );

  const handleAggregatedChange = React.useCallback(
    (aggregated) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          aggregated,
        },
      }));
    },
    []
  );

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={projectsServices.getSubContractMaterialUsed}
      primaryKey={queryOptions.queryParams.aggregated ? "product_name" : "id"} 
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[5, 8, 10, 15, 20]}
      renderItem={renderSubcontractMaterialUsed}
      componentElement="div"
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar
          hideItemsPerPage={true}
          actionTail={
            <Grid container columnSpacing={1} rowSpacing={1} justifyContent={'end'}>
              <Grid size={{xs: 6, md: 4}}>
                <MaterialUsedSelector
                  aggregated={queryOptions.queryParams.aggregated} 
                  onChange={handleAggregatedChange} 
                />
              </Grid>
              <Grid size={{xs: 6, md: 8}}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
};

export default SubContractMaterialUsedTab;
