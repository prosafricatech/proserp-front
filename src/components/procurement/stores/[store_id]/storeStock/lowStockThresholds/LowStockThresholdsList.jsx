import React from 'react';
import {Card,Stack,} from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import LowStockThresholdListItem from './LowStockThresholdListItem';
import lowStockThresholdServices from './lowStockThreshold-services';
import { useParams } from 'next/navigation';

function LowStockThreholdsList() {
  const params = useParams();
  const listRef = React.useRef();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'lowStockAlerts',
    queryParams: { store_id: params.id, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, store_id: params.id },
    }));
  }, [params]);
  
  const renderAlertItems = React.useCallback((lowStockAlert) => {
    return <LowStockThresholdListItem lowStockAlert={lowStockAlert} />;
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

  return(
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={lowStockThresholdServices.getList}
      primaryKey="id"
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 15, 20,50,100]}
      renderItem={renderAlertItems}
      bulkActions={null}
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      toolbar={
        <JumboListToolbar hideItemsPerPage={true} actionTail={
          <Stack direction="row">
            <JumboSearch
              onChange={handleOnChange}
              value={queryOptions.queryParams.keyword}
            />
          </Stack>
        }/>
      }
    />
  )
}
export default LowStockThreholdsList;