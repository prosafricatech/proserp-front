'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import JumboContentLayout from '@jumbo/components/JumboContentLayout';
import { LinkOffOutlined } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import MyHrContracts from './contractsTab/MyHrContracts';
import MyHrNextOfKin from './nextOfKinTab/MyHrNextOfKin';
import MyHrPayslips from './payslipsTab/MyHrPayslips';
import MyHrProfile from './profileTab/MyHrProfile';
type TabKey =
  | 'profile'
  | 'payslips'
  | 'leave'
  | 'contracts'
  | 'nextOfKins'
  | 'accountStatement'
  | 'imprestAccounts';

const VALID_TABS: TabKey[] = [
  'profile',
  'payslips',
  'leave',
  'contracts',
  'nextOfKins',
  'accountStatement',
  'imprestAccounts',
];

const MyHr = () => {
  const { authUser } = useJumboAuth();
  const user = authUser?.user;
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [isClient, setIsClient] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [errStatus, setErrStatus] = useState<number | null | undefined>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabKey) => {
    setActiveTab(newValue);
  };

  // get profile data
  const {
    data: profile,
    isLoading,
    error: profileError,
    isError,
  } = useQuery({
    queryKey: ['showMyHr'],
    queryFn: async () => await humanResourcesServices.myHrProfile(),
    enabled: !!user,
  });

  // Only render tab content on the client
  const renderTabContent = () => {
    if (!isClient) {
      return (
        <Stack spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      );
    }

    // On the client, after hydration, check authUser
    if (!authUser) {
      return (
        <Stack spacing={2} sx={{ width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant='rectangular'
              width='100%'
              height={48}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      );
    }

    switch (activeTab) {
      case 'profile':
        return <MyHrProfile profile={profile} isLoading={profileLoading} />;
      case 'payslips':
        return <MyHrPayslips />;
      case 'leave':
        return <div>Leave Content</div>;
      case 'contracts':
        return <MyHrContracts />;
      case 'nextOfKins':
        return <MyHrNextOfKin />;
      case 'accountStatement':
        return <div>Account Statement Content</div>;
      case 'imprestAccounts':
        return <div>Imprest Accounts Content</div>;
      default:
        return null;
    }
  };
  // }, [activeTab, authUser, isClient, isLoading]);

  useEffect(() => {
    if (isLoading) {
      setProfileLoading(true);
    }
    if (isError || profileError || !isLoading) {
      setProfileLoading(false);
    }
    if (axios.isAxiosError(profileError)) {
      setErrStatus(profileError?.status);
    }
  }, [profileError, isLoading]);

  return (
    <JumboContentLayout
      header={
        <Stack
          direction='row'
          alignItems='flex-start'
          spacing={2}
          flexWrap='wrap'
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: 24,
            }}
          >
            {isClient ? (user?.name?.[0] ?? '-') : '-'}
          </Avatar>
          <Stack flex={1} spacing={0.25}>
            <Typography variant='h4'>{isClient ? user?.name : ''}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {isClient ? user?.email : ''}
            </Typography>
          </Stack>
        </Stack>
      }
    >
      {errStatus && errStatus === 404 ? (
        <Card sx={{ height: '100%', p: 1 }}>
          <Box
            width={'100%'}
            height={'100%'}
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <LinkOffOutlined
              sx={{ width: 50, height: 50, textAlign: 'center' }}
            />
            <Typography textAlign={'center'} fontSize={15}>
              Your account is not linked to an employee record. contact HR.
            </Typography>
          </Box>
        </Card>
      ) : (
        <Card sx={{ height: '100%', p: 1 }}>
          <Stack spacing={1}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant='scrollable'
              scrollButtons='auto'
              allowScrollButtonsMobile
            >
              <Tab label='Profile' value='profile' />
              <Tab label='Payslips' value='payslips' />
              <Tab label='Leave' value='leave' />
              <Tab label='contracts' value='contracts' />
              <Tab label='Next of Kin' value='nextOfKins' />
              <Tab label='Account Statement' value='accountStatement' />
              <Tab label='Imprest Accounts' value='imprestAccounts' />
            </Tabs>

            {renderTabContent()}
          </Stack>
        </Card>
      )}
    </JumboContentLayout>
  );
};

export default MyHr;
