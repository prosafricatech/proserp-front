'use client'

import React, { lazy, useState, ReactNode, ReactElement } from 'react';
import { AdminPanelSettingsOutlined, PaymentOutlined, Person3Outlined } from '@mui/icons-material';
import { Tab, Tabs, Box } from '@mui/material';
import { useOrganizationProfile } from './OrganizationProfileProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div } from '@jumbo/shared';
import { Organization } from '@/types/auth-types';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const Subscriptions = lazy(() => import('./subscriptions/Subscriptions'));
const Users = lazy(() => import('./users/Users'));
const OrganizationRoles = lazy(() => import('./roles/OrganizationRoles'));

function TabPanel({ children, value, index }: { children: ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={2}>{children}</Box>}
    </div>
  );
}

export const ProfileTabs = () => {
  const dictionary = useDictionary();
  const [value, setValue] = useState<number>(0);

  const {
    authUser,
    authOrganization,
    checkOrganizationPermission,
  } = useJumboAuth();

  const { organization }: { organization?: Organization } = useOrganizationProfile();

  const isAuthOrganization = authOrganization?.organization?.id === organization?.id;
  const user = authUser?.user;

  const tabs: {
    label: string;
    icon: ReactElement;
    content: ReactNode;
  }[] = [];

  const canViewUsers = checkOrganizationPermission([
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_MANAGE,
  ]);

  const canManageRoles =
    isAuthOrganization &&
    checkOrganizationPermission([PERMISSIONS.ROLES_ADD, PERMISSIONS.ROLES_UPDATE]);

  const canManageSubscriptions =
    Number(user?.id) === 2 || Number(user?.id) === 3 || checkOrganizationPermission([PERMISSIONS.SUBSCRIPTIONS_MANAGE]);

  if (canViewUsers) {
    tabs.push({
      label: dictionary.organizations.profile.tabslabel.users,
      icon: <Person3Outlined />,
      content: <Users />,
    });
  }

  if (canManageRoles) {
    tabs.push({
      label: dictionary.organizations.profile.tabslabel.roles,
      icon: <AdminPanelSettingsOutlined />,
      content: <OrganizationRoles />,
    });
  }

  if (canManageSubscriptions) {
    tabs.push({
      label: dictionary.organizations.profile.tabslabel.subscriptions,
      icon: <PaymentOutlined />,
      content: <Subscriptions />,
    });
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Div>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            icon={tab.icon}
            iconPosition="start"
            label={tab.label}
            id={`tab-${index}`}
            aria-controls={`tabpanel-${index}`}
          />
        ))}
      </Tabs>

        {tabs.map((tab, index) => (
          <TabPanel key={index} value={value} index={index}>
            {tab.content}
          </TabPanel>
        ))}
    </Div>
  );
};
