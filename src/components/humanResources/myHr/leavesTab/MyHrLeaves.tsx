'use client';

import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import MyHrLeaveBalances from './leaveBalances/MyHrLeaveBalances';
import MyHrLeaveRequests from './leaveRequests/MyHrLeaveRequests';

type LeaveSubTab = 'balances' | 'requests';

export default function MyHrLeaves() {
  const [subTab, setSubTab] = useState<LeaveSubTab>('balances');

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        variant='scrollable'
        scrollButtons='auto'
        sx={{ mb: 2 }}
      >
        <Tab label='Leave Balances' value='balances' />
        <Tab label='Leave Requests' value='requests' />
      </Tabs>

      {subTab === 'balances' && <MyHrLeaveBalances />}
      {subTab === 'requests' && <MyHrLeaveRequests />}
    </Box>
  );
}
