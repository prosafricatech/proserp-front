'use client';

import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography, Box } from '@mui/material';
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
  product?: Product;
}

interface FormContextType {
  adjustments: AdjustmentData[];
  setAdjustments: (adjustments: AdjustmentData[] | ((prev: AdjustmentData[]) => AdjustmentData[])) => void;
  products: Product[];
  tanks: { id: number; name: string }[];
  [key: string]: any;
}

interface AdjustmentsRowProps {
  adjustment: AdjustmentData;
  index: number;
}

// Memoize to prevent unnecessary re-renders in lists
const AdjustmentsRow = memo(function AdjustmentsRow({ adjustment, index }: AdjustmentsRowProps) {
  const [showForm, setShowForm] = useState(false);

  const { adjustments = [], setAdjustments, products = [], tanks = [] } = useFormContext() as FormContextType;

  const product = adjustment.product || (adjustment.product_id
    ? products.find(p => p.id === adjustment.product_id)
    : undefined);

  const tank = adjustment.tank_id
    ? tanks.find(t => t.id === adjustment.tank_id)
    : undefined;

  const handleRemove = useCallback(() => {
    if (typeof setAdjustments === 'function') {
      setAdjustments(prev => prev.filter((_, i) => i !== index));
    }
  }, [index, setAdjustments]);

  const operatorText = adjustment.operator === '-' ? 'Subtract (-)' : 'Add (+)';

  // Don't render if form context is not available
  if (typeof setAdjustments !== 'function') {
    console.error('setAdjustments function not available in form context');
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Divider />

      {!showForm ? (
        <Grid
          container
          spacing={1}
          sx={{
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            py: 1.5,
            alignItems: 'center',
            px: 1
          }}
        >
          {/* Index */}
          <Grid size={{ xs: 1, md:1}}>
            <Typography variant="body2" color="text.secondary">
              {index + 1}.
            </Typography>
          </Grid>

          {/* Product */}
         <Grid size={{ xs: 3, md: 2.5 }}>
            <Tooltip title={product?.name || "Product"} placement="top">
              <Typography variant="body2" noWrap sx={{ fontWeight: 'medium' }}>
                {product?.name || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Tank */}
          <Grid size={{ xs: 3, md: 2 }}>
            <Tooltip title={tank?.name || "Tank"} placement="top">
              <Typography variant="body2" noWrap>
                {tank?.name || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Operator */}
         <Grid size={{ xs: 2, md: 1.5 }}>
            <Tooltip title="Operator" placement="top">
              <Typography 
                variant="body2" 
                sx={{ 
                  color: adjustment.operator === '-' ? 'error.main' : 'success.main',
                  fontWeight: 'medium'
                }}
              >
                {operatorText}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Quantity */}
          <Grid size={{ xs: 3, md: 2 }}>
            <Tooltip title="Quantity" placement="top">
              <Typography 
                variant="body2" 
                fontWeight="bold"
                sx={{ 
                  color: adjustment.operator === '-' ? 'error.main' : 'success.main'
                }}
              >
                {adjustment.operator === '-' ? '-' : '+'}{(adjustment.quantity ?? 0).toLocaleString()}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Description */}
         <Grid size={{ xs: 8, md: 2 }}>
            <Tooltip title={adjustment.description || "No description"} placement="top">
              <Typography variant="body2" color="text.secondary" noWrap>
                {adjustment.description || '—'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Actions */}
          <Grid size={{ xs: 4, md: 1 }} sx={{ textAlign: 'right' }}>
            <Tooltip title="Edit">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowForm(true);
                }}
                sx={{ mr: 0.5 }}
              >
                <EditOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Remove">
              <IconButton 
                size="small" 
                color="error" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <DisabledByDefault fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ py: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Adjustments 
            adjustment={adjustment} 
            setShowForm={setShowForm} 
            index={index} 
            showList={false} // Don't show the list when editing
          />
        </Box>
      )}
    </Box>
  );
});

export default AdjustmentsRow; 