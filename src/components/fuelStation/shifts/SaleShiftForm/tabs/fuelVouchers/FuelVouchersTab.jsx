"use client";

import { 
  Typography,
  Box,
} from '@mui/material';
import FuelVouchers from './FuelVouchers';
import FuelVouchersItemRow from './FuelVouchersItemRow';

function FuelVouchersTab({ 
  localFuelVouchers, 
  setLocalFuelVouchers,
  cashierPumpProducts,
  watch
}) {
    const productPrices = watch(`product_prices`) || [];
    const safeFuelVouchers = Array.isArray(localFuelVouchers) ? localFuelVouchers : [];

    return (
      <Box>
          <FuelVouchers
            productPrices={productPrices}
            fuelVouchers={safeFuelVouchers}
            setFuelVouchers={setLocalFuelVouchers}
            cashierPumpProducts={cashierPumpProducts}
          />

          {safeFuelVouchers.map((fuelVoucher, index) => (
            <FuelVouchersItemRow
              key={index}
              fuelVoucher={fuelVoucher}
              index={index}
              productPrices={productPrices}
              fuelVouchers={safeFuelVouchers}
              setFuelVouchers={setLocalFuelVouchers}
              cashierPumpProducts={cashierPumpProducts}
            />
          ))}
        
        {safeFuelVouchers.length === 0 && (
          <Typography color="textSecondary" textAlign="center" py={4}>
            No fuel vouchers added for this cashier yet. Add one using the form above.
          </Typography>
        )}
      </Box>
    );
}

export default FuelVouchersTab;