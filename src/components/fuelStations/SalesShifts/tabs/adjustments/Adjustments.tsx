'use client';

import { Grid, IconButton, LinearProgress, TextField, Tooltip, Box, Typography } from '@mui/material';
import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import OperationSelector from '@/components/sharedComponents/OperationSelector';
import { Product } from '@/components/productAndServices/products/ProductType';
import { FuelPump } from '@/components/fuelStations/Stations/StationType';
import AdjustmentsRow from './AdjustmentsRow'; // Import the row component

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
  showList?: boolean; // ADD THIS PROP
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
  product_id?: number | null;
  quantity?: number;
  tank_id?: number;
  description?: string;
  operator?: string;
  operator_name?: string;
}

function Adjustments({ index = -1, setShowForm, adjustment, showList = true }: AdjustmentsProps) { // ADD showList prop
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { products, fuel_pumps, adjustments = [], setAdjustments, tanks = [] } = useFormContext() as unknown as FormContextType;
  const { productOptions = [] } = useProductsSelect();
  const [productTanks, setProductTanks] = useState<Tank[]>([]);
  const [tanksKey, setTanksKey] = useState<number>(0);
  const [quantityFieldKey, setQuantityFieldKey] = useState(0);
  
  const [formData, setFormData] = useState<FormData>(() => {
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

  const selectedProduct = formData.product_id
    ? productOptions.find(p => p.id === formData.product_id) || formData.product
    : formData.product;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const inventoryProductIds = productOptions.filter(p => p.type !== 'Inventory').map(p => p.id);

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
      newErrors.quantity = "Valid quantity required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateItems = async () => {
    if (!validateForm()) {
      return;
    }

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
        const updatedAdjustments = [...adjustments];
        updatedAdjustments[index] = normalizedItem;
        await setAdjustments(updatedAdjustments);
      } else { 
        await setAdjustments((prevAdjustments: AdjustmentData[]) => [...prevAdjustments, normalizedItem]);
      }

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
        setQuantityFieldKey(k => k + 1);
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
      tank_id: undefined
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
    const value = sanitizedNumber(e.target.value);
    setFormData(prev => ({ ...prev, quantity: value }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
              defaultValue={selectedProduct}
              frontError={errors.product_id ? { message: errors.product_id } : undefined}
              onChange={handleProductChange}
              excludeIds={inventoryProductIds}
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
              key={quantityFieldKey}
              value={formData.quantity?.toLocaleString() || ''}
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

      {/* ADD THIS DISPLAY SECTION */}
      {showList && adjustments.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            Added Adjustments ({adjustments.length})
          </Typography>
          
          {/* List Header */}
          <Grid container sx={{ px: 2, py: 1, bgcolor: 'grey.100', borderRadius: 1, mb: 1 }}>
            <Grid size={{ xs: 1, md: 0.5 }}>
              <Typography variant="subtitle2">#</Typography>
            </Grid>
            <Grid size={{ xs: 5.5, md: 2.5, lg: 2.5 }}>
              <Typography variant="subtitle2">Product</Typography>
            </Grid>
            <Grid size={{ xs: 5.5, md: 2.5 }}>
              <Typography variant="subtitle2">Tank</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 1.5 }}>
              <Typography variant="subtitle2">Operator</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2">Quantity</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2, lg: 2 }}>
              <Typography variant="subtitle2">Description</Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 1, lg: 1 }} textAlign="end">
              <Typography variant="subtitle2">Actions</Typography>
            </Grid>
          </Grid>

          {/* Use your existing AdjustmentsRow for each item */}
          {adjustments.map((adjustmentItem, idx) => (
            <AdjustmentsRow
              key={idx}
              adjustment={adjustmentItem}
              index={idx}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default Adjustments;