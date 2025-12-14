import { DisabledByDefault, EditOutlined } from '@mui/icons-material'
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form';
import FuelVouchers from './FuelVouchers';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { FuelVoucher, ProductPrice } from '../../SalesShiftTypes';
import Products from '@/components/productAndServices/products/Products';
interface FuelVouchersItemRowProps {
  fuelVoucher: FuelVoucher;
  index: number;
  productPrices: ProductPrice[];
  fuelVouchers: FuelVoucher[];
  setFuelVouchers: (
    vouchers: FuelVoucher[] | ((prev: FuelVoucher[]) => FuelVoucher[])
  ) => void;
}

const FuelVouchersItemRow: React.FC<FuelVouchersItemRowProps> = ({
  fuelVoucher,
  index,
  productPrices,
  fuelVouchers = [],
  setFuelVouchers,
}) => {
  const [showForm, setShowForm] = useState(false);

  const { productOptions = [] } = useProductsSelect();

  const product = productOptions.find((p) => p.id === fuelVoucher.product_id);
  const client = fuelVoucher.stakeholder;
  const expenseLedger = fuelVoucher.expense_ledger;
  const hasExpenseLedger = !!expenseLedger;

  const productPriceEntry = productPrices.find(
    (price) => price.product_id === fuelVoucher.product_id
  );
  const productPrice = productPriceEntry?.price || 0;
  const calculatedAmount = productPrice * (fuelVoucher.quantity || 0);

  const handleRemove = () => {
    setFuelVouchers((prev) => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  return (
    <React.Fragment>
      <Divider />

      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Grid size={{ xs: 1, md: 0.5 }}>
            {index + 1}.
          </Grid>

          <Grid size={{ xs: 5, md: hasExpenseLedger ? 4.5 : 4, lg: hasExpenseLedger ? 2 : 3 }}>
            <Tooltip title="Client">
              <Typography>{client ? client.name : 'Internal use'}</Typography>
            </Tooltip>
          </Grid>

          {hasExpenseLedger && (
            <Grid size={{ xs: 6, md: 2.5, lg: 1.5 }}>
              <Tooltip title="Expense Ledger">
                <Typography>{expenseLedger?.name ?? '-'}</Typography>
              </Tooltip>
            </Grid>
          )}

          <Grid size={{ xs: 6, md: hasExpenseLedger ? 3.5 : 5, lg: hasExpenseLedger ? 2 : 2.5 }}>
            <Tooltip title="Product">
              <Typography>{product?.name ?? '-'}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 1, lg: 1 }}>
            <Tooltip title="Quantity">
              <Typography>{(fuelVoucher.quantity || 0).toLocaleString()}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: hasExpenseLedger ? 3 : 1, lg: 1 }}>
            <Tooltip title="Amount">
              <Typography>{calculatedAmount.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 5, lg: 1.5 }}>
            <Tooltip title="Reference">
              <Typography>{fuelVoucher.reference || '-'}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 4, lg: 1.5 }}>
            <Tooltip title="Narration">
              <Typography>{fuelVoucher.narration || '-'}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 12, md: 12, lg: 1 }} textAlign="end">
            <Tooltip title="Edit Fuel Voucher">
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Fuel Voucher">
              <IconButton size="small" onClick={handleRemove}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <FuelVouchers
          fuelVoucher={fuelVoucher}
          index={index}
          setShowForm={setShowForm}
          productPrices={productPrices}
          products={productOptions}   
          fuelVouchers={fuelVouchers}
          setFuelVouchers={setFuelVouchers}
        />
      )}
    </React.Fragment>
  );
};

export default FuelVouchersItemRow;