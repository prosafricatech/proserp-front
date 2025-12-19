import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Organization } from '@/types/auth-types';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Grid, Typography } from '@mui/material';
import React from 'react';

interface Product {
  name: string;
}

interface SaleItem {
  product: Product;
  quantity: number;
  rate: number;
  vat_exempted?: number;
  measurement_unit: MeasurementUnit;
}

interface Sale {
  vat_percentage: number;
  sale_items: SaleItem[];
  amount: number;
  currency: Currency;
}

interface SaleReceiptOnScreenProps {
  sale: Sale;
  organization?: Organization;
}

const SaleReceiptOnScreen: React.FC<SaleReceiptOnScreenProps> = ({ sale, organization }) => {
  const { theme } = useJumboTheme();

  // Calculate VAT amounts
  const { vatAmount, totalWithVAT } = React.useMemo(() => {
    const totalForVAT = sale.sale_items
      .filter(item => item.vat_exempted !== 1)
      .reduce((total, item) => total + (item.rate * item.quantity), 0);

    const vat = totalForVAT * sale.vat_percentage / 100;
    return {
      vatAmount: vat,
      totalWithVAT: sale.amount + vat
    };
  }, [sale.sale_items, sale.vat_percentage, sale.amount]);

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: sale.currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculateItemTotal = (item: SaleItem) => {
    const vatFactor = item.vat_exempted !== 1 ? sale.vat_percentage * 0.01 : 0;
    return item.quantity * item.rate * (1 + vatFactor);
  };

  const formatItemPrice = (item: SaleItem) => {
    const vatFactor = item.vat_exempted !== 1 ? sale.vat_percentage * 0.01 : 0;
    return (item.rate * (1 + vatFactor)).toLocaleString();
  };

  return (
    <>
      {sale.sale_items.map((item, index) => (
        <Grid 
          container 
          key={`${item.product.name}-${index}`}
          borderBottom={1} 
          borderColor="#484848" 
          color={theme.type === 'dark' ? 'white' : 'black'}
          display="flex" 
          alignItems="flex-end"
          py={0.5}
        >
          <Grid size={12}>
            <Typography lineHeight={1.2} fontSize={12}>
              {item.product.name}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography lineHeight={1.2} fontSize={12}>
              {`${item.quantity} ${item.measurement_unit.symbol} × ${formatItemPrice(item)}`}
            </Typography>
          </Grid>
          <Grid size={6} textAlign="end">
            <Typography lineHeight={1.2} fontSize={12}>
              {formatCurrency(calculateItemTotal(item))}
            </Typography>
          </Grid>
        </Grid>
      ))}
      
      <Grid 
        container 
        mt={1} 
        borderBottom={1} 
        color={theme.type === 'dark' ? 'white' : 'black'} 
        display="flex" 
        alignItems="flex-end"
        py={0.5}
      >
        <Grid size={6}>
          <Typography lineHeight={1.2} fontSize={12} fontWeight="bold">
            Total
          </Typography>
        </Grid>
        <Grid size={6} textAlign="end">
          <Typography lineHeight={1.2} fontSize={12}>
            {formatCurrency(sale.amount)}
          </Typography>
        </Grid>
        
        {sale.vat_percentage > 0 && (
          <>
            <Grid size={6}>
              <Typography lineHeight={1.2} fontSize={12} fontWeight="bold">
                VAT
              </Typography>
            </Grid>
            <Grid size={6} textAlign="end">
              <Typography lineHeight={1.2} fontSize={12}>
                {formatCurrency(vatAmount)}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography lineHeight={1.2} fontSize={12} fontWeight="bold">
                Total (VAT Incl.)
              </Typography>
            </Grid>
            <Grid size={6} textAlign="end">
              <Typography lineHeight={1.2} fontSize={12}>
                {formatCurrency(totalWithVAT)}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
};

export default SaleReceiptOnScreen;