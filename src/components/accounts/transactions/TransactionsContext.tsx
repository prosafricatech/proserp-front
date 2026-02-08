'use client'

import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { Transaction } from './TransactionTypes';

type TransactionsAppState = {
  selectedTransactions: Transaction[];
  refreshTransactionsList: boolean;
};

type TransactionsAppAction =
  | { type: 'SET_SELECTED_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_REFRESH_TRANSACTIONS'; payload: boolean };

type TransactionsContextType = {
  state: TransactionsAppState;
  dispatch: Dispatch<TransactionsAppAction>;
};

const TransactionsAppContext = createContext<TransactionsContextType | undefined>(undefined);

const transactionReducer = (state: TransactionsAppState, action: TransactionsAppAction): TransactionsAppState => {
  switch (action.type) {
    case 'SET_SELECTED_TRANSACTIONS':
      return { ...state, selectedTransactions: action.payload };
    case 'SET_REFRESH_TRANSACTIONS':
      return { ...state, refreshTransactionsList: action.payload };
    default:
      return state;
  }
};

export const TransactionsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(transactionReducer, {
    selectedTransactions: [],
    refreshTransactionsList: false,
  });

  return (
    <TransactionsAppContext.Provider value={{ state, dispatch }}>
      {children}
    </TransactionsAppContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionsAppContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};