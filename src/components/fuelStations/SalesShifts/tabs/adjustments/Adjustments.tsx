'use client';
import { Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import React, { useState, useEffect } from 'react';
import * as yup from "yup";
import { useForm, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import OperationSelector from '@/components/sharedComponents/OperationSelector';
import { Product } from '@/components/productAndServices/products/ProductType';
import { FuelPump } from '@/components/fuelStations/Stations/StationType';
import { useSalesStation } from '@/components/fuelStations/Stations/StationProvider';

// First, add the Tank type definition
interface Tank {
  id: number;
  name: string;
  product_id?: number;
  [key: string]: any;
}

interface Adjustment {
  product_id: number;
  quantity: number;
  tank_id: number;
  description: string;
  operator: string;
  operator_name: string;
  [key: string]: any;
}

interface FormContextValues {
  products: Product[];
  fuel_pumps: FuelPump[];
  adjustments: Adjustment[];
  setAdjustments: (adjustments: Adjustment[] | ((prev: Adjustment[]) => Adjustment[])) => void | Promise<void>;
  tanks: Tank[];
  [key: string]: any;
}

interface AdjustmentsProps {
  index?: number;
  setShowForm?: (show: boolean) => void;
  adjustment?: Adjustment | null;
}

interface AdjustmentFormData {
  product_id: number;
  quantity: number;
  tank_id: number;
  description: string;
  operator: string;
  operator_name: string;
  product?: Product | null;
}

// Validation Schema
const validationSchema = yup.object({
  product_id: yup.number().required("Product is required").typeError('Product is required'),
  tank_id: yup.number().required("Tank is required").typeError('Tank is required'),
  operator: yup.string().required("Operator is required").typeError('Operator is required'),
  description: yup.string().required("Description is required").typeError('Description is required'),
  quantity: yup.number().required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
});

function Adjustments({ index = -1, setShowForm, adjustment = null }: AdjustmentsProps) {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { products, fuel_pumps, adjustments = [], setAdjustments, tanks } = useFormContext<FormContextValues>() as unknown as FormContextValues;
  const { productOptions } = useProductsSelect();
  const { activeStation } = useSalesStation();
  const [productTanks, setProductTanks] = useState<Tank[]>([]);
  const [tanksKey, setTanksKey] = useState<number>(0); 

  const storeOptions = activeStation?.tanks || [];

  // Initialize with default values when editing
  useEffect(() => {
    if (adjustment) {
      // Find tanks related to the selected product when editing
      const selectedProductId = adjustment.product_id;
      if (selectedProductId) {
        const relatedTanks = getTanksByProductId(selectedProductId);
        setProductTanks(relatedTanks);
      }
    }
  }, [adjustment]);

  // Function to get tanks by product ID
  const getTanksByProductId = (productId: number): Tank[] => {
    // Method 1: If tanks have direct product_id reference
    const tanksWithProduct = tanks.filter((tank: Tank) => tank.product_id === productId);
    
    if (tanksWithProduct.length > 0) {
      return tanksWithProduct;
    }
    
    // Method 2: If tanks are linked through fuel_pumps
    const relatedPumps = fuel_pumps.filter((pump: FuelPump) => pump.product_id === productId);
    const relatedTankIds = relatedPumps.map((pump: FuelPump) => pump.tank_id);
    const tanksThroughPumps = tanks.filter((tank: Tank) => relatedTankIds.includes(tank.id));
    
    return tanksThroughPumps;
  };

  const { setValue, handleSubmit, watch, reset, formState: { errors } } = useForm<AdjustmentFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      product: adjustment && productOptions.find((product: Product) => product.id === adjustment.product_id),
      product_id: adjustment?.product_id || undefined,
      quantity: adjustment?.quantity || undefined,
      tank_id: adjustment?.tank_id || undefined,
      description: adjustment?.description || '',
      operator: adjustment?.operator || '',
      operator_name: adjustment?.operator_name || ''
    }
  });

  const updateItems = async (item: AdjustmentFormData): Promise<void> => {
    setIsAdding(true);
    try {
      if (index > -1) {
        // Replace the existing item with the edited item
        const updatedAdjustments = [...adjustments];
        updatedAdjustments[index] = item as Adjustment;
        await setAdjustments(updatedAdjustments);
      } else {
        // Add the new item to the Adjustments array
        await setAdjustments((prevAdjustments: Adjustment[]) => [...prevAdjustments, item as Adjustment]);
      }

      reset();
      if (setShowForm) {
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error updating adjustments:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container spacing={1} marginTop={0.5}>
        <Grid size={{ xs: 12, md: 6, lg: 2.6 }}>
          <Div sx={{ mt: 1 }}>
            <ProductSelect
              label='Fuel'
              frontError={errors.product_id}
              defaultValue={adjustment && productOptions.find((product: Product) => product.id === adjustment.product_id)}
              requiredProducts={products}
              onChange={(newValue: Product | null) => {
                setTanksKey(prevKey => prevKey + 1);
                
                if (newValue) {
                  // Get tanks related to the selected product
                  const relatedTanks = getTanksByProductId(newValue.id);
                  setProductTanks(relatedTanks);
                  
                  // Reset tank selection when product changes
                  setValue(`tank_id`, 0, {
                    shouldValidate: false,
                    shouldDirty: true,
                  });
                } else {
                  setProductTanks([]);
                }
                
                setValue(`product_id`, newValue ? newValue.id : 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
          <Div sx={{ mt: 1 }}>
            <StoreSelector
              key={tanksKey}
              allowSubStores={true}
              label='Tank'
              defaultValue={adjustment && tanks.find((tank: Tank) => tank.id === adjustment?.tank_id)}
              proposedOptions={productTanks as any}
              frontError={errors?.tank_id as any}
              onChange={(newValue: Tank | null) => {
                setValue(`tank_id`, newValue ? newValue.id : 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg: 1.5 }}>
          <Div sx={{ mt: 1 }}>
            <OperationSelector
              label='Operator'
              frontError={errors?.operator}
              defaultValue={adjustment?.operator}
              onChange={(newValue:any ) => {
                setValue(`operator_name`, newValue?.label || '');
                setValue(`operator`, newValue ? newValue.value : '', {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 3, lg:2 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              defaultValue={adjustment?.quantity}
              error={!!errors?.quantity}
              helperText={errors?.quantity?.message}
              label="Quantity"
              InputProps={{
                inputComponent: CommaSeparatedField
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue(`quantity`, e.target.value ? sanitizedNumber(e.target.value) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3.5 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline={true}
              rows={2}
              defaultValue={watch(`description`)}
              error={!!errors?.description}
              helperText={errors?.description?.message}
              label="Description"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue(`description`, e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={12} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            type='submit'
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
    </form>
  );
}

export default Adjustments;