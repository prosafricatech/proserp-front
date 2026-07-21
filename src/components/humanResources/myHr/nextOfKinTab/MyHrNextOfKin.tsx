import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import { NextOfKinType } from '../../employees/profile/nextOfKins/NextOfKinType';
import humanResourcesServices from '../../humanResourcesServices';
import NextOfKinsListItem from './NextOfKinsListItem';

const MyHrNextOfKin = () => {
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'myHrNextOfKin',
    queryParams: {
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderItem = useCallback(
    (nextOfKin: NextOfKinType) => <NextOfKinsListItem nextOfKin={nextOfKin} />,
    []
  );

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={humanResourcesServices.myHrNextOfKin}
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

export default MyHrNextOfKin;
