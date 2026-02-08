'use client'

import React, { createContext, useContext } from 'react';
import stakeholderServices from './stakeholder-services';
import { LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Stakeholders } from './StakeholderType';

interface StakeholderSelectContextValue {
  stakeholders: Stakeholders;
}

interface StakeholderSelectProviderProps {
  children: React.ReactNode;
  type?: string;
}

const StakeholderSelectContext = createContext<StakeholderSelectContextValue>({
  stakeholders: [],
});

export const useStakeholderSelect = () => useContext(StakeholderSelectContext);

function StakeholderSelectProvider({ children, type = 'all' }: StakeholderSelectProviderProps) {
  const { data: stakeholders = [], isLoading } = useQuery<Stakeholders>({
    queryKey: ['stakeholders', type],
    queryFn: () => stakeholderServices.getSelectOptions(type),
  });

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <StakeholderSelectContext.Provider value={{ stakeholders }}>
      {children}
    </StakeholderSelectContext.Provider>
  );
}

export default StakeholderSelectProvider;