'use client'
import React, { createContext, useContext } from 'react';

export const LangContext = createContext({
  t: (key) => key,
});

export const LangProvider = ({ children, translations }) => {
  const t = (key) => translations[key] || key;

  return (
    <LangContext.Provider value={{ t }}>
      {children}
    </LangContext.Provider>
  );
};
