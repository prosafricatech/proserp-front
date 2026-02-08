'use client';

import { Tab, Tabs, Box } from '@mui/material';
import React, { createContext, useEffect, useState } from 'react';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import SingleUserForm from './SingleUserForm';
import SingleTextMultiUsersForm from './SingleTextMultiUsersForm';
import MultiTextMultiUsersForm from './MultiTextMultiUsersForm';
import BalanceForm from './BalanceForm';
import DeliveryReportsForm from './DeliveryReportsForm';
import LogsForm from './LogsForm';

interface SelectedTabContextType {
  activeTab: number;
  setActiveTab?: (tab: number) => void;
}

export const SelectedTab = createContext<SelectedTabContextType>({ activeTab: 0 });

function NextSMS() {
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { label: 'Single User Text', component: <SingleUserForm/> },
    { label: 'Single Text → Multiple Users', component: <SingleTextMultiUsersForm/> },
    { label: 'Multiple Texts → Multiple Users', component: <MultiTextMultiUsersForm/> },
    { label: 'Delivery Reports', component: <DeliveryReportsForm/> },
    { label: 'Sent Logs', component: <LogsForm/> },
    { label: 'Check Balance', component: <BalanceForm/> }
  ];

  if (!mounted) return null;

  return (
    <SelectedTab.Provider value={{ activeTab, setActiveTab }}>
      <JumboCardQuick sx={{ height: '100%', p: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
        <Box sx={{ mt: 3 }}>
          {tabs[activeTab]?.component}
        </Box>
      </JumboCardQuick>
    </SelectedTab.Provider>
  );
}

export default NextSMS;
