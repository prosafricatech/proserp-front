'use client';

import { DisabledByDefault, EditOutlined } from '@mui/icons-material';
import { Divider, Grid, IconButton, Tooltip, Typography, Box } from '@mui/material';
import React, { useState, useCallback, memo } from 'react';
import { useFormContext } from 'react-hook-form';
import Adjustments from './Adjustments';
import { Product } from '@/components/productAndServices/products/ProductType';

// Update the interface to match the Adjustment interface from Adjustments component
interface Adjustment {
  id?: number;
  product_id: number;
  tank_id: number;
  quantity: number;
  operator: string;
  description: string;
  product?: Product;
  operator_name: string;
  [key: string]: any;
}

interface FormContextType {
  adjustments: Adjustment[];
  setAdjustments: (adjustments: Adjustment[] | ((prev: Adjustment[]) => Adjustment[])) => void;
  products: Product[];
  tanks: { id: number; name: string }[];
  [key: string]: any;
}

interface AdjustmentsRowProps {
  adjustment: Adjustment;
  index: number;
}

function AdjustmentsRow({ adjustment, index }: AdjustmentsRowProps) {
  const [showForm, setShowForm] = useState(false);
  const { adjustments = [], setAdjustments, products = [], tanks = [] } = useFormContext() as unknown as FormContextType;
  const product = products.find(product => product.id === adjustment.product_id);
  const tank = tanks.find(tank => tank.id === adjustment.tank_id);

  return (
    <React.Fragment>
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
          <Grid size={{ xs: 1, md:0.5}}>
            <Typography variant="body2" color="text.secondary">
              {index + 1}.
            </Typography>
          </Grid>

          {/* Product */}
         <Grid size={{ xs: 5.5, md: 2.5 , lg:2.5 }}>
            <Tooltip title="Product" placement="top">
              <Typography >
                {product?.name}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Tank */}
          <Grid size={{ xs: 5.5, md: 2.5 }}>
            <Tooltip title= "Tank" placement="top">
              <Typography>
                {tank?.name}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Operator */}
         <Grid size={{ xs: 6, md: 1.5 }}>
            <Tooltip title="Operator" placement="top">
              <Typography>
                   {adjustment.operator === '-' ? 'Subtract (-)' : 'Add (+)'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Quantity */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Tooltip title="Quantity" placement="top">
              <Typography>
                {adjustment.quantity?.toLocaleString()}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Description */}
         <Grid size={{ xs: 6, md: 2 , lg:2 }}>
            <Tooltip title= "Description" placement="top">
              <Typography>
                {adjustment.description}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Actions */}
          <Grid size={{ xs: 6, md: 1, lg:1 }} sx={{ textAlign: 'end' }}>
            <Tooltip title="Edit Adjustment">
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

            <Tooltip title="Remove Adjustment">
              <IconButton size='small' 
                onClick={() => setAdjustments(adjustments => {
                    const newItems = [...adjustments];
                    newItems.splice(index,1);
                    return newItems;
                })}
            >
                <DisabledByDefault fontSize='small' color='error'/>
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <Adjustments adjustment={adjustment} setShowForm={setShowForm} index={index} />
      )}
    </React.Fragment>
  );
};

export default AdjustmentsRow;