'use client';

import { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import CreateLedgerGroup from "./CreateLedgerGroup";
import LedgerGroupProvider from "./LedgerGroupProvider";
import LedgerGroupTree from "./LedgerGroupTree";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { PERMISSIONS } from "@/utilities/constants/permissions";
import { MODULES } from "@/utilities/constants/modules";
import UnsubscribedAccess from "@/shared/Information/UnsubscribedAccess";
import UnauthorizedAccess from "@/shared/Information/UnauthorizedAccess";

export default function LedgerGroup() {
    const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // ⛔ Prevent mismatch during hydration

    if (!organizationHasSubscribed(MODULES.ACCOUNTS_AND_FINANCE)) {
        return <UnsubscribedAccess modules={'Accounts & Finance'} />;
    }

    if (
        !(
            checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_READ) ||
            checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_CREATE)
        )
    ) {
        return <UnauthorizedAccess />;
    }

    return (
        <LedgerGroupProvider>
            <Typography component="h4" sx={{ mb: 2 }}>Ledger Groups</Typography>
            <Grid container spacing={2}>
                {checkOrganizationPermission(PERMISSIONS.ACCOUNTS_MASTERS_CREATE) && (
                    <Grid size={{xs: 12, md: 6}}>
                        <CreateLedgerGroup />
                    </Grid>
                )}
                <Grid size={{xs: 12, md: 6}}>
                    <LedgerGroupTree />
                </Grid>
            </Grid>
        </LedgerGroupProvider>
    );
}
