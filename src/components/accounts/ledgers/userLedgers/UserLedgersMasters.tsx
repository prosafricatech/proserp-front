'use client';

import React from 'react';
import { Tab, Tabs, Typography } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UserLedgerLinksList from './UserLedgerLinksList';
import UserLedgerPaymentsList from './UserLedgerPaymentsList';

export default function UserLedgersMasters() {
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const [activeTab, setActiveTab] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
    return <UnsubscribedAccess modules={'Accounts & Finance'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.ACCOUNTS_MASTERS_READ, PERMISSIONS.ACCOUNTS_MASTERS_EDIT])) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Typography variant="h4" mb={2}>User Ledgers</Typography>
      <Tabs value={activeTab} onChange={(_event, newValue) => setActiveTab(newValue)} sx={{ mb: 1 }}>
        <Tab label="Ledger Links" />
        <Tab label="Ledger Payments" />
      </Tabs>
      {activeTab === 0 ? <UserLedgerLinksList /> : <UserLedgerPaymentsList />}
    </>
  );
}
