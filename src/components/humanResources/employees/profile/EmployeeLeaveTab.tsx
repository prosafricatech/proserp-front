'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Box, Tab, Tabs } from '@mui/material';
import { useEffect, useState } from 'react';
import LeaveAllocations from './leaveAllocations/LeaveAllocations';
import LeaveRequests from './leaveRequests/LeaveRequests';

type LeaveSubTab = 'allocations' | 'requests';

export default function EmployeeLeaveTab({
  employeeId,
}: {
  employeeId: number;
}) {
  const { checkOrganizationPermission } = useJumboAuth();
  const [subTab, setSubTab] = useState<LeaveSubTab>('requests');
  const [canViewAllocations, setCanViewAllocations] = useState(false);
  const [canViewRequests, setCanViewRequests] = useState(false);

  useEffect(() => {
    setCanViewAllocations(
      checkOrganizationPermission(PERMISSIONS.LEAVE_ALLOCATIONS_READ)
    );
    setCanViewRequests(
      checkOrganizationPermission(PERMISSIONS.LEAVE_REQUESTS_READ)
    );
  }, [checkOrganizationPermission]);

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

      {subTab === 'allocations' && canViewAllocations && (
        <LeaveAllocations employeeId={employeeId} />
      )}
      {subTab === 'requests' && canViewRequests && (
        <LeaveRequests employeeId={employeeId} />
      )}
    </Box>
  );
}
