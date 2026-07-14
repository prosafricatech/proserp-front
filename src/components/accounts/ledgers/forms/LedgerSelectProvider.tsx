'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react';
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
    allowedGroups: string[],
    allowedLedgerIds?: Set<number>,
    notAllowedLedgerIds?: Set<number>
  ) => Ledger[];
  isLoaded: boolean;
}

const LedgerSelectContext = createContext<LedgerSelectContextType>({
  ledgerOptions: undefined,
  ungroupedLedgerOptions: [],
  extractLedgers: () => [],
  isLoaded: false
});

export const useLedgerSelect = () => useContext(LedgerSelectContext);

interface LedgerSelectProviderProps {
  children: ReactNode;
}

// Optimized recursive function that builds results without state updates
function buildLedgerList(
  groups: LedgerGroup[] | undefined,
  notAllowedGroupsSet: Set<string>,
  allowedGroupsSet: Set<string>,
  allowedLedgerIds?: Set<number>,
  notAllowedLedgerIds?: Set<number>,
  parentNatureId: number | null = null,
  inheritedAllowed: boolean = false
): Ledger[] {
  if (!groups || groups.length === 0) return [];

  const result: Ledger[] = [];

  for (const group of groups) {
    const currentNatureId = parentNatureId ?? group.nature_id;
    const groupName = group.original_name;
    
    // Determine if this group should be processed
    const isGroupBlocked = notAllowedGroupsSet.has(groupName);
    const isGroupAllowed = allowedGroupsSet.size === 0 || allowedGroupsSet.has(groupName);
    
    // A group is accessible if:
    // 1. It's not blocked
    // 2. Either allowedGroups is empty OR this group is in allowedGroups
    // 3. OR it inherited allowed status from parent
    const isAccessible = !isGroupBlocked && (isGroupAllowed || inheritedAllowed);
    
    // Process ledgers in this group
    if (group.ledgers && group.ledgers.length > 0 && isAccessible) {
      for (const ledger of group.ledgers) {
        const ledgerId = ledger.id;
        
        // Apply ledger-level filters
        if (notAllowedLedgerIds?.has(ledgerId)) continue;
        if (allowedLedgerIds && allowedLedgerIds.size > 0 && !allowedLedgerIds.has(ledgerId)) continue;
        
        result.push({
          ...ledger,
          nature_id: currentNatureId
        });
      }
    }
    
    // Process children recursively
    if (group.children_with_ledgers && group.children_with_ledgers.length > 0) {
      // Children inherit allowed status only if this group is accessible
      const childInheritedAllowed = isAccessible || inheritedAllowed;
      
      const childLedgers = buildLedgerList(
        group.children_with_ledgers,
        notAllowedGroupsSet,
        allowedGroupsSet,
        allowedLedgerIds,
        notAllowedLedgerIds,
        currentNatureId,
        childInheritedAllowed
      );
      
      if (childLedgers.length > 0) {
        result.push(...childLedgers);
      }
    }
  }

  return result;
}

// Pre-compute the full flattened list once
function flattenAllLedgers(groups: LedgerGroup[] | undefined): Ledger[] {
  if (!groups) return [];
  
  const emptyNotAllowed = new Set<string>();
  const emptyAllowed = new Set<string>();
  
  return buildLedgerList(
    groups,
    emptyNotAllowed,
    emptyAllowed,
    undefined,
    undefined,
    null,
    false
  );
}

function LedgerSelectProvider({ children }: LedgerSelectProviderProps) {
  const { data: ledgerOptions, isFetched, isLoading } = useQuery<LedgerGroup[]>({
    queryKey: ['ledgerOptions'],
    queryFn: ledgerServices.getLedgerOptions,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Pre-compute the full flattened list once
  const fullLedgerList = useMemo(() => {
    return flattenAllLedgers(ledgerOptions);
  }, [ledgerOptions]);

  // Memoize ungrouped ledger options
  const ungroupedLedgerOptions = useMemo(() => {
    return fullLedgerList;
  }, [fullLedgerList]);

  // Cache for filtered results to avoid recomputation
  const filterCache = useRef<Map<string, Ledger[]>>(new Map());

  // Generate cache key for filter combinations
  const getFilterCacheKey = useCallback((
    notAllowedGroups: string[],
    allowedGroups: string[],
    allowedLedgerIds?: Set<number>,
    notAllowedLedgerIds?: Set<number>
  ): string => {
    const notAllowedKey = [...notAllowedGroups].sort().join('|');
    const allowedKey = [...allowedGroups].sort().join('|');
    const allowedIdsKey = allowedLedgerIds
      ? Array.from(allowedLedgerIds).sort((a, b) => a - b).join('|')
      : '';
    const notAllowedIdsKey = notAllowedLedgerIds
      ? Array.from(notAllowedLedgerIds).sort((a, b) => a - b).join('|')
      : '';
    return `${notAllowedKey}|${allowedKey}|${allowedIdsKey}|${notAllowedIdsKey}`;
  }, []);

  // Optimized extractLedgers with memoization and caching
  const extractLedgers = useCallback((
    notAllowedGroups: string[],
    allowedGroups: string[],
    allowedLedgerIds?: Set<number>,
    notAllowedLedgerIds?: Set<number>
  ): Ledger[] => {
    if (!ledgerOptions) return [];

    // Generate cache key
    const cacheKey = getFilterCacheKey(notAllowedGroups, allowedGroups, allowedLedgerIds, notAllowedLedgerIds);
    
    // Check cache first
    const cached = filterCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build sets for O(1) lookups
    const notAllowedGroupsSet = new Set(notAllowedGroups);
    const allowedGroupsSet = new Set(allowedGroups);

    // Use requestIdleCallback or setTimeout to avoid blocking the main thread
    const result = buildLedgerList(
      ledgerOptions,
      notAllowedGroupsSet,
      allowedGroupsSet,
      allowedLedgerIds,
      notAllowedLedgerIds,
      null,
      false
    );

    // Cache the result (limit cache size to prevent memory issues)
    if (filterCache.current.size > 100) {
      // Clear old entries if cache gets too large
      const keys = Array.from(filterCache.current.keys());
      for (let i = 0; i < 50; i++) {
        filterCache.current.delete(keys[i]);
      }
    }
    filterCache.current.set(cacheKey, result);

    return result;
  }, [ledgerOptions, getFilterCacheKey]);

  // Clear cache when ledgerOptions change
  useEffect(() => {
    filterCache.current.clear();
  }, [ledgerOptions]);

  return (
    <LedgerSelectContext.Provider value={{ 
      ledgerOptions, 
      ungroupedLedgerOptions,
      extractLedgers,
      isLoaded: isFetched && !isLoading
    }}>
      {children}
    </LedgerSelectContext.Provider>
  );
}

export default LedgerSelectProvider;