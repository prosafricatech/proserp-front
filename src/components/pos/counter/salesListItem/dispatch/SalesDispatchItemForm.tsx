import { Divider, Grid, LinearProgress, TextField, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useCounter } from '../../CounterProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import productServices from '@/components/productAndServices/products/productServices';
import { Div } from '@jumbo/shared';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Product } from '@/components/productAndServices/products/ProductType';

interface SaleItem {
  id: number;
  product_id?: number;
  product: Product
  measurement_unit_id?: number;
  measurement_unit?: MeasurementUnit;
  undispatched_quantity: number;
  quantity: number;
  rate: number;
  available_balance: number;
  current_balance?: number;
  store_id?: any;
  vat_exempted?: number;
}

interface SaleItemFormProps {
  sale_items: SaleItem[];
}

function SalesDispatchItemForm({ sale_items }: SaleItemFormProps) {
  const { outlet } = useCounter();
  const { stores, cost_center } = outlet || {};
  const { 
    setValue, 
    watch,
    formState: { errors } 
  } = useFormContext<{
    items: SaleItem[];
    dispatch_date: string;
  }>();
  
  const { authOrganization } = useJumboAuth();
  const [isRetrieving, setIsRetrieving] = useState<Record<number, boolean>>({});
  const dispatch_date = watch('dispatch_date');

  // Memoize filtered items to prevent unnecessary re-renders
  const filteredItems = useMemo(() => 
    sale_items.filter(item => item.undispatched_quantity !== 0),
    [sale_items]
  );

  // Improved balance retrieval with error handling and memoization
  const retrieveBalances = useCallback(async (
    productId: number, 
    storeId: number, 
    measurement_unit_id: number, 
    index: number
  ) => {
    if (!productId || storeId == null) {
      setValue(`items.${index}.available_balance`, 0);
      return;
    }

    try {
      setIsRetrieving(prev => ({ ...prev, [index]: true }));
      
      const balances = await productServices.getStoreBalances({
        as_at: dispatch_date,
        productId,
        storeIds: [storeId],
        costCenterId: cost_center?.id,
        sales_outlet_id: outlet?.id,
        measurement_unit_id
      });

      const storeBalance = balances.stock_balances.find(
        (balance: any) => balance.store_id === storeId && 
                  balance.cost_center_id === outlet?.cost_center?.id
      );

      setValue(`items.${index}.measurement_unit_id`, measurement_unit_id);
      setValue(`items.${index}.available_balance`, storeBalance?.balance ?? 0);
      setValue(`items.${index}.current_balance`, storeBalance?.current_balance ?? 0);
    } catch (error) {
      console.error('Error retrieving balances:', error);
      setValue(`items.${index}.available_balance`, 0);
    } finally {
      setIsRetrieving(prev => ({ ...prev, [index]: false }));
    }
  }, [dispatch_date, cost_center?.id, outlet?.id, setValue]);

  // Initialize quantities when component mounts
  useEffect(() => {
    filteredItems.forEach((item, index) => {
      setValue(`items.${index}.quantity`, item.undispatched_quantity);
    });
  }, [filteredItems, setValue]);

  // Update balances when dispatch date changes
  useEffect(() => {
    filteredItems.forEach((item, index) => {
      retrieveBalances(
        item.product.id, 
        watch(`items.${index}.store_id`),
        Number(item.measurement_unit_id), 
        index
      );
    });
  }, [dispatch_date, retrieveBalances, filteredItems, watch]);

  // Handle quantity change with validation
  const handleQuantityChange = useCallback((index: number, value: string) => {
    setValue(`items.${index}.quantity`, Number(value), {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Trigger revalidation for the store field
    setValue(`items.${index}.store_id`, watch(`items.${index}.store_id`), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [setValue, watch]);

  return (
    <>
      {filteredItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <Grid
            container
            spacing={1}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Grid size={12}>
              <Divider />
            </Grid>
            <Grid size={0.5}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
            </Grid>
            <Grid size={{xs: 9.5, md: 8, lg: 4}}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>
                <Tooltip title="Product">
                  <Typography>{item.product?.name}</Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid textAlign={'center'} size={{xs: 2, md: 3.5, lg: 1}}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>
                <Tooltip title="Undispatched Quantity">
                  <Typography>
                    {`${item.measurement_unit?.symbol || ''} ${item.undispatched_quantity}`}
                  </Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 2.5}}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                <StoreSelector
                  allowSubStores={true}
                  defaultValue={null}
                  proposedOptions={stores as any}
                  includeStores={authOrganization?.stores}
                  frontError={errors.items?.[index]?.store_id as any}
                  onChange={(newValue: any) => {
                    if (newValue) {
                      retrieveBalances(
                        item.product.id, 
                        newValue.id,
                        Number(item.measurement_unit_id), 
                        index
                      );
                    }
                    setValue(`items.${index}.store_id`, newValue?.id ?? null, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 6, md: 3, lg: 2}}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                {isRetrieving[index] ? (
                  <LinearProgress />
                ) : (
                  <TextField
                    label="Available Balance"
                    fullWidth
                    size="small"
                    value={watch(`items.${index}.available_balance`) ?? 0}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <span>{item.measurement_unit?.symbol || ''}</span>
                      ),
                    }}
                  />
                )}
              </Div>
            </Grid>
            <Grid size={{xs: 6, md: 3, lg: 2}}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                <TextField
                  label="Dispatch Quantity"
                  fullWidth
                  size="small"
                  error={!!errors.items?.[index]?.quantity}
                  helperText={errors.items?.[index]?.quantity?.message}
                  value={watch(`items.${index}.quantity`) || ''}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                />
              </Div>
            </Grid>
          </Grid>
        </React.Fragment>
      ))}
    </>
  );
}

export default SalesDispatchItemForm;