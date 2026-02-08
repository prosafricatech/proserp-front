import React, { createContext, useContext } from 'react';
import { Organization } from '@/types/auth-types';
import { Dayjs } from 'dayjs';
import { AdditionalFeature, Subscription, SubscriptionModule } from './SubscriptionTypes';

interface SubscriptionFormContextProps {
  subscription?: Subscription;
  totalAdditionalFeaturesMonthlyCost: number;
  totalModulesMonthly: number;
  setTotalAdditionalFeaturesAmount: (value: number) => void;
  totalAdditionalFeaturesAmount: number;
  additionalFeaturesSelected: AdditionalFeature[];
  setAdditionalFeaturesSelected: (features: AdditionalFeature[] | ((prev: AdditionalFeature[]) => AdditionalFeature[])) => void;
  Modules?: SubscriptionModule[];
  organization?: Organization;
  start_date: Dayjs | Date;
  userIsProsAfrican: boolean;
  modulesSelected: SubscriptionModule[];
  setModulesSelected: (modules: SubscriptionModule[] | ((prev: SubscriptionModule[]) => SubscriptionModule[])) => void;
  moduleValues: SubscriptionModule[];
  setModuleValues: (values: SubscriptionModule[] | ((prev: SubscriptionModule[]) => SubscriptionModule[])) => void;
  additionalFeatureValues: Record<string, any>;
  setAdditionalFeatureValues: (values: Record<string, any>) => void;
}

const SubscriptionFormContext = createContext<SubscriptionFormContextProps | undefined>(undefined);

export const SubscriptionFormProvider: React.FC<{
  value: SubscriptionFormContextProps;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <SubscriptionFormContext.Provider value={value}>
      {children}
    </SubscriptionFormContext.Provider>
  );
};

export const useSubscriptionFormContext = () => {
  const context = useContext(SubscriptionFormContext);
  if (!context) {
    throw new Error('useSubscriptionFormContext must be used within a SubscriptionFormProvider');
  }
  return context;
};