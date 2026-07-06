'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import { Card, Grid, Stack } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import SalaryHistoryListItem from './SalaryHistoryListItem';
import { SalaryChange } from './AuditTrailType';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';

interface SalaryHistoryTabProps {
  employeeId: number;
}

const SalaryHistoryTab = ({ employeeId }: SalaryHistoryTabProps) => {
  const listRef = useRef<any>(null);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: ['salaryHistory', employeeId],
    queryParams: {
      keyword: '',
    },
    countKey: 'salary_changes',
    dataKey: 'salary_changes',
  });

  const renderSalaryHistory = useCallback((change: SalaryChange) => {
    return <SalaryHistoryListItem change={change} />;
  }, []);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  return (
    <JumboRqList
      ref={listRef}
      wrapperComponent={Card}
      service={(params) => humanResourcesServices.getEmployeeSalaryHistory(employeeId, params)}
      primaryKey="id"
      queryOptions={queryOptions as any}
      itemsPerPage={20}
      itemsPerPageOptions={[10, 20, 50]}
      renderItem={renderSalaryHistory}
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
            <Grid container columnSpacing={1} rowSpacing={1}>
              <Grid size={{ xs: 12, lg: 12 }}>
                <Stack direction="row">
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                </Stack>
              </Grid>
            </Grid>
          }
        />
      }
    />
  );
};

export default SalaryHistoryTab;