'use client'

import React from 'react';
import ModuleSettings from '../../sharedComponents/ModuleSettings';
import { Card, Typography } from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

function PoSSettings() {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const active_subscriptions = organization?.active_subscriptions || [];

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get all modules from all subscriptions
  const modules = active_subscriptions.flatMap(
    (subscription) => subscription.modules.flatMap(
      (module) => module
    )
  );

  // Find the POS module (assuming ID 3 is POS)
  const posModule = modules.find((module) => Number(module.id) === 3);

  if (!posModule) {
    return (
      <Typography variant="h6" color="error">
        POS module not found in active subscriptions
      </Typography>
    );
  }

  if (!mounted) return null;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        {`${posModule.name} Settings`}
      </Typography>
      <Card sx={{ p: 2, mt: 2 }}>
        <ModuleSettings module={[posModule as any]} />
      </Card>
    </>
  );
}

export default PoSSettings;