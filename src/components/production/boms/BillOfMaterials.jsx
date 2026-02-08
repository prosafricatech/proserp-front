'use client'

import React from 'react';
import { Card, Stack, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import billOfMaterialsServices from './billOfMaterialsServices';
import BillOfMaterialActionTail from './BillOfMaterialActionTail';
import BillOfMaterialsListItem from './BillOfMaterialsListItem';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';
import ProductsProvider from '../../productAndServices/products/ProductsProvider';
import { useParams } from 'next/navigation';

const BillOfMaterials = () => {
  const params = useParams();
  const listRef = React.useRef();

  const [queryOptions, setQueryOptions] = React.useState({
    queryKey: 'billOfMaterials',
    queryParams: { id: params.id, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });     

  React.useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id },
    }));
  }, [params]);

  const renderBillOfMaterial = React.useCallback((billOfMaterial) => {
    return <BillOfMaterialsListItem billOfMaterial={billOfMaterial} />;
  }, []);

  const handleOnChange = React.useCallback((keyword) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  return (
    <ProductsProvider>
      <ProductsSelectProvider>
        <Typography variant={'h4'} mb={2}>Bill Of Materials</Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={billOfMaterialsServices.getList}
          primaryKey={'id'}
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderBillOfMaterial}
          componentElement={'div'}
          bulkActions={null}
          wrapperSx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
          toolbar={
            <JumboListToolbar hideItemsPerPage={true} actionTail={
              <Stack direction={'row'}>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
                <BillOfMaterialActionTail />
              </Stack>
            }
            />
          }
        />
      </ProductsSelectProvider>
    </ProductsProvider>
  );
};

export default BillOfMaterials;
