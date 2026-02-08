'use client'

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import JumboCardQuick from '@jumbo/components/JumboCardQuick'
import { AdminPanelSettingsOutlined } from '@mui/icons-material';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import { Tab, Tabs, Typography } from '@mui/material';
import React, { lazy, SyntheticEvent, useEffect, useState } from 'react'

const ProsAfricansList = lazy(() => import('./ProsAfricansList'));
const ProsAfricansRoles = lazy(() => import('./roles/ProsAfricanRoles'));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  [key: string]: any;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
      <Typography
        component="div"
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        {...other}
      >
        {children}
      </Typography>
    );
}

function ProsAfricans() {
  const [value, setValue] = useState(0);  
  const { checkPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ⛔ Prevent mismatch during hydration

  if (!checkPermission(['ProsAfricans:Read', 'ProsAfricans:Manage'])) {
    return <UnauthorizedAccess/>;
  }

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <JumboCardQuick
      noWrapper
      sx={{ 
        height: '100%'
      }}
    >
      <Tabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons='auto'
        allowScrollButtonsMobile
      >
        <Tab icon={<Diversity3OutlinedIcon/>} iconPosition="start" label="ProsAfricans"/>
        <Tab icon={<AdminPanelSettingsOutlined/>} iconPosition="start" label="Roles"/>
      </Tabs>
      
      <TabPanel value={value} index={0}>
        <ProsAfricansList/>
      </TabPanel>

      <TabPanel value={value} index={1} p={2}>
        <ProsAfricansRoles/>
      </TabPanel>
    </JumboCardQuick>
  );
}

export default ProsAfricans;