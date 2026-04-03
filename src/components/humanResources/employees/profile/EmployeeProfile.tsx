'use client';

import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { Card, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import EmployeeAllowances from '../../employeeAllowances/EmployeeAllowances';
import EmployeeBankAccounts from '../../employeeBankAccounts/EmployeeBankAccounts';
import EmployeeDeductions from '../../employeeDeductions/EmployeeDeductions';
import EmployeesContracts from '../../employeesContracts/EmployeesContracts';
import LeaveAllocations from '../../leaveAllocations/LeaveAllocations';
import LeaveRequests from '../../leaveRequests/LeaveRequests';
import NextOfKins from '../../nextOfKins/NextOfKins';
import { EmployeesProvider } from '../EmployeesProvider';
import { DesignationsProvider } from '../../designations/DesignationsProvider';
import EmployeeProfileProvider, { useEmployeeProfile } from './EmployeeProfileProvider';

type TabKey =
  | 'contracts'
  | 'bankAccounts'
  | 'nextOfKin'
  | 'allowances'
  | 'deductions'
  | 'leaveAllocations'
  | 'leaveRequests';

const VALID_TABS: TabKey[] = [
  'contracts',
  'bankAccounts',
  'nextOfKin',
  'allowances',
  'deductions',
  'leaveAllocations',
  'leaveRequests',
];

function ProfileContent() {
  const { employee } = useEmployeeProfile();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('employeeProfileActiveTab') as TabKey;
      return saved && VALID_TABS.includes(saved) ? saved : 'contracts';
    }
    return 'contracts';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('employeeProfileActiveTab', activeTab);
    }
  }, [activeTab]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabKey) => {
    setActiveTab(newValue);
  };

  const employeeId = employee?.id;

  const renderTabContent = useMemo(() => {
    if (!employeeId) {
      return (
        <Stack spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant='rectangular' width='100%' height={48} sx={{ borderRadius: 1 }} />
          ))}
        </Stack>
      );
    }

    switch (activeTab) {
      case 'contracts':
        return (
          <DesignationsProvider>
            <EmployeesContracts employeeId={employeeId} />
          </DesignationsProvider>
        );
      case 'bankAccounts':
        return <EmployeeBankAccounts employeeId={employeeId} />;
      case 'nextOfKin':
        return <NextOfKins employeeId={employeeId} />;
      case 'allowances':
        return <EmployeeAllowances employeeId={employeeId} />;
      case 'deductions':
        return <EmployeeDeductions employeeId={employeeId} />;
      case 'leaveAllocations':
        return <LeaveAllocations employeeId={employeeId} />;
      case 'leaveRequests':
        return <LeaveRequests employeeId={employeeId} />;
      default:
        return null;
    }
  }, [activeTab, employeeId]);

  const fullName = employee
    ? `${employee.first_name ?? ''} ${employee.middle_name ?? ''} ${employee.last_name ?? ''}`.trim()
    : '';

  return (
    <JumboContentLayout
      header={
        <Stack direction='row' alignItems='center' spacing={1}>
          <Stack>
            <Typography variant='h4'>{fullName}</Typography>
            <Typography variant='body1' color='text.secondary'>
              {employee?.email}
            </Typography>
          </Stack>
        </Stack>
      }
    >
      <Card sx={{ height: '100%', p: 1 }}>
        <Stack spacing={1}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant='scrollable'
            scrollButtons='auto'
            allowScrollButtonsMobile
          >
            <Tab label='Contracts' value='contracts' />
            <Tab label='Bank Accounts' value='bankAccounts' />
            <Tab label='Next of Kin' value='nextOfKin' />
            <Tab label='Allowances' value='allowances' />
            <Tab label='Deductions' value='deductions' />
            <Tab label='Leave Allocations' value='leaveAllocations' />
            <Tab label='Leave Requests' value='leaveRequests' />
          </Tabs>

          {renderTabContent}
        </Stack>
      </Card>
    </JumboContentLayout>
  );
}

export default function EmployeeProfile() {
  return (
    <EmployeeProfileProvider>
      <EmployeesProvider>
        <ProfileContent />
      </EmployeesProvider>
    </EmployeeProfileProvider>
  );
}

