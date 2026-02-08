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
  setValue,
  onFuelVouchersChange,
  cashierPumpProducts
}) {
    const { watch } = useFormContext();
    const productPrices = watch(`product_prices`) || [];

    useEffect(() => {
      const existingVouchers = watch(`cashiers.${cashierIndex}.fuel_vouchers`) || [];
      if (existingVouchers.length > 0 && localFuelVouchers.length === 0) {
        setLocalFuelVouchers(existingVouchers);
      }
    }, [cashierIndex, localFuelVouchers.length]);

    useEffect(() => {
      if (onFuelVouchersChange) {
        onFuelVouchersChange(localFuelVouchers);
      } else {
        setValue(`cashiers.${cashierIndex}.fuel_vouchers`, localFuelVouchers, {
            shouldValidate: true,
            shouldDirty: true
        });
      }
    }, [localFuelVouchers, cashierIndex]);

    return (
      <Box>
          <FuelVouchers
            productPrices={productPrices}
            fuelVouchers={localFuelVouchers}
            setFuelVouchers={setLocalFuelVouchers}
            cashierPumpProducts={cashierPumpProducts}
          />

          {localFuelVouchers.map((fuelVoucher, index) => (
            <FuelVouchersItemRow
              key={index}
              fuelVoucher={fuelVoucher}
              index={index}
              productPrices={productPrices}
              fuelVouchers={localFuelVouchers}
              setFuelVouchers={setLocalFuelVouchers}
              cashierPumpProducts={cashierPumpProducts}
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