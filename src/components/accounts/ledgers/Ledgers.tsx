'use client';

import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import LedgersList from './list/LedgersList';
import LedgerGroupProvider from '../ledgerGroups/LedgerGroupProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';

export default function Ledgers() {
    const { organizationHasSubscribed } = useJumboAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
        return <UnsubscribedAccess modules={'Accounts & Finance'} />;
    }

    return (
        <LedgerGroupProvider>
            <Typography variant="h4" mb={2}>Ledgers</Typography>
            <LedgersList />
        </LedgerGroupProvider>
    );
}
