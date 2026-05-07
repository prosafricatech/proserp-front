import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { Designation } from './DesignationsType';

interface DesignationsContextType {
  refetchDesignations: () => void;
  designations: Designation[] | null;
  //   designations: any;
  isFetching: boolean;
  isLoading: boolean;
}

export const DesignationsContext = createContext<
  DesignationsContextType | undefined
>(undefined);

export const useDesignations = (): DesignationsContextType => {
  const context = useContext(DesignationsContext);

  if (!context) {
    throw new Error(
      'useDesignations can ony be used inside DesignationsProvider'
    );
  }

  return context;
};

export const DesignationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchDesignations,
  } = useQuery({
    queryKey: ['fetchDesignations'],
    queryFn: async () => {
      const response = humanResourcesServices.getAllDesignations();
      return response;
    },
  });

  const [designations, setDesignations] = useState<Designation[] | null>(null);

  useEffect(() => {
    if (!isFetching && data) {
      setDesignations(data.data);
    }
  }, [data, isFetching]);

  return (
    <DesignationsContext.Provider
      value={{ designations, refetchDesignations, isFetching, isLoading }}
    >
      {children}
    </DesignationsContext.Provider>
  );
};
