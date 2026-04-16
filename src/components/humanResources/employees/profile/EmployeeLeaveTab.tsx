'use client';

import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import LeaveAllocations from './leaveAllocations/LeaveAllocations';
import LeaveRequests from './leaveRequests/LeaveRequests';

type LeaveSubTab = 'allocations' | 'requests';

export default function EmployeeLeaveTab({ employeeId }: { employeeId: number }) {
  const [subTab, setSubTab] = useState<LeaveSubTab>('allocations');

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        variant='scrollable'
        scrollButtons='auto'
        sx={{ mb: 2 }}
      >
        <Tab label='Leave Allocations' value='allocations' />
        <Tab label='Leave Requests' value='requests' />
      </Tabs>

      {subTab === 'allocations' && <LeaveAllocations employeeId={employeeId} />}
      {subTab === 'requests' && <LeaveRequests employeeId={employeeId} />}
    </Box>
  );
}
