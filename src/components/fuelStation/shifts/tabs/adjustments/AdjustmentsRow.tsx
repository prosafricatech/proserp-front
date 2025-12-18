import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react';
import Adjustments from './Adjustments';

import { Adjustment } from '../../SalesShiftTypes';
import { Product } from '@/components/productAndServices/products/ProductType';
import { FuelPump } from '@/components/fuelStation/Stations/StationType';
import { Tank } from '@/components/fuelStation/dippings/DippingsTypes';

interface AdjustmentsRowProps {
  adjustment: Adjustment;
  index: number;
  adjustments: Adjustment[];
  setAdjustments: (adjustments: Adjustment[] | ((prev: Adjustment[]) => Adjustment[])) => void;
  products: Product[];
  tanks: Tank[];
  fuel_pumps: FuelPump[];
}

const AdjustmentsRow: React.FC<AdjustmentsRowProps> = ({
  adjustment,
  index,
  adjustments,
  setAdjustments,
  products,
  tanks,
  fuel_pumps,
}) => {
  const [showForm, setShowForm] = useState(false);

  const product = products.find((p) => p.id === adjustment.product_id);
  const tank = tanks.find((t) => t.id === adjustment.tank_id);

  const handleRemove = () => {
    setAdjustments((prev) => {
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

          <Grid size={{ xs: 5.5, md: 2.5, lg: 2.5 }}>
            <Tooltip title="Product">
              <Typography>{product?.name ?? '-'}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 5.5, md: 2.5 }}>
            <Tooltip title="Tank">
              <Typography>{tank?.name ?? '-'}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title="Operator">
              <Typography>
                {adjustment.operator === '-' ? 'Subtract (-)' : 'Add (+)'}
              </Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title="Quantity">
              <Typography>{adjustment.quantity.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 2, lg: 2 }}>
            <Tooltip title="Description">
              <Typography>{adjustment.description ?? '-'}</Typography>
            </Tooltip>
          </Grid>

          <Grid size={{ xs: 6, md: 1, lg: 1 }} textAlign="end">
            <Tooltip title="Edit Adjustment">
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove Adjustment">
              <IconButton size="small" onClick={handleRemove}>
                <DisabledByDefault fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <Adjustments
          adjustment={adjustment}
          index={index}
          setShowForm={setShowForm}
          fuel_pumps={fuel_pumps}
          tanks={tanks}
          products={products}
          adjustments={adjustments}
          setAdjustments={setAdjustments}
        />
      )}
    </React.Fragment>
  );
};

export default AdjustmentsRow;