import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import React, { useContext, useState, ReactNode } from 'react';

interface Store {
  id: number;
  name: string;
}

interface Counter {
  id: number;
  name: string;
  ledgers: Array<{
    id: number;
    name: string;
  }>;
}

export interface OutletType {
  id: number;
  name: string;
  stores: Store[];
  counters: Counter[];
  cost_center: CostCenter;
}

interface OutletContextType {
  activeOutlet: OutletType | null;
  setActiveOutlet: (outlet: OutletType | null) => void;
}

const OutletContext = React.createContext<OutletContextType | undefined>(undefined);

export const useSalesOutlet = (): OutletContextType => {
  const context = useContext(OutletContext);
  if (context === undefined) {
    throw new Error('useSalesOutlet must be used within a OutletProvider');
  }
  return context;
};

interface OutletProviderProps {
  children: ReactNode;
}

function OutletProvider({ children }: OutletProviderProps) {
  const [activeOutlet, setActiveOutlet] = useState<OutletType | null>(null);
  
  return (
    <OutletContext.Provider
      value={{ 
        activeOutlet,
        setActiveOutlet
      }}
    >
      {children}
    </OutletContext.Provider>
  );
}

export default OutletProvider;