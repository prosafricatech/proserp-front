'use client';

import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import MyHrContractsListItem from './MyHrContractsListItem';
import { MyHrContract } from './contractsType';

const MyHrContracts = () => {
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'myHrContracts',
    queryParams: {
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderItem = useCallback(
    (contract: MyHrContract) => <MyHrContractsListItem contract={contract} />,
    []
  );

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={humanResourcesServices.myHrContracts}
      primaryKey='id'
      queryOptions={queryOptions}
      itemsPerPage={10}
      itemsPerPageOptions={[10, 20, 50]}
      renderItem={renderItem}
      componentElement='div'
      wrapperSx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
      //   toolbar={
      //     <JumboListToolbar
      //       hideItemsPerPage
      //       actionTail={
      //         <Stack direction='row'>
      //           <JumboSearch onChange={handleKeywordChange} value={queryOptions.queryParams.keyword} />
      //         </Stack>
      //       }
      //     />
      //   }
    />
  );
};

export default MyHrContracts;
