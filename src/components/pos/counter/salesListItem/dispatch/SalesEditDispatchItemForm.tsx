import { Divider, Grid, LinearProgress, TextField, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState, useCallback } from 'react';
import { useCounter } from '../../CounterProvider';
import { useFormContext } from 'react-hook-form';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import productServices from '@/components/productAndServices/products/productServices';
import StoreSelector from '@/components/procurement/stores/StoreSelector';
import { Div } from '@jumbo/shared';

interface Product {
  id: number;
  name: string;
  measurement_unit?: {
    symbol: string;
  };
}

interface SaleItem {
  measurement_unit?: {
    symbol: string;
  };
  undispatched_quantity: number
}

interface Store {
  id: number;
  name: string;
}

interface FormItem {
  product: Product;
  sale_item: SaleItem;
  quantity: number;
  store_id?: number;
  store?: Store;
  available_balance?: number | string;
  current_balance?: number;
}

interface SalesEditDispatchItemFormProps {
  items: FormItem[];
}

function SalesEditDispatchItemForm({ items }: SalesEditDispatchItemFormProps) {
  const { outlet } = useCounter();
  const { stores, cost_center } = outlet || {};
  const { authOrganization } = useJumboAuth();
  const { setValue, watch, formState: { errors } } = useFormContext<{
    items: FormItem[];
    dispatch_date: string;
  }>();

  const [isRetrieving, setIsRetrieving] = useState<Record<number, boolean>>({});

  const retrieveBalances = useCallback(async (productId: number, storeId: number | undefined, index: number) => {
    if (!productId) {
      setValue(`items.${index}.available_balance`, 'N/A');
      return;
    }

    try {
      setIsRetrieving(prev => ({ ...prev, [index]: true }));
      const quantity = parseFloat(String(watch(`items.${index}.quantity`) || 0));
      
      const balances = await productServices.getStoreBalances({
        as_at: watch('dispatch_date'),
        productId,
        storeIds: storeId ? [storeId] : [],
        costCenterId: cost_center?.id,
        sales_outlet_id: outlet?.id
      });

      const storeBalance = storeId 
        ? balances.stock_balances.find(
            (balance: any) => balance.store_id === storeId && 
                      balance.cost_center_id === outlet?.cost_center?.id
          )
        : null;

      const availableBalance = parseFloat(storeBalance?.balance || '0');
      const currentBalance = parseFloat(storeBalance?.current_balance || '0') + quantity;

      setValue(`items.${index}.available_balance`, availableBalance);
      setValue(`items.${index}.current_balance`, currentBalance);
    } catch (error) {
      console.error('Error retrieving balances:', error);
      setValue(`items.${index}.available_balance`, 'N/A');
    } finally {
      setIsRetrieving(prev => ({ ...prev, [index]: false }));
    }
  }, [cost_center?.id, outlet?.id, setValue, watch]);

  useEffect(() => {
    items.forEach((item, index) => {
      retrieveBalances(item.product.id, item.store?.id, index);
    });
  }, [items, retrieveBalances]);

  const handleQuantityChange = (index: number, value: string) => {
    setValue(`items.${index}.quantity`, Number(value), {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Trigger revalidation for the store field
    setValue(`items.${index}.store_id`, watch(`items.${index}.store_id`), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <>
      {items.map((item, index) => (
        <React.Fragment key={`${item.product.id}-${index}`}>
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
                <Tooltip title="Dispatched Product">
                  <Typography>{item.product.name}</Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid size={{xs: 2, md: 3.5, lg: 1}} textAlign={'center'}>
              <Div sx={{ mt: 1.7, mb: 1.7 }}>
                <Tooltip title="Undispatched Quantity">
                  <Typography>
                    {`${item.sale_item.measurement_unit?.symbol || ''} ${item.sale_item.undispatched_quantity}`}
                  </Typography>
                </Tooltip>
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 6, lg: 2.5}}>
              <Div sx={{ mt: 0.7, mb: 0.5 }}>
                <StoreSelector
                  allowSubStores={true}
                  defaultValue={watch(`items.${index}.store`)}
                  proposedOptions={stores as any}
                  includeStores={authOrganization?.stores || []}
                  frontError={errors.items?.[index]?.store_id?.message as any}
                  onChange={(newValue: any) => {
                    if (newValue) {
                      retrieveBalances(item.product.id, newValue.id, index);
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
                    value={watch(`items.${index}.available_balance`) || ''}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <span>{item.product.measurement_unit?.symbol || ''}</span>
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

export default SalesEditDispatchItemForm;