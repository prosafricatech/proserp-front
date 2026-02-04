'use client';

import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { Divider, Grid, Typography } from '@mui/material';
import CurrencySelectProvider from '../../masters/currencies/CurrencySelectProvider';
import StakeholderSelectProvider from '../../masters/stakeholders/StakeholderSelectProvider';
import ProductsProvider from '../../productAndServices/products/ProductsProvider';
import ProductsSelectProvider from '../../productAndServices/products/ProductsSelectProvider';
import OutletProvider, { useSalesOutlet } from '../outlet/OutletProvider';
import OutletSelector from '../outlet/OutletSelector';
import { Outlet } from '../outlet/OutletType';
import ProformaInvoicesList from './ProformaInvoicesList';

const Toolbar = () => {
  const { setActiveOutlet } = useSalesOutlet();

  return (
    <Grid container columnSpacing={1} rowGap={2} justifyContent={'center'}>
      <Grid size={{ xs: 12, md: 4 }}>
        <OutletSelector
          onChange={(newValue: Outlet | Outlet[] | null) => {
            if (newValue && !Array.isArray(newValue)) {
              setActiveOutlet(newValue as any);
            } else {
              setActiveOutlet(null);
            }
          }}
        />
      </Grid>
      <Grid size={12}>
        <Divider />
      </Grid>
    </Grid>
  );
};

function ProformaInvoices() {
  return (
    <OutletProvider>
      <Typography variant={'h4'} mb={2}>
        Proforma Invoices
      </Typography>
      <JumboCardQuick sx={{ height: '100%' }} title={<Toolbar />}>
        <ProductsProvider>
          <ProductsSelectProvider>
            <StakeholderSelectProvider type='customers'>
              <CurrencySelectProvider>
                <ProformaInvoicesList />
              </CurrencySelectProvider>
            </StakeholderSelectProvider>
          </ProductsSelectProvider>
        </ProductsProvider>
      </JumboCardQuick>
    </OutletProvider>
  );
}

export default ProformaInvoices;
