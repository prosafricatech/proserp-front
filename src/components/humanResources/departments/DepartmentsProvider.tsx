import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';

interface DepartmentsContextType {
  refetchDepertmenats: () => void;
  // departments: Department[];
  departments: any;
  isFetching: boolean;
  isLoading: boolean;
}

export const DepartmentsContext = createContext<
  DepartmentsContextType | undefined
>(undefined);

export const useDepartments = (): DepartmentsContextType => {
  const context = useContext(DepartmentsContext);

  if (!context) {
    throw new Error(
      'useDepartments can ony be used inside departmentsProvider'
    );
  }

  return context;
};

export const DepartmentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchDepertmenats,
  } = useQuery({
    queryKey: ['fetchDepartments'],
    queryFn: async () => {
      const response = humanResourcesServices.getAllDepartments();
      return response;
    },
  });

  const [departments, setDepartments] = useState(null);

  useEffect(() => {
    if (!isFetching && data) {
      setDepartments(data);
    }
  }, [data, isFetching]);

  return (
    <DepartmentsContext.Provider
      value={{ departments, refetchDepertmenats, isFetching, isLoading }}
    >
      {children}
    </DepartmentsContext.Provider>
  );
};
