'use client';

import React, { createContext, useContext } from 'react';
import { Dictionary } from '@/dictionaries/type';

const DictionaryContext = createContext<Dictionary | null>(null);

export const DictionaryProvider = ({ 
  dictionary, 
  children 
}: { 
  dictionary: Dictionary; 
  children: React.ReactNode 
}) => {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionary = () => {
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return dictionary;
};