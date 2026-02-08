'use client';

import React, { createContext, useContext } from 'react';

const LanguageContext = createContext<string>('en-US');

export const LanguageProvider = ({ 
  children,
  lang 
}: { 
  children: React.ReactNode;
  lang: string;
}) => {
  return (
    <LanguageContext.Provider value={lang}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);