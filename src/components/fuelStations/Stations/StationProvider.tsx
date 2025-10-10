'use client';

import React, { useContext, useState, ReactNode } from 'react';
import { Station } from './StationType';

interface StationContextType {
  activeStation: Station | null;
  setActiveStation: (station: Station | null) => void;
}

const StationContext = React.createContext<StationContextType | undefined>(undefined);

export const useSalesStation = (): StationContextType => {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useSalesStation must be used within a StationProvider');
  }
  return context;
};

interface StationProviderProps {
  children: ReactNode;
}

function StationProvider({ children }: StationProviderProps) {
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  
  return (
    <StationContext.Provider
      value={{ 
        activeStation,
        setActiveStation
      }}
    >
      {children}
    </StationContext.Provider>
  );
}

export default StationProvider;