"use client";

import { useEffect } from 'react';
import { 
  Typography,
  Box,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import FuelVouchers from './FuelVouchers';
import FuelVouchersItemRow from './FuelVouchersItemRow';

function FuelVouchersTab({ 
  cashierIndex, 
  localFuelVouchers, 
  setLocalFuelVouchers,
  setValue 
}) {
    const { watch } = useFormContext();
    const productPrices = watch(`product_prices`) || [];

    useEffect(() => {
      setValue(`cashiers.${cashierIndex}.fuel_vouchers`, localFuelVouchers, {
          shouldValidate: true,
          shouldDirty: true
      });
    }, [localFuelVouchers, cashierIndex, setValue]);

  return (
    <Box>
        <FuelVouchers
          productPrices={productPrices}
          fuelVouchers={localFuelVouchers}
          setFuelVouchers={setLocalFuelVouchers}
        />

        {localFuelVouchers.map((fuelVoucher, index) => (
          <FuelVouchersItemRow
            fuelVoucher={fuelVoucher}
            index={index}
            productPrices={productPrices}
            fuelVouchers={localFuelVouchers}
            setFuelVouchers={setLocalFuelVouchers}
          />
        ))}
      
      {localFuelVouchers.length === 0 && (
        <Typography color="textSecondary" textAlign="center" py={4}>
          No fuel vouchers added for this cashier yet. Add one using the form above.
        </Typography>
      )}
    </Box>
  );
}

export default FuelVouchersTab;