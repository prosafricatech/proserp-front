'use client';

import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import MyHrPayslipsListItem from './MyHrPayslipsListItem';
import { MyHrPayslipListItem } from './payslipsType';

const MyHrPayslips = () => {
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'myHrPayslips',
    queryParams: {
      keyword: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderItem = useCallback(
    (payslip: MyHrPayslipListItem) => (
      <MyHrPayslipsListItem payslip={payslip} />
    ),
    []
  );

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={humanResourcesServices.myHrPayslipsList}
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
    />
  );
};

export default MyHrPayslips;
