import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SpinnerContextType {
  show: boolean;
  setShow: (show: boolean) => void;
}

const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);

export const useSpinner = () => {
  const context = useContext(SpinnerContext);
  if (!context) {
    throw new Error('useSpinner must be used within a SpinnerProvider');
  }
  return context;
};

export const SpinnerProvider = ({ children }: { children: ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <SpinnerContext.Provider value={{ show, setShow }}>
      {children}
    </SpinnerContext.Provider>
  );
};
