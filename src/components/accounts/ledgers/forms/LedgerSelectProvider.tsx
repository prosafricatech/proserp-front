'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import ledgerServices from '../ledger-services';
import { useQuery } from '@tanstack/react-query';

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number; 
}

interface LedgerGroup {
  nature_id: number;
  original_name: string;
  ledgers?: Ledger[];
  children_with_ledgers?: LedgerGroup[];
}

interface LedgerSelectContextType {
  ledgerOptions: LedgerGroup[] | undefined;
  ungroupedLedgerOptions: Ledger[];
  extractLedgers: (
    ledgerGroups: LedgerGroup[] | undefined,
    notAllowedGroups: string[],
    allowedGroups: string[],
    setOptions: React.Dispatch<React.SetStateAction<Ledger[]>>,
    mainNatureId?: number | null,
    allowChildren?: boolean
  ) => void;
}

const LedgerSelectContext = createContext<LedgerSelectContextType>({
  ledgerOptions: undefined,
  ungroupedLedgerOptions: [],
  extractLedgers: () => {}
});

export const useLedgerSelect = () => useContext(LedgerSelectContext);

interface LedgerSelectProviderProps {
  children: ReactNode;
}

function LedgerSelectProvider({ children }: LedgerSelectProviderProps) {
  const [ungroupedLedgerOptions, setUngroupedLedgerOptions] = useState<Ledger[]>([]);
  const { data: ledgerOptions, isFetched } = useQuery<LedgerGroup[]>({
    queryKey: ['ledgerOptions'],
    queryFn: ledgerServices.getLedgerOptions,
    refetchOnWindowFocus: true
  });

  const extractLedgers = (
    ledgerGroups: LedgerGroup[] | undefined,
    notAllowedGroups: string[],
    allowedGroups: string[],
    setOptions: React.Dispatch<React.SetStateAction<Ledger[]>>,
    mainNatureId: number | null = null,
    allowChildren = false
  ) => {
    ledgerGroups?.forEach(group => {
      const currentNatureId = mainNatureId ?? group.nature_id;

      if (!notAllowedGroups.includes(group.original_name) && 
          (allowedGroups.length === 0 || allowedGroups.includes(group.original_name) || allowChildren)) {
        group?.ledgers?.forEach(ledger => 
          setOptions(options => [...options, { 
            ...ledger,
            nature_id: currentNatureId 
          }])
        );

        extractLedgers(group.children_with_ledgers, notAllowedGroups, allowedGroups, setOptions, currentNatureId, true);
      } else { 
        extractLedgers(group.children_with_ledgers, notAllowedGroups, allowedGroups, setOptions, group.nature_id, false);
      }
    });
  };

  useEffect(() => {
    if (isFetched) {
      setUngroupedLedgerOptions([]);
      extractLedgers(ledgerOptions, [], [], setUngroupedLedgerOptions, null);
    }
  }, [ledgerOptions, isFetched]);

  return (
    <LedgerSelectContext.Provider value={{ 
      ledgerOptions, 
      ungroupedLedgerOptions,
      extractLedgers
    }}>
      {children}
    </LedgerSelectContext.Provider>
  );
}

export default LedgerSelectProvider;