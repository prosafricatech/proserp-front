'use client';

import React, { useEffect, useState } from 'react';
import { Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { useForm, useFormContext, UseFormReturn, FieldValues } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { Div } from '@jumbo/shared';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useStakeholderSelect } from '@/components/masters/stakeholders/StakeholderSelectProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';

// Type definitions
interface Stakeholder {
  id: number;
  name: string;
  [key: string]: any;
}

interface Product {
  id: number;
  name: string;
  [key: string]: any;
}

interface ProductPrice {
  product_id: number;
  price: number;
  [key: string]: any;
}

interface Ledger {
  id: number;
  name: string;
  [key: string]: any;
}

interface FuelVoucherData {
  product_id?: number;
  quantity?: number;
  amount?: number;
  reference?: string | null;
  narration?: string | null;
  stakeholder?: Stakeholder | null;
  stakeholder_id?: number | null;
  expense_ledger?: Ledger | null;
  expense_ledger_id?: number | null;
  product?: Product | null;
}

interface FuelVouchersProps {
  index?: number;
  setShowForm?: (show: boolean) => void;
  fuelVoucher?: FuelVoucherData;
  productPrices: ProductPrice[];
}

interface FormData {
  product_id?: number;
  quantity?: number;
  amount?: number;
  reference?: string | null;
  narration?: string | null;
  stakeholder?: Stakeholder | null;
  stakeholder_id?: number | null;
  expense_ledger?: Ledger | null;
  expense_ledger_id?: number | null;
  product?: Product | null;
}

// Validation schema 
const validationSchema = yup.object({
  product_id: yup.number().required("Product is required").typeError('Product is required'),
  quantity: yup.number().required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
});

function FuelVouchers({ index = -1, setShowForm = undefined, fuelVoucher, productPrices }: FuelVouchersProps) {
  const iu: Stakeholder = { id: 0, name: 'Calibration/Internal use' };
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { products, fuelVouchers = [], setFuelVouchers } = useFormContext() as UseFormReturn<FieldValues> & {
    products?: Product[];
    fuelVouchers?: FuelVoucherData[];
    setFuelVouchers?: React.Dispatch<React.SetStateAction<FuelVoucherData[]>>;
  };
  const { productOptions } = useProductsSelect();
  const { stakeholders } = useStakeholderSelect();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] = useState<boolean>(false);
  const [addedStakeholder, setAddedStakeholder] = useState<any | null>(null);

  const product = fuelVoucher && productOptions.find((product: Product) => product.id === fuelVoucher?.product_id);
  const product_price = fuelVoucher && productPrices.find((price: ProductPrice) => price?.product_id === product?.id)?.price;

  const { setValue, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      product: fuelVoucher && product,
      stakeholder: fuelVoucher && stakeholders.find((stakeholder: Stakeholder) => stakeholder.id === fuelVoucher.stakeholder?.id),
      stakeholder_id: fuelVoucher ? fuelVoucher.stakeholder?.id : null,
      expense_ledger: fuelVoucher && ungroupedLedgerOptions.find((ledger: Ledger) => ledger.id === fuelVoucher.expense_ledger?.id),
      expense_ledger_id: fuelVoucher && fuelVoucher.expense_ledger?.id,
      product_id: fuelVoucher && fuelVoucher.product_id, 
      quantity: fuelVoucher && fuelVoucher.quantity,
      amount: fuelVoucher && product_price && fuelVoucher.quantity ? product_price * fuelVoucher.quantity : 0, 
      reference: fuelVoucher && fuelVoucher.reference,
      narration: fuelVoucher && fuelVoucher.narration,
    }
  });

  // Set values from addedStakeholder
  useEffect(() => {
    if (addedStakeholder?.id) {
      setValue('stakeholder_id', addedStakeholder.id);
      setValue('stakeholder', addedStakeholder);
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder, setValue]);

  const updateItems = async (item: FormData) => {
    setIsAdding(true);
    
    if (index > -1) {
      // Replace the existing item with the edited item
      const updatedFuelVouchers = [...fuelVouchers];
      updatedFuelVouchers[index] = item;
      if (setFuelVouchers) {
        await setFuelVouchers(updatedFuelVouchers);
      } else {
        console.warn('setFuelVouchers is not available');
      }
    } else {
      // Add the new item to the fuelVouchers array
      if (setFuelVouchers) {
        await setFuelVouchers((prevFuelVouchers: FuelVoucherData[] = []) => [...prevFuelVouchers, item]);
      } else {
        console.warn('setFuelVouchers is not available');
      }
    }

    reset();
    setIsAdding(false);
    setAddedStakeholder(null);
    setShowForm && setShowForm(false);
  };

  const [quantityFieldKey, setQuantityFieldKey] = useState<number>(0);
  const [amountFieldKey, setAmountFieldKey] = useState<number>(0);

  const calculateAndSetValues = (field: 'quantity' | 'amount', value: number) => {
    const productId = watch('product_id');
    if (productId) {
      const product = productPrices.find((price: ProductPrice) => price?.product_id === productId);
      if (product) {
        if (field === 'quantity') {
          const calculatedAmount = sanitizedNumber(value * product.price);
          setValue('amount', calculatedAmount);
          setAmountFieldKey(key => key + 1);
        } else if (field === 'amount') {
          const calculatedQuantity = sanitizedNumber(value / product.price);
          setValue('quantity', calculatedQuantity);
          setQuantityFieldKey(key => key + 1);
        }
      }
    }
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  const watchedStakeholderId = watch('stakeholder_id');
  const watchedQuantity = watch('quantity');
  const watchedAmount = watch('amount');
  const watchedNarration = watch('narration');

  return (
      <Grid container spacing={1} marginTop={0.5}>
        {!stakeholderQuickAddDisplay && (
         <Grid 
            size={{
              xs: 12,
              md: 4,
              lg: !watchedStakeholderId ? 4 : 5
            }}
          >
            <Div sx={{ mt: 1 }}>
              <StakeholderSelector
                label='Client'
                initialOptions={[iu as any]}
                defaultValue={fuelVoucher && fuelVoucher.stakeholder?.id}
                frontError={errors.stakeholder_id ? { message: errors.stakeholder_id.message ?? '' } : undefined}
                addedStakeholder={addedStakeholder}
                onChange={(newValue: any | null) => {
                  setValue('stakeholder', newValue);
                  setValue('stakeholder_id', newValue ? newValue.id : null, {
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
                startAdornment={
                  <Tooltip title={'Add Client'}>
                    <AddOutlined
                      onClick={() => setStakeholderQuickAddDisplay(true)}
                      sx={{
                        cursor: 'pointer',
                      }}
                    />
                  </Tooltip>
                }
              />
            </Div>
          </Grid>
        )}

        {stakeholderQuickAddDisplay && (
          <StakeholderQuickAdd 
            setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay} 
            create_receivable={true} 
            setAddedStakeholder={setAddedStakeholder}
          />
        )} 
  
        {!watchedStakeholderId && (
          <Grid size={{xs:12, md:4, lg:4 }}>
            <Div sx={{ mt: 1 }}>
              <LedgerSelect
                label={'Expense Ledger'}
                frontError={errors.expense_ledger_id ? { message: errors.expense_ledger_id.message ?? '' } : undefined}
                defaultValue={ungroupedLedgerOptions.find((ledger: Ledger) => ledger.id === watch('expense_ledger')?.id)}
                onChange={(newValue: Ledger | Ledger[] | null) => {
                  const ledger = Array.isArray(newValue) ? (newValue.length ? newValue[0] : null) : newValue;
                  setValue('expense_ledger', ledger);
                  setValue('expense_ledger_id', ledger ? ledger.id : null, {
                    shouldValidate: true,
                    shouldDirty: true
                  });
                }}
              />
            </Div>
          </Grid>
        )}
        
        <Grid 
            size={{
              xs: 12,
              md: 4,
              lg: !watchedStakeholderId ? 4 : 3.5
            }}
          >
            <Div sx={{ mt: 1 }}>
            <ProductSelect
              label='Fuel'
              frontError={errors.product_id ? { message: errors.product_id.message ?? '' } : undefined}
              defaultValue={fuelVoucher && productOptions.find((product: Product) => product.id === fuelVoucher.product_id)}
              requiredProducts={products}
              onChange={(newValue: Product | null) => {
                setValue('product', newValue);
                calculateAndSetValues('amount', 0);
                setValue('product_id', newValue ? newValue.id : undefined, {
                  shouldValidate: true, 
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
        
        <Grid  
            size={{
              xs: 12,
              md: 4,
              lg: !watchedStakeholderId ? 1.5 : 1.5
            }}
          >
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              key={quantityFieldKey}
              defaultValue={fuelVoucher && fuelVoucher.quantity}
              error={!!errors?.quantity}
              helperText={errors?.quantity?.message}
              label="Quantity"
              value={watchedQuantity?.toLocaleString() || ''}
              InputProps={{
                inputComponent: CommaSeparatedField as any
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = sanitizedNumber(e.target.value);
                setValue('quantity', value, { shouldValidate: true, shouldDirty: true });
                calculateAndSetValues('quantity', value);
              }}
            />
          </Div>
        </Grid>
        
        <Grid  
            size={{
              xs: 12,
              md: 4,
              lg: !watchedStakeholderId ? 2.5 : 2
            }}
          >
          <Div sx={{ mt: 1 }}>
            <TextField
              label="Amount"
              fullWidth
              key={amountFieldKey}
              size='small'
              value={watchedAmount?.toLocaleString() || '0'}
              InputProps={{
                inputComponent: CommaSeparatedField as any,
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = sanitizedNumber(e.target.value);
                setValue('amount', value, { shouldValidate: true, shouldDirty: true });
                calculateAndSetValues('amount', value);
              }}
            />
          </Div>
        </Grid>
        
        <Grid 
            size={{
              xs: 12,
              md: 4,
              lg: !watchedStakeholderId ? 4 : 5
            }}
          >
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              defaultValue={fuelVoucher && fuelVoucher.reference}
              label="Reference"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue('reference', e.target.value ? e.target.value : null, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        
       <Grid  
            size={{
              xs: 12,
              md: !watchedStakeholderId ? 12 : 4,
              lg: !watchedStakeholderId ? 4 : 7
            }}
          >
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline={true}
              rows={2}
              defaultValue={watchedNarration}
              label="Narration"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setValue('narration', e.target.value ? e.target.value : null, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        
        <Grid size={{xs:12, md:12, lg:12 }} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            type='submit'
            size='small'
            sx={{ marginBottom: 0.5 }}
          >
            {fuelVoucher ? (
              <><CheckOutlined fontSize='small' /> Done</>
            ) : (
              <><AddOutlined fontSize='small' /> Add</>
            )}
          </LoadingButton>
          {fuelVoucher && (
            <Tooltip title='Close Edit'>
              <IconButton 
                size='small' 
                onClick={() => {
                  setShowForm && setShowForm(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success'/>
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
  );
}

export default FuelVouchers;