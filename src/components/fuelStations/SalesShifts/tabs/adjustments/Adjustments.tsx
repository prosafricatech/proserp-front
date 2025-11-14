'use client';

import { Grid, IconButton, LinearProgress, TextField, Tooltip, Box } from '@mui/material';
import React, { useState } from 'react'
import * as yup from "yup";
import { useForm, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import OperationSelector from '@/components/sharedComponents/OperationSelector';

// Type definitions
interface Product {
  id: number;
  name: string;
  [key: string]: any;
}

interface FuelPump {
  id: number;
  product_id: number;
  tank_id: number;
  [key: string]: any;
}

interface Tank {
  id: number;
  name: string;
  [key: string]: any;
}

interface AdjustmentData {
  id?: number;
  product_id?: number;
  product?: Product;
  tank_id?: number;
  quantity?: number;
  description?: string;
  operator?: string;
  operator_name?: string;
  [key: string]: any;
}

interface OperationOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface AdjustmentsProps {
  index?: number;
  setShowForm?: (show: boolean) => void;
  adjustment?: AdjustmentData;
}

interface FormContextType {
  products: Product[];
  fuel_pumps: FuelPump[];
  adjustments: AdjustmentData[];
  setAdjustments: (adjustments: AdjustmentData[] | ((prev: AdjustmentData[]) => AdjustmentData[])) => void;
  tanks: Tank[];
  [key: string]: any;
}

interface FormData {
  product?: Product | null;
  product_id?: number;
  quantity?: number;
  tank_id?: number;
  description?: string;
  operator?: string;
  operator_name?: string;
}

function Adjustments({ index = -1, setShowForm, adjustment }: AdjustmentsProps) {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { products, fuel_pumps, adjustments = [], setAdjustments, tanks = [] } = useFormContext() as unknown as FormContextType;
  const { productOptions = [] } = useProductsSelect();
  const [productTanks, setProductTanks] = useState<Tank[]>([]);
  const [tanksKey, setTanksKey] = useState<number>(0);
  
  // Use local state for form fields instead of useForm
  const [formData, setFormData] = useState<FormData>(() => {
    // Use function to initialize state safely
    const initialProduct = adjustment && productOptions?.find((product: Product) => product.id === adjustment.product_id);
    const initialTankId = adjustment && tanks?.find((tank: Tank) => tank.id === adjustment?.tank_id)?.id;
    
    return {
      product: initialProduct || null,
      product_id: adjustment?.product_id,
      quantity: adjustment?.quantity,
      tank_id: initialTankId,
      description: adjustment?.description || '',
      operator: adjustment?.operator || '',
      operator_name: adjustment?.operator_name || ''
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add a safe function to get tank value
  const getTankValue = () => {
    if (!formData.tank_id || !tanks || tanks.length === 0) return null;
    return tanks.find((tank: Tank) => tank.id === formData.tank_id) || null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = "Product is required";
    }
    if (!formData.tank_id) {
      newErrors.tank_id = "Tank is required";
    }
    if (!formData.operator) {
      newErrors.operator = "Operator is required";
    }
    if (!formData.description) {
      newErrors.description = "Description is required";
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateItems = async () => {
    if (!validateForm()) {
      return;
    }

    // SOLUTION 1: Check if setAdjustments exists and is a function
    if (typeof setAdjustments !== 'function') {
      console.error('setAdjustments is not available');
      setIsAdding(false);
      return;
    }

    setIsAdding(true);
    
    const normalizedItem: AdjustmentData = {
      ...formData,
      product: formData.product ?? undefined,
    } as AdjustmentData;

    try {
      if (index > -1) {
        // Replace existing item
        const updatedAdjustments = [...adjustments];
        updatedAdjustments[index] = normalizedItem;
        await setAdjustments(updatedAdjustments);
      } else { 
        // Add new item
        await setAdjustments((prevAdjustments: AdjustmentData[]) => [...prevAdjustments, normalizedItem]);
      }

      // Only reset if it's a new item, not when editing
      if (index === -1) {
        setFormData({
          product: null,
          product_id: undefined,
          quantity: undefined,
          tank_id: undefined,
          description: '',
          operator: '',
          operator_name: ''
        });
      }
    } catch (error) {
      console.error('Error updating adjustments:', error);
    } finally {
      setIsAdding(false);
      setShowForm && setShowForm(false);
    }
  };

  const handleProductChange = (newValue: Product | null) => {
    setTanksKey(prevKey => prevKey + 1);
    const relatedPumps = fuel_pumps?.filter((pump: FuelPump) => pump.product_id === newValue?.id) || [];
    const relatedTankIds = relatedPumps.map(pump => pump.tank_id);
    const tanksHavingProduct = tanks?.filter((tank: Tank) => relatedTankIds.includes(tank.id)) || [];
    setProductTanks(tanksHavingProduct);
    
    setFormData(prev => ({
      ...prev,
      product: newValue,
      product_id: newValue ? newValue.id : undefined,
      tank_id: undefined // Reset tank when product changes
    }));
  };

  const handleTankChange = (newValue: Tank | null) => {
    setFormData(prev => ({
      ...prev,
      tank_id: newValue ? newValue.id : undefined
    }));
  };

  const handleOperatorChange = (newValue: OperationOption | null) => {
    setFormData(prev => ({
      ...prev,
      operator_name: newValue?.label || '',
      operator: newValue ? newValue.value : ''
    }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
    setFormData(prev => ({
      ...prev,
      quantity: value
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  // Remove the form submission handler since we're handling click directly
  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event bubbling
    updateItems();
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={1} marginTop={0.5}>
        <Grid size={{xs:12, md:6, lg:2.6}}>
          <Div sx={{ mt: 1 }}>
            <ProductSelect
              label='Fuel'
              frontError={errors.product_id}
              value={formData.product}
              requiredProducts={products}
              onChange={handleProductChange}
            />
          </Div>
        </Grid>
        <Grid size={{xs:12, md:6, lg:2.4}}>
          <Div sx={{ mt: 1 }}>
            <StoreSelector
              key={tanksKey}
              allowSubStores={true}
              label='Tank'
              defaultValue={getTankValue()}
              frontError={errors.tank_id ? null : undefined}           
              onChange={handleTankChange}
            />
          </Div>
        </Grid>
       <Grid size={{xs:12, md:3, lg:1.5}}>
          <Div sx={{ mt: 1 }}>
            <OperationSelector
              label='Operator'
              frontError={errors.operator}
              value={formData.operator}
              onChange={handleOperatorChange}
            />
          </Div>
        </Grid>
       <Grid size={{xs:12, md:3, lg:2}}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={formData.quantity || ''}
              error={!!errors.quantity}
              helperText={errors.quantity}
              label="Quantity"
              InputProps={{
                inputComponent: CommaSeparatedField as any
              }}
              onChange={handleQuantityChange}
            />
          </Div>
        </Grid>
        <Grid size={{xs:12, md:6, lg:3.5}}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline={true}
              rows={2}
              value={formData.description || ''}
              error={!!errors.description}
              helperText={errors.description}
              label="Description"
              onChange={handleDescriptionChange}
            />
          </Div>
        </Grid>
        <Grid size={12} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            size='small'
            sx={{ marginBottom: 0.5 }}
            onClick={handleAddClick}
          >
            {adjustment ? (
              <><CheckOutlined fontSize='small' /> Done</>
            ) : (
              <><AddOutlined fontSize='small' /> Add</>
            )}
          </LoadingButton>
          {adjustment && (
            <Tooltip title='Close Edit'>
              <IconButton 
                size='small' 
                onClick={() => {
                  setShowForm && setShowForm(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Adjustments;