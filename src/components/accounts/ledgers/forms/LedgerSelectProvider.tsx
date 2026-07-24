'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback, useRef } from 'react';
import ledgerServices from '../ledger-services';
import { useQuery } from '@tanstack/react-query';

// ✅ Updated Ledger interface with currency fields
interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
  currency_id?: number | null;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol: string;
    name_plural: string;
    symbol_native: string;
  } | null;
}

// ✅ Updated LedgerGroup interface (optional - if groups can have currency)
interface LedgerGroup {
  nature_id: number;
  original_name: string;
  ledgers?: Ledger[];
  children_with_ledgers?: LedgerGroup[];
  currency_id?: number | null;  // Optional
  currency?: {                 // Optional
    id: number;
    name: string;
    code: string;
    symbol: string;
  } | null;
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

interface IndexedLedgerRecord {
  ledgerId: number;
  projectedLedger: Ledger;
  groupPath: string[];
}

interface PathBucket {
  groupPath: string[];
  ledgers: IndexedLedgerRecord[];
}

// Build once: flattened ledger records with group path metadata.
// Filtering is done later without recursive traversal or re-spreading objects.
function buildLedgerIndex(groups: LedgerGroup[] | undefined): IndexedLedgerRecord[] {
  if (!groups || groups.length === 0) return [];

  const result: IndexedLedgerRecord[] = [];
  const currentPath: string[] = [];

  const walk = (currentGroups: LedgerGroup[], parentNatureId: number | null) => {
    for (const group of currentGroups) {
      const currentNatureId = parentNatureId ?? group.nature_id;
      currentPath.push(group.original_name);

      if (group.ledgers && group.ledgers.length > 0) {
        for (const ledger of group.ledgers) {
          result.push({
            ledgerId: ledger.id,
            projectedLedger: {
              ...ledger,  // ✅ Preserves all fields including currency
              nature_id: currentNatureId,
            },
            groupPath: currentPath.slice(),
          });
        }
      }

      if (group.children_with_ledgers && group.children_with_ledgers.length > 0) {
        walk(group.children_with_ledgers, currentNatureId);
      }

      currentPath.pop();
    }
  };

  walk(groups, null);
  return result;
}

// Mirrors previous recursive accessibility logic exactly, but runs over precomputed paths.
function isLedgerPathAccessible(
  groupPath: string[],
  notAllowedGroupsSet: Set<string>,
  allowedGroupsSet: Set<string>
): boolean {
  let inheritedAllowed = false;

  for (let i = 0; i < groupPath.length; i++) {
    const groupName = groupPath[i];
    const isGroupBlocked = notAllowedGroupsSet.has(groupName);
    const isGroupAllowed: boolean =
      allowedGroupsSet.size === 0 || allowedGroupsSet.has(groupName);
    const isAccessible: boolean =
      !isGroupBlocked && (isGroupAllowed || inheritedAllowed);

    if (i === groupPath.length - 1) {
      return isAccessible;
    }

    inheritedAllowed = isAccessible || inheritedAllowed;
  }

  return false;
}

function LedgerSelectProvider({ children }: LedgerSelectProviderProps) {
  const { data: ledgerOptions, isFetched, isLoading } = useQuery<LedgerGroup[]>({
    queryKey: ['ledgerOptions'],
    queryFn: ledgerServices.getLedgerOptions,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Build searchable/indexed ledger records once per options refresh.
  const indexedLedgers = useMemo(() => {
    return buildLedgerIndex(ledgerOptions);
  }, [ledgerOptions]);

  // Memoize ungrouped ledger options
  const ungroupedLedgerOptions = useMemo(() => {
    return indexedLedgers.map((record) => record.projectedLedger);
  }, [indexedLedgers]);

  // Group ledgers by unique path once so access checks run per-path, not per-ledger.
  const pathBuckets = useMemo<PathBucket[]>(() => {
    if (indexedLedgers.length === 0) return [];

    const bucketMap = new Map<string, PathBucket>();
    for (const record of indexedLedgers) {
      const pathKey = record.groupPath.join('>');
      let bucket = bucketMap.get(pathKey);
      if (!bucket) {
        bucket = {
          groupPath: record.groupPath,
          ledgers: [],
        };
        bucketMap.set(pathKey, bucket);
      }
      bucket.ledgers.push(record);
    }

    return Array.from(bucketMap.values());
  }, [indexedLedgers]);

  // Cache for filtered results to avoid recomputation
  const filterCache = useRef<Map<string, Ledger[]>>(new Map());
  const setKeyCache = useRef<WeakMap<Set<number>, string>>(new WeakMap());

  const getSetKey = useCallback((setValues?: Set<number>): string => {
    if (!setValues || setValues.size === 0) return '';

    const cachedKey = setKeyCache.current.get(setValues);
    if (cachedKey) return cachedKey;

    // Keep linear complexity for very large sets; order affects cache hit-rate, not correctness.
    const key = Array.from(setValues).join('|');
    setKeyCache.current.set(setValues, key);
    return key;
  }, []);

  // Generate cache key for filter combinations
  const getFilterCacheKey = useCallback((
    notAllowedGroups: string[],
    allowedGroups: string[],
    allowedLedgerIds?: Set<number>,
    notAllowedLedgerIds?: Set<number>
  ): string => {
    const notAllowedKey = [...notAllowedGroups].sort().join('|');
    const allowedKey = [...allowedGroups].sort().join('|');
    const allowedIdsKey = getSetKey(allowedLedgerIds);
    const notAllowedIdsKey = getSetKey(notAllowedLedgerIds);
    return `${notAllowedKey}|${allowedKey}|${allowedIdsKey}|${notAllowedIdsKey}`;
  }, [getSetKey]);

  // Optimized extractLedgers with memoization and caching
  const extractLedgers = useCallback((
    notAllowedGroups: string[],
    allowedGroups: string[],
    allowedLedgerIds?: Set<number>,
    notAllowedLedgerIds?: Set<number>
  ): Ledger[] => {
    if (!indexedLedgers || indexedLedgers.length === 0) return [];

    const hasAllowedGroups = allowedGroups.length > 0;
    const hasNotAllowedGroups = notAllowedGroups.length > 0;
    const hasAllowedLedgerIds = !!allowedLedgerIds && allowedLedgerIds.size > 0;
    const hasNotAllowedLedgerIds =
      !!notAllowedLedgerIds && notAllowedLedgerIds.size > 0;

    // Fast path for the most common case: no filters at all.
    if (
      !hasAllowedGroups &&
      !hasNotAllowedGroups &&
      !hasAllowedLedgerIds &&
      !hasNotAllowedLedgerIds
    ) {
      return ungroupedLedgerOptions;
    }

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

    const result: Ledger[] = [];
    for (const bucket of pathBuckets) {
      if (
        !isLedgerPathAccessible(
          bucket.groupPath,
          notAllowedGroupsSet,
          allowedGroupsSet
        )
      ) {
        continue;
      }

      for (const record of bucket.ledgers) {
        const ledgerId = record.ledgerId;

        if (hasNotAllowedLedgerIds && notAllowedLedgerIds!.has(ledgerId)) continue;
        if (hasAllowedLedgerIds && !allowedLedgerIds!.has(ledgerId)) continue;

        result.push(record.projectedLedger);
      }
    }

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
  }, [indexedLedgers, pathBuckets, getFilterCacheKey, ungroupedLedgerOptions]);

  // Clear cache when ledgerOptions change
  useEffect(() => {
    filterCache.current.clear();
    setKeyCache.current = new WeakMap();
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