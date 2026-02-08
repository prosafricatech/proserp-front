'use client'
import React, { createContext, useContext, useReducer, useCallback, ReactNode, Dispatch, useEffect, useState } from 'react';
import TransactionsList from './TransactionsList';
import LedgerSelectProvider from '../ledgers/forms/LedgerSelectProvider';
import CurrencySelectProvider from '../../masters/Currencies/CurrencySelectProvider';
import { Transaction } from './TransactionTypes';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';

type TransactionsAppState = {
  selectedTransactions: Transaction[];
  refreshTransactionsList: boolean;
};

type TransactionsAppAction =
  | { type: 'set-selected-items'; payload: Transaction[] }
  | { type: 'set-transactions-list-refresh'; payload: boolean };

type TransactionsContextType = TransactionsAppState & {
  setSelectedTransactions: (transactions: Transaction[]) => void;
  setTransactionsListRefresh: (refresh: boolean) => void;
};

// -----------------------------
// Context
// -----------------------------

export const TransactionsAppContext = createContext<TransactionsContextType | undefined>(undefined);

export const useTransactionApp = (): TransactionsContextType => {
  const context = useContext(TransactionsAppContext);
  if (!context) {
    throw new Error('useTransactionApp must be used within a TransactionsAppContext.Provider');
  }
  return context;
};

// -----------------------------
// Constants & Reducer
// -----------------------------

const TRANSACTION_ACTIONS = {
  SET_SELECTED_ITEMS: 'set-selected-items',
  SET_TRANSACTION_LIST_REFRESH: 'set-transactions-list-refresh',
} as const;

const init = (appState: TransactionsAppState): TransactionsAppState => appState;

const TransactionReducer = (state: TransactionsAppState, action: TransactionsAppAction): TransactionsAppState => {
  switch (action.type) {
    case TRANSACTION_ACTIONS.SET_SELECTED_ITEMS:
      return { ...state, selectedTransactions: action.payload };
    case TRANSACTION_ACTIONS.SET_TRANSACTION_LIST_REFRESH:
      return { ...state, refreshTransactionsList: action.payload };
    default:
      return state;
  }
};

// -----------------------------
// Component
// -----------------------------

export default function Transactions() {
  const [mounted, setMounted] = useState(false);

  const [transactionsApp, dispatch] = useReducer(TransactionReducer, {
    selectedTransactions: [],
    refreshTransactionsList: false,
  }, init);

  const setSelectedTransactions = useCallback((transactions: Transaction[]) => {
    dispatch({ type: TRANSACTION_ACTIONS.SET_SELECTED_ITEMS, payload: transactions });
  }, []);

  const setTransactionsListRefresh = useCallback((refresh: boolean) => {
    dispatch({ type: TRANSACTION_ACTIONS.SET_TRANSACTION_LIST_REFRESH, payload: refresh });
  }, []);

  const contextValue: TransactionsContextType = {
    ...transactionsApp,
    setSelectedTransactions,
    setTransactionsListRefresh,
  };

  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
    return <UnsubscribedAccess modules="Accounts & Finance" />;
  }

  if (!checkOrganizationPermission([
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_READ,
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_CREATE,
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_DELETE,
      PERMISSIONS.ACCOUNTS_TRANSACTIONS_EDIT,
      PERMISSIONS.PAYMENTS_READ,
      PERMISSIONS.PAYMENTS_CREATE,
      PERMISSIONS.PAYMENTS_EDIT,
      PERMISSIONS.PAYMENTS_DELETE,
      PERMISSIONS.FUND_TRANSFERS_READ,
      PERMISSIONS.FUND_TRANSFERS_CREATE,
      PERMISSIONS.FUND_TRANSFERS_DELETE,
      PERMISSIONS.FUND_TRANSFERS_EDIT,
      PERMISSIONS.RECEIPTS_READ,
      PERMISSIONS.RECEIPTS_EDIT,
      PERMISSIONS.RECEIPTS_CREATE,
      PERMISSIONS.RECEIPTS_DELETE,
      PERMISSIONS.JOURNAL_VOUCHERS_READ,
      PERMISSIONS.JOURNAL_VOUCHERS_CREATE,
      PERMISSIONS.JOURNAL_VOUCHERS_DELETE,
      PERMISSIONS.JOURNAL_VOUCHERS_EDIT
    ])) {
    return <UnauthorizedAccess />;
  }

  return (
    <TransactionsAppContext.Provider value={contextValue}>
      <CurrencySelectProvider>
        <LedgerSelectProvider>
          <TransactionsList />
        </LedgerSelectProvider>
      </CurrencySelectProvider>
    </TransactionsAppContext.Provider>
  );
}
