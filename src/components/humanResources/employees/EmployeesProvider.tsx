import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { Employee } from './EmployeesType';

interface EmployeesContextType {
  refetchEmployees: () => void;
  employees: Employee[] | null;
  //   employees: any;
  isFetching: boolean;
  isLoading: boolean;
}

export const EmployeesContext = createContext<EmployeesContextType | undefined>(
  undefined
);

export const useEmployees = (): EmployeesContextType => {
  const context = useContext(EmployeesContext);

  if (!context) {
    throw new Error('useEmployees can ony be used inside EmployeesProvider');
  }

  return context;
};

export const EmployeesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['fetchEmployees'],
    queryFn: async () => {
      const response = humanResourcesServices.getAllEmployees();
      return response;
    },
  });

  const [employees, setEmployees] = useState<Employee[] | null>(null);

  useEffect(() => {
    if (!isFetching && data) {
      setEmployees(data.data);
    }
  }, [data, isFetching]);

  return (
    <EmployeesContext.Provider
      value={{ employees, refetchEmployees, isFetching, isLoading }}
    >
      {children}
    </EmployeesContext.Provider>
  );
};
