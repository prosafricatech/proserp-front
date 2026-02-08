'use client';
import { JumboConfigContextType } from '@jumbo/types';
import React from 'react';
import { JumboConfigContext } from './JumboConfigContext';
import { SessionProvider } from 'next-auth/react';

type JumboConfigProviderProps = JumboConfigContextType & {
  children: React.ReactNode;
};

function JumboConfigProvider({ children, ...props }: JumboConfigProviderProps) {
  return (
    <SessionProvider>
      <JumboConfigContext.Provider value={{ ...props }}>
        {children}
      </JumboConfigContext.Provider>
    </SessionProvider>
  );
}

export { JumboConfigProvider };
