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
  const { products, fuel_pumps, adjustments = [], setAdjustments, tanks } = useFormContext() as unknown as FormContextType;
  const { productOptions } = useProductsSelect();
  const [productTanks, setProductTanks] = useState<Tank[]>([]);
  const [tanksKey, setTanksKey] = useState<number>(0); // key to re-render tanks field after product changed

  // Define validation Schema
  const validationSchema = yup.object({
    product_id: yup.number().required("Product is required").typeError('Product is required'),
    tank_id: yup.number().required("Tank is required").typeError('Tank is required'),
    operator: yup.string().required("Operator is required").typeError('Operator is required'),
    description: yup.string().required("Description is required").typeError('Description is required'),
    quantity: yup.number().required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
  });

  const { setValue, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(validationSchema)as any,
    defaultValues: {
      product: adjustment && productOptions.find((product: Product) => product.id === adjustment.product_id),
      product_id: adjustment?.product_id, 
      quantity: adjustment?.quantity, 
      tank_id: adjustment && tanks.find((tank: Tank) => tank.id === adjustment?.tank_id)?.id,
      description: adjustment?.description,
      operator: adjustment?.operator,
      operator_name: adjustment?.operator_name
    }
  });
  
  const updateItems = async (item: FormData) => {
    setIsAdding(true);
    // normalize item to match AdjustmentData (avoid null product)
    const normalizedItem: AdjustmentData = {
      ...(item as any),
      product: item.product ?? undefined,
    };

    if (index > -1) {
      // Replace the existing item with the edited item
      const updatedAdjustments = [...adjustments];
      updatedAdjustments[index] = normalizedItem;
      await setAdjustments(updatedAdjustments);
    } else { 
      // Add the new item to the Adjustments array
      await setAdjustments((prevAdjustments: AdjustmentData[]) => [...prevAdjustments, normalizedItem]);
    }

    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  const handleProductChange = (newValue: Product | null) => {
    setTanksKey(prevKey => prevKey + 1);
    const relatedPumps = fuel_pumps.filter((pump: FuelPump) => pump.product_id === newValue?.id);
    const relatedTankIds = relatedPumps.map(pump => pump.tank_id);
    const tanksHavingProduct = tanks.filter((tank: Tank) => relatedTankIds.includes(tank.id));
    setProductTanks(tanksHavingProduct);
    setValue('product_id', newValue ? newValue.id : undefined, {
      shouldValidate: true, 
      shouldDirty: true,
    });
  };

  const handleTankChange = (newValue: Tank | null) => {
    setValue('tank_id', newValue ? newValue.id : undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleOperatorChange = (newValue: OperationOption | null) => {
    setValue('operator_name', newValue?.label || '');
    setValue('operator', newValue ? newValue.value : '', {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? sanitizedNumber(e.target.value) : 0;
    setValue('quantity', value, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('description', e.target.value, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  // Handle form submission without using nested form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(updateItems)(e);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  const watchedDescription = watch('description');

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={1} marginTop={0.5}>
        <Grid size={{xs:12, md:6, lg:2.6}}>
          <Div sx={{ mt: 1 }}>
            <ProductSelect
              label='Fuel'
              frontError={errors.product_id}
              defaultValue={adjustment && productOptions.find((product: Product) => product.id === adjustment.product_id)}
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
              defaultValue={adjustment && tanks.find((tank: Tank) => tank.id === adjustment?.tank_id)}
              proposedOptions={productTanks.length ? (productTanks as any) : undefined}
              frontError={errors?.tank_id as any}
              onChange={handleTankChange}
            />
          </Div>
        </Grid>
       <Grid size={{xs:12, md:3, lg:1.5}}>
          <Div sx={{ mt: 1 }}>
            <OperationSelector
              label='Operator'
              frontError={errors?.operator}
              defaultValue={adjustment?.operator}
              onChange={handleOperatorChange}
            />
          </Div>
        </Grid>
       <Grid size={{xs:12, md:3, lg:2}}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              defaultValue={adjustment?.quantity}
              error={!!errors?.quantity}
              helperText={errors?.quantity?.message}
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
              defaultValue={watchedDescription}
              error={!!errors?.description}
              helperText={errors?.description?.message}
              label="Description"
              onChange={handleDescriptionChange}
            />
          </Div>
        </Grid>
        <Grid size={12} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            type='submit' // This will now submit the parent form
            size='small'
            sx={{ marginBottom: 0.5 }}
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