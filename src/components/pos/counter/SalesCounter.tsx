'use client'

import React, { useEffect } from 'react'
import { Typography } from '@mui/material'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { Div } from '@jumbo/shared';

const CounterProvider = React.lazy(() => import('./CounterProvider'));
const CounterSelector = React.lazy(() => import('./CounterSelector'));
const CounterSalesList = React.lazy(() => import('./CounterSalesList'));

function SalesCounter() {
  const {checkOrganizationPermission} = useJumboAuth();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.title = 'Sales Counter';
  }, []);

  if (!mounted) return null;

  if(!checkOrganizationPermission(PERMISSIONS.SALES_READ)){
    return <UnauthorizedAccess/>;
  }

  return (
    <CounterProvider>
      <Typography variant={'h4'} mb={2}>Sales Counter</Typography>
      <Div
          sx={{ 
            backgroundColor: 'background.paper',
            paddingTop:'15px',
            paddingX: '5px',
            borderRadius: '10px',
            height: '100%' 
          }}
      >
        <CounterSelector/>
        <CounterSalesList/>
      </Div>
    </CounterProvider>
  )
}

export default SalesCounter