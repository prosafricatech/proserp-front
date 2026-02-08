'use client'

import axios from "@/lib/services/config";
import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";

interface LedgerGroup {
  id: number;
  name: string;
  code: string | null;
  alias: string | null;
  description?: string;
  is_editable: number;
  ledger_group_id: number | null;
  nature_id: number;
  original_name: string;
  children?: LedgerGroup[];
}

interface LedgerGroupOption {
  id: number;
  name: string;
  nature_id: number;
  ledger_group_id?: number | null;
}

interface LedgerGroupsResponse {
  ledgerGroups: LedgerGroup[];
}

interface LedgerGroupContextType {
  refetchLedgerGroups: () => void;
  ledgerGroups?: LedgerGroup[];
  ledgerGroupOptions: LedgerGroupOption[];
  ledgerGroupOptionIds: string[];
  isLoading: boolean;
  isFetching: boolean;
}

export const LedgerGroupContext = createContext<LedgerGroupContextType | undefined>(undefined);

export const useLedgerGroup = (): LedgerGroupContextType => {
  const context = useContext(LedgerGroupContext);
  if (!context) {
    throw new Error("useLedgerGroup must be used within a LedgerGroupProvider");
  }
  return context;
}

interface LedgerGroupProviderProps {
  children: ReactNode;
}

export default function LedgerGroupProvider({ children }: LedgerGroupProviderProps) {
  const { data, isLoading, isFetching, refetch: refetchLedgerGroups } = useQuery<LedgerGroupsResponse>({
    queryKey: ['fetchLedgerGroups'],
    queryFn: async () => {
      const response = await axios.get('/api/accountsAndFinance/ledgers/ledger_group');
      return response.data as LedgerGroupsResponse;
    }
  });
  
  const [ledgerGroupOptions, setLedgerGroupOptions] = useState<LedgerGroupOption[]>([]);
  const [ledgerGroupOptionIds, setLedgerGroupOptionIds] = useState<string[]>([]);

  const createLedgersGroupOptions = useCallback((groups: LedgerGroup[] = []) => {
    const newOptions: LedgerGroupOption[] = [];
    const newIds: string[] = [];

    const processGroups = (groups: LedgerGroup[]) => {
      groups.forEach((group) => {
        newOptions.push({
          id: group.id,
          name: group.name,
          nature_id: group.nature_id,
          ledger_group_id: group.ledger_group_id
        });
        newIds.push(String(group.id));
        
        if (group.children) {
          processGroups(group.children);
        }
      });
    };

    processGroups(groups);
    
    setLedgerGroupOptions(newOptions);
    setLedgerGroupOptionIds(newIds);
  }, []);

  useEffect(() => {
    if (!isFetching && data?.ledgerGroups) {
      createLedgersGroupOptions(data.ledgerGroups);
    } else {
      setLedgerGroupOptionIds([]);
      setLedgerGroupOptions([]);
    }
  }, [data, isFetching, createLedgersGroupOptions]);

  return (
    <LedgerGroupContext.Provider 
      value={{
        refetchLedgerGroups,
        ledgerGroups: data?.ledgerGroups,
        ledgerGroupOptions,
        ledgerGroupOptionIds,
        isLoading,
        isFetching
      }}
    >
      {children}
    </LedgerGroupContext.Provider>
  );
}