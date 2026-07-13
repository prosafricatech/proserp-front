'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
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
    notAllowedGroups: string[],
    allowedGroups: string[]
  ) => Ledger[];
  isLoading: boolean;
}

const LedgerSelectContext = createContext<LedgerSelectContextType>({
  ledgerOptions: undefined,
  ungroupedLedgerOptions: [],
  extractLedgers: () => [],
  isLoading: false
});

export const useLedgerSelect = () => useContext(LedgerSelectContext);

interface LedgerSelectProviderProps {
  children: ReactNode;
}

function LedgerSelectProvider({ children }: LedgerSelectProviderProps) {
  const [ungroupedLedgerOptions, setUngroupedLedgerOptions] = useState<Ledger[]>([]);
  const { data: ledgerOptions, isFetched, isLoading } = useQuery<LedgerGroup[]>({
    queryKey: ['ledgerOptions'],
    queryFn: ledgerServices.getLedgerOptions,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Optimized extraction using iterative approach instead of recursive
  const extractLedgers = useCallback((
    notAllowedGroups: string[] = [],
    allowedGroups: string[] = []
  ): Ledger[] => {
    if (!ledgerOptions || ledgerOptions.length === 0) return [];

    const notAllowedSet = new Set(notAllowedGroups);
    const allowedSet = new Set(allowedGroups);
    const result: Ledger[] = [];
    const visitedGroups = new Set<string>();

    // Iterative stack-based traversal to avoid recursion
    const stack: Array<{ 
      group: LedgerGroup; 
      natureId: number;
      allowChildren: boolean;
      parentAllowed: boolean;
    }> = ledgerOptions.map(group => ({
      group,
      natureId: group.nature_id,
      allowChildren: false,
      parentAllowed: false
    }));

    while (stack.length > 0) {
      const { group, natureId, allowChildren, parentAllowed } = stack.pop()!;
      
      // Create unique key for group to avoid reprocessing
      const groupKey = `${group.original_name}-${natureId}`;
      if (visitedGroups.has(groupKey)) continue;
      visitedGroups.add(groupKey);

      const isNotAllowed = notAllowedSet.has(group.original_name);
      const isAllowed = allowedSet.size === 0 || allowedSet.has(group.original_name);
      const shouldInclude = !isNotAllowed && (isAllowed || allowChildren || parentAllowed);

      // Process ledgers
      if (shouldInclude && group.ledgers && group.ledgers.length > 0) {
        const ledgersWithNature = group.ledgers.map(ledger => ({
          ...ledger,
          nature_id: natureId
        }));
        result.push(...ledgersWithNature);
      }

      // Process children
      if (group.children_with_ledgers && group.children_with_ledgers.length > 0) {
        const shouldProcessChildren = !isNotAllowed || allowChildren;
        const childNatureId = natureId || group.nature_id;
        
        for (const child of group.children_with_ledgers) {
          stack.push({
            group: child,
            natureId: child.nature_id || childNatureId,
            allowChildren: shouldProcessChildren,
            parentAllowed: shouldInclude || parentAllowed
          });
        }
      }
    }

    return result;
  }, [ledgerOptions]);

  // Extract ungrouped ledgers only once when data loads
  useEffect(() => {
    if (isFetched && ledgerOptions) {
      // Use requestIdleCallback for large datasets to avoid blocking UI
      const processData = () => {
        const extracted = extractLedgers([], []);
        setUngroupedLedgerOptions(extracted);
      };

      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(processData, { timeout: 1000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(processData, 0);
      }
    }
  }, [ledgerOptions, isFetched, extractLedgers]);

  const contextValue = useMemo(() => ({
    ledgerOptions,
    ungroupedLedgerOptions,
    extractLedgers,
    isLoading
  }), [ledgerOptions, ungroupedLedgerOptions, extractLedgers, isLoading]);

  return (
    <LedgerSelectContext.Provider value={contextValue}>
      {children}
    </LedgerSelectContext.Provider>
  );
}

export default LedgerSelectProvider;