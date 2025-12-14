import { Grid, IconButton, LinearProgress, TextField, Tooltip} from '@mui/material';
import React, { useState } from 'react'
import * as yup  from "yup";
import { useForm, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import OperationSelector from '@/components/sharedComponents/OperationSelector';
import { Div } from '@jumbo/shared';
import { Adjustment, Tank } from '../../SalesShiftTypes';
import { FuelPump } from '@/components/fuelStation/Stations/StationType';
import { Product } from '@/components/productAndServices/products/ProductType';

interface AdjustmentsProps {
  index?: number;
  setShowForm?: (show: boolean) => void | null;
  adjustment?: Adjustment;
  fuel_pumps: FuelPump[];
  tanks: Tank[];
  products: Product[];
  adjustments: Adjustment[];
  setAdjustments: (adjustments: Adjustment[] | ((prev: Adjustment[]) => Adjustment[])) => void;
}

const Adjustments: React.FC<AdjustmentsProps> = ({
  index = -1,
  setShowForm = null,
  adjustment,
  fuel_pumps,
  tanks,
  products,
  adjustments,
  setAdjustments,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { productOptions } = useProductsSelect();
  const [productTanks, setProductTanks] = useState<Tank[]>([]);
  const [tanksKey, setTanksKey] = useState(0);

  // Define validation Schema
  const validationSchema = yup.object({
    product_id: yup.number().required("Product is required").typeError('Product is required'),
    tank_id: yup.number().required("Tank is required").typeError('Tank is required'),
    operator: yup.string().required("Operator is required").typeError('Operator is required'),
    description: yup.string().required("Description is required").typeError('Description is required'),
    quantity: yup.number().required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
  });
  
  type FormData = yup.InferType<typeof validationSchema> & {
  operator_name?: string;  // <-- Add this
  product?: Product;

};

  const {setValue, handleSubmit, watch, reset, formState: {errors}} = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      product: adjustment && productOptions.find(product => product.id === adjustment.product_id),
      product_id: adjustment && adjustment.product_id, 
      quantity: adjustment && adjustment.quantity, 
      tank_id: adjustment && tanks.find(tank => tank.id === adjustment?.tank_id)?.id,
      description: adjustment && adjustment.description,
      operator: adjustment && adjustment.operator,
      operator_name: adjustment && adjustment.operator_name
    }
  });
  
  const updateItems = async (item: any) => {
    setIsAdding(true);
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedAdjustments = [...adjustments];
        updatedAdjustments[index] = item;
        await setAdjustments(updatedAdjustments);
      } else {
        // Add the new item to the Adjustments array
        await setAdjustments((adjustments) => [...adjustments, item]);
      }

      reset();
      setIsAdding(false);
      setShowForm && setShowForm(false);
  };

  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container spacing={1} marginTop={0.5}>
         <Grid size={{xs: 12, md: 6, lg: 2.6}}>
          <Div sx={{ mt: 1}}>
            <ProductSelect
              label='Fuel'
              frontError={errors.product_id}
              defaultValue={adjustment && productOptions.find(product => product.id === adjustment.product_id)}
              requiredProducts={products}
              onChange={(newValue: any) => {
                setTanksKey(prevKey => prevKey + 1);
                const relatedPumps = fuel_pumps.filter(pump => pump.product_id === newValue?.id);
                const relatedTankIds = relatedPumps.map(pump => pump.tank_id);
                const tanksHavingProduct = tanks.filter(tank => relatedTankIds.includes(tank.id));
                setProductTanks(tanksHavingProduct);
                setValue(`product_id`, newValue ? newValue.id : '', {
                  shouldValidate: true, 
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
       <Grid size={{xs: 12, md: 6, lg: 2.4}}>
          <Div sx={{ mt: 1 }}>
              <StoreSelector
                  key={tanksKey}
                  allowSubStores={true}
                  label='Tank'
                  defaultValue={adjustment && tanks.find(tank => tank.id === adjustment?.tank_id)}
                  proposedOptions={productTanks as any}
                  frontError={errors?.tank_id as any}
                  onChange={(newValue: any) => {
                      setValue(`tank_id`, newValue ? newValue.id : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                      });
                  }}
              />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3, lg: 1.5}}>
          <Div sx={{ mt: 1 }}>
            <OperationSelector
              label='Operator'
              frontError={errors?.operator}
              defaultValue={adjustment && adjustment.operator}
              onChange={(newValue: any) => {
                setValue(`operator_name`, newValue.label);
                setValue(`operator`, newValue ? newValue.value : '', {
                    shouldValidate: true,
                    shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3, lg: 2}}>
          <Div sx={{ mt: 1}}>
            <TextField
              size="small"
              fullWidth
              defaultValue={adjustment && adjustment.quantity}
              error={errors && !!errors?.quantity}
              helperText={errors && errors.quantity?.message}
              label="Quantity"
              InputProps={{
                inputComponent: CommaSeparatedField
              }}
              onChange={(e) => {
                setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 6, lg: 3.5}}>
          <Div sx={{ mt: 1}}>
            <TextField
              size="small"
              fullWidth
              multiline={true}
              rows={2}
              defaultValue={watch(`description`)}
              error={errors && !!errors?.description}
              helperText={errors && errors.description?.message}
              label="Description"
              onChange={(e) => {
                setValue(`description`, e.target.value,{
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
            sx={{marginBottom: 0.5}}
          >
            {
              adjustment ? (
                <><CheckOutlined fontSize='small' /> Done</>
              ) : (
                <><AddOutlined fontSize='small' /> Add</>
              )
            }
          </LoadingButton>
          {
            adjustment && 
            <Tooltip title='Close Edit'>
              <IconButton size='small' 
                onClick={() => {
                  setShowForm && setShowForm(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success'/>
              </IconButton>
            </Tooltip>
          }
        </Grid>
      </Grid>
    </form>

  )
}

export default Adjustments