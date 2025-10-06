import React from 'react';
import { Card, Stack } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import SubContractMaterialIssuedActionTail from './SubContractMaterialIssuedActionTail';
import SubContractMaterialIssuedListItem from './SubContractMaterialIssuedListItem';
import { useParams } from 'next/navigation';
import projectsServices from '@/components/projectManagement/projects/project-services';

const SubContractMaterialIssuedTab = ({subContract}) => {
  const params = useParams();
  const listRef = React.useRef();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'SubContractMaterialIssued',
    queryParams: { id: params.id, keyword: '', subcontract_id: subContract?.id},
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderSubcontractMaterialIssued = React.useCallback((subContractMaterialsUsed) => {
    return <SubContractMaterialIssuedListItem subContractMaterialsUsed={subContractMaterialsUsed} />;
  }, []);

  const handleOnChange = React.useCallback(
    (keyword) => {
      setQueryOptions((state) => ({
        ...state,
        queryParams: {
          ...state.queryParams,
          keyword: keyword,
        },
      }));
    },
    []
  );

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={projectsServices.getSubContractMaterialIssued}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[5, 8, 10, 15, 20]}
      renderItem={renderSubcontractMaterialIssued}
      componentElement="div"
      bulkActions={null}
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar hideItemsPerPage={true} 
          actionTail={
            <Stack direction="row">
              <JumboSearch
                onChange={handleOnChange}
                value={queryOptions.queryParams.keyword}
              />
              {/* <SubContractMaterialIssuedActionTail subContract={subContract}/> */}
            </Stack>
          }
        />
      }
    />
  );
};

export default SubContractMaterialIssuedTab;
