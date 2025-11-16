'use client';

import React from 'react';
import { Alert, Divider, Grid, Typography } from '@mui/material';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import ProductsProvider from '@/components/productAndServices/products/ProductsProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import StationProvider, { useSalesStation } from '../Stations/StationProvider';
import { Station } from '../Stations/StationType';
import StationSelector from '../Stations/StationSelector';
import SalesShiftList from './SalesShiftList';

const Toolbar = () => {
  const { setActiveStation } = useSalesStation();

  return (
    <Grid container columnSpacing={1} rowGap={2} justifyContent={'center'}>
      <Grid size={{xs: 12, md: 4}}>
        <StationSelector
          onChange={(newValue: Station | Station[] | null) => {
            if (newValue && !Array.isArray(newValue)) {
              setActiveStation(newValue);
            } else {
              setActiveStation(null);
            }
          }}
        />
      </Grid>
    </Grid>
  );
};

const SalesShiftContent = () => {
  const { activeStation } = useSalesStation(); 

  return (
    <>
      <Typography variant={'h4'} mb={2}>
        Sales Shifts
      </Typography>
      <JumboCardQuick
        sx={{ height: '100%' }}
        title={<Toolbar />}
      >
        {activeStation ? (
          <ProductsProvider>
            <ProductsSelectProvider>
              <LedgerSelectProvider>
                <StakeholderSelectProvider type='customers'>
                  <SalesShiftList/>
                </StakeholderSelectProvider>
              </LedgerSelectProvider>
            </ProductsSelectProvider>
          </ProductsProvider>
        ) : (
          <Alert severity='info' variant='outlined' sx={{ mt: -3 }}>
            Please select a station to view sales shifts
          </Alert>
        )}
      </JumboCardQuick>
    </>
  );
};

function SalesShifts() {
  return (
    <StationProvider>
      <SalesShiftContent /> 
    </StationProvider>
  );
}

export default SalesShifts;