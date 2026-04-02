'use client';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { ContractType } from './ContractType';
import EmployeesContractsActionTail from './EmployeesContractsActionTail';
import EmployeesContractsListItem from './EmployeesContractsListItem';

const EmployeesContracts = () => {
  const listRef = useRef<any>(null);
  const params = useParams<{ employee_id?: string; keyword?: string }>();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'employeesContract',
    queryParams: { employee_id: params.employee_id, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderEmployeesContracts = useCallback(
    (employeeContract: ContractType) => {
      return <EmployeesContractsListItem employeeContract={employeeContract} />;
    },
    []
  );

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        keyword: keyword,
      },
    }));
  }, []);

  useEffect(() => {
    setQueryOptions((state) => ({
      ...state,
      queryParams: {
        ...state.queryParams,
        id: params.employee_id,
        keyword: searchParams?.get('search') || '',
      },
    }));
    setMounted(true);
  }, [params, searchParams]);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Employees Contracts
      </Typography>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.getEmployeesContactList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[5, 8, 10, 15, 20]}
        renderItem={renderEmployeesContracts}
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
              <Stack direction='row'>
                <JumboSearch
                  onChange={handleOnChange}
                  value={queryOptions.queryParams.keyword}
                />
                <EmployeesContractsActionTail />
              </Stack>
            }
          ></JumboListToolbar>
        }
      />
    </>
  );
};

export default EmployeesContracts;
