'use client';

import { Div } from '@jumbo/shared';
import { Skeleton, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createContext, useContext } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import { Employee } from '../EmployeesType';

interface EmployeeProfileContextType {
  employee: Employee | null;
  reFetchEmployee: () => void;
}

const EmployeeProfileContext = createContext<EmployeeProfileContextType>({
  employee: null,
  reFetchEmployee: () => {},
});

export const useEmployeeProfile = () => useContext(EmployeeProfileContext);

function EmployeeProfileProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();

  const {
    data: employee,
    isLoading,
    refetch: reFetchEmployee,
  } = useQuery<Employee>({
    queryKey: ['showEmployee', params.id],
    queryFn: () => humanResourcesServices.showEmployee(params.id),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <Div sx={{ width: '100%', p: 2 }}>
        <Stack spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      </Div>
    );
  }

  return (
    <EmployeeProfileContext.Provider
      value={{ employee: employee ?? null, reFetchEmployee }}
    >
      {children}
    </EmployeeProfileContext.Provider>
  );
}

export default EmployeeProfileProvider;

