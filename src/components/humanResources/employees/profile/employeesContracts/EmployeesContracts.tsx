'use client';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import { ContractType } from './ContractType';
import EmployeesContractsActionTail from './EmployeesContractsActionTail';
import EmployeesContractsListItem from './EmployeesContractsListItem';

const EmployeesContracts = ({ employeeId }: { employeeId?: number }) => {
  const listRef = useRef<any>(null);
  const params = useParams<{ employee_id?: string; keyword?: string }>();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const resolvedEmployeeId =
    employeeId ?? (params.employee_id ? Number(params.employee_id) : undefined);

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'employeesContracts',
    queryParams: { employee_id: resolvedEmployeeId, keyword: '' },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderEmployeesContracts = useCallback(
    (employeeContract: ContractType) => {
      return <EmployeesContractsListItem contract={employeeContract} />;
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
        employee_id: resolvedEmployeeId,
        keyword: searchParams?.get('search') || '',
      },
    }));
    setMounted(true);
  }, [params, searchParams, resolvedEmployeeId]);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  return (
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
              <EmployeesContractsActionTail employeeId={resolvedEmployeeId} />
            </Stack>
          }
        ></JumboListToolbar>
      }
    />
  );
};

export default EmployeesContracts;
