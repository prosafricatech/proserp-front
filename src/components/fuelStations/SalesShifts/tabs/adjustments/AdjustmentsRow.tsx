'use client';

import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider,Grid, IconButton, Tooltip, Typography } from '@mui/material';
import React, { useState, useCallback, memo } from 'react';
import { useFormContext } from 'react-hook-form';
import Adjustments from './Adjustments';
import { Product } from '@/components/productAndServices/products/ProductType';

interface AdjustmentData {
  id?: number;
  product_id?: number;
  tank_id?: number;
  quantity?: number;
  operator?: string;
  description?: string;
}

interface AdjustmentsRowProps {
  adjustment: AdjustmentData;
  index: number;
}

// Memoize to prevent unnecessary re-renders in lists
const AdjustmentsRow = memo(function AdjustmentsRow({ adjustment, index }: AdjustmentsRowProps) {
  const [showForm, setShowForm] = useState(false);

  const { adjustments = [], setAdjustments, products = [], tanks = [] } = useFormContext<{
    adjustments: AdjustmentData[];
    setAdjustments: React.Dispatch<React.SetStateAction<AdjustmentData[]>>;
    products: Product[];
    tanks: { id: number; name: string }[];
  }>();

  const product = adjustment.product_id
    ? products.find(p => p.id === adjustment.product_id)
    : undefined;

  const tank = adjustment.tank_id
    ? tanks.find(t => t.id === adjustment.tank_id)
    : undefined;

  const handleRemove = useCallback(() => {
    setAdjustments(prev => prev.filter((_, i) => i !== index));
  }, [index, setAdjustments]);

  const operatorText = adjustment.operator === '-' ? 'Subtract (-)' : 'Add (+)';

  return (
    <>
      <Divider />

      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            py: 1.5,
            alignItems: 'center',
          }}
        >
          {/* Index */}
          <Grid size={{ xs: 1, md: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {index + 1}.
            </Typography>
          </Grid>

          {/* Product */}
          <Grid size={{ xs: 5.5, md: 2.5, lg: 2.5 }}>
            <Tooltip title="Product" placement="top">
              <Typography variant="body2" noWrap>
                {product?.name || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Tank */}
          <Grid size={{ xs: 5.5, md: 2.5 }}>
            <Tooltip title="Tank" placement="top">
              <Typography variant="body2" noWrap>
                {tank?.name || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Operator */}
          <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title="Operator" placement="top">
              <Typography variant="body2">{operatorText}</Typography>
            </Tooltip>
          </Grid>

          {/* Quantity */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title="Quantity" placement="top">
              <Typography variant="body2" fontWeight="medium">
                {(adjustment.quantity ?? 0).toLocaleString()}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 6, md: 2, lg: 2 }}>
            <Tooltip title={adjustment.description || ''} placement="top">
              <Typography variant="body2" color="text.secondary" noWrap>
                {adjustment.description || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Actions */}
          <Grid size={{ xs: 6, md: 1, lg: 1 }} textAlign="end">
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setShowForm(true)}>
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove">
              <IconButton size="small" color="error" onClick={handleRemove}>
                <DisabledByDefault fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <Adjustments adjustment={adjustment} setShowForm={setShowForm} index={index} />
      )}
    </>
  );
});

export default AdjustmentsRow;