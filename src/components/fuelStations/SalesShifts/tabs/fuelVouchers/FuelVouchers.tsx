'use client';

import React, { useEffect, useState } from 'react';
import { Grid, IconButton, LinearProgress, TextField, Tooltip, Box } from '@mui/material';
import { useFormContext, UseFormReturn, FieldValues } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
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
import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { FuelVoucherData, ProductPrice } from '../../SalesShiftType';


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

function FuelVouchers({ index = -1, setShowForm = undefined, fuelVoucher, productPrices }: FuelVouchersProps) {
  const iu = { id: 0, name: 'Calibration/Internal use' } as Partial<Stakeholder>;
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { products, fuelVouchers = [], setFuelVouchers } = useFormContext() as UseFormReturn<FieldValues> & {
    products?: Product[];
    fuelVouchers?: FuelVoucherData[];
    setFuelVouchers?: React.Dispatch<React.SetStateAction<FuelVoucherData[]>>;
  };
  const { productOptions = [] } = useProductsSelect();
  const { stakeholders = [] } = useStakeholderSelect();
  const { ungroupedLedgerOptions = [] } = useLedgerSelect();
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] = useState<boolean>(false);
  const [addedStakeholder, setAddedStakeholder] = useState<any | null>(null);

  // Use local state instead of useForm
  const [formData, setFormData] = useState<FormData>(() => {
    const product = fuelVoucher && productOptions.find((p: Product) => p.id === fuelVoucher?.product_id);
    const product_price = fuelVoucher && productPrices.find((price: ProductPrice) => price?.product_id === product?.id)?.price;
    
    return {
      product: product || null,
      stakeholder: fuelVoucher && stakeholders.find((s: Stakeholder) => s.id === fuelVoucher.stakeholder?.id) || null,
      stakeholder_id: fuelVoucher ? fuelVoucher.stakeholder?.id : null,
      expense_ledger: fuelVoucher && ungroupedLedgerOptions.find((l: Ledger) => l.id === fuelVoucher.expense_ledger?.id) || null,
      expense_ledger_id: fuelVoucher && fuelVoucher.expense_ledger?.id,
      product_id: fuelVoucher?.product_id, 
      quantity: fuelVoucher?.quantity,
      amount: fuelVoucher && product_price && fuelVoucher.quantity ? product_price * fuelVoucher.quantity : 0, 
      reference: fuelVoucher?.reference || '',
      narration: fuelVoucher?.narration || '',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set values from addedStakeholder
  useEffect(() => {
    if (addedStakeholder?.id) {
      setFormData(prev => ({
        ...prev,
        stakeholder_id: addedStakeholder.id,
        stakeholder: addedStakeholder
      }));
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = "Product is required";
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

    // Check if setFuelVouchers exists and is a function
    if (typeof setFuelVouchers !== 'function') {
      console.error('setFuelVouchers is not available');
      setIsAdding(false);
      return;
    }

    setIsAdding(true);
    
    try {
      if (index > -1) {
        // Replace the existing item with the edited item
        const updatedFuelVouchers = [...fuelVouchers];
        updatedFuelVouchers[index] = formData as FuelVoucherData;
        await setFuelVouchers(updatedFuelVouchers);
      } else {
        // Add the new item to the fuelVouchers array
        await setFuelVouchers((prevFuelVouchers: FuelVoucherData[] = []) => [...prevFuelVouchers, formData as FuelVoucherData]);
      }

      // Only reset if it's a new item, not when editing
      if (index === -1) {
        setFormData({
          product: null,
          stakeholder: null,
          stakeholder_id: null,
          expense_ledger: null,
          expense_ledger_id: null,
          product_id: undefined,
          quantity: undefined,
          amount: 0,
          reference: '',
          narration: '',
        });
      }
      
      setAddedStakeholder(null);
    } catch (error) {
      console.error('Error updating fuel vouchers:', error);
    } finally {
      setIsAdding(false);
      setShowForm && setShowForm(false);
    }
  };

  const [quantityFieldKey, setQuantityFieldKey] = useState<number>(0);
  const [amountFieldKey, setAmountFieldKey] = useState<number>(0);

  const calculateAndSetValues = (field: 'quantity' | 'amount', value: number) => {
    if (formData.product_id) {
      const product = productPrices.find((price: ProductPrice) => price?.product_id === formData.product_id);
      if (product) {
        if (field === 'quantity') {
          const calculatedAmount = sanitizedNumber(value * product.price);
          setFormData(prev => ({ ...prev, amount: calculatedAmount }));
          setAmountFieldKey(key => key + 1);
        } else if (field === 'amount') {
          const calculatedQuantity = sanitizedNumber(value / product.price);
          setFormData(prev => ({ ...prev, quantity: calculatedQuantity }));
          setQuantityFieldKey(key => key + 1);
        }
      }
    }
  };

  const handleProductChange = (newValue: Product | null) => {
    setFormData(prev => ({
      ...prev,
      product: newValue,
      product_id: newValue ? newValue.id : undefined
    }));
    calculateAndSetValues('amount', 0);
  };

  const handleStakeholderChange = (newValue: any | null) => {
    setFormData(prev => ({
      ...prev,
      stakeholder: newValue,
      stakeholder_id: newValue ? newValue.id : null
    }));
  };

  const handleExpenseLedgerChange = (newValue: Ledger | Ledger[] | null) => {
    const ledger = Array.isArray(newValue) ? (newValue.length ? newValue[0] : null) : newValue;
    setFormData(prev => ({
      ...prev,
      expense_ledger: ledger,
      expense_ledger_id: ledger ? ledger.id : null
    }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizedNumber(e.target.value);
    setFormData(prev => ({ ...prev, quantity: value }));
    calculateAndSetValues('quantity', value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizedNumber(e.target.value);
    setFormData(prev => ({ ...prev, amount: value }));
    calculateAndSetValues('amount', value);
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      reference: e.target.value ? e.target.value : null 
    }));
  };

  const handleNarrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      narration: e.target.value ? e.target.value : null 
    }));
  };

  // Use onClick instead of type='submit'
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
        {!stakeholderQuickAddDisplay && (
          <Grid 
            size={{
              xs: 12,
              md: 4,
              lg: !formData.stakeholder_id ? 4 : 5
            }}
          >
            <Div sx={{ mt: 1 }}>
              <StakeholderSelector
                label='Client'
                initialOptions={[iu as any]}
                defaultValue={formData.stakeholder_id}
                frontError={errors.stakeholder_id ? { message: errors.stakeholder_id } : undefined}
                addedStakeholder={addedStakeholder}
                onChange={handleStakeholderChange}
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
  
        {!formData.stakeholder_id && (
          <Grid size={{xs:12, md:4, lg:4 }}>
            <Div sx={{ mt: 1 }}>
              <LedgerSelect
                label={'Expense Ledger'}
                frontError={errors.expense_ledger_id ? { message: errors.expense_ledger_id } : undefined}
                defaultValue={formData.expense_ledger ? [formData.expense_ledger] : undefined}
                onChange={handleExpenseLedgerChange}
              />
            </Div>
          </Grid>
        )}
        
        <Grid 
          size={{
            xs: 12,
            md: 4,
            lg: !formData.stakeholder_id ? 4 : 3.5
          }}
        >
          <Div sx={{ mt: 1 }}>
            <ProductSelect
              label='Fuel'
              frontError={errors.product_id ? { message: errors.product_id } : undefined}
              value={formData.product}
              requiredProducts={products}
              onChange={handleProductChange}
            />
          </Div>
        </Grid>
        
        <Grid  
          size={{
            xs: 12,
            md: 4,
            lg: !formData.stakeholder_id ? 1.5 : 1.5
          }}
        >
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              key={quantityFieldKey}
              value={formData.quantity?.toLocaleString() || ''}
              error={!!errors?.quantity}
              helperText={errors?.quantity}
              label="Quantity"
              InputProps={{
                inputComponent: CommaSeparatedField as any
              }}
              onChange={handleQuantityChange}
            />
          </Div>
        </Grid>
        
        <Grid  
          size={{
            xs: 12,
            md: 4,
            lg: !formData.stakeholder_id ? 2.5 : 2
          }}
        >
          <Div sx={{ mt: 1 }}>
            <TextField
              label="Amount"
              fullWidth
              key={amountFieldKey}
              size='small'
              value={formData.amount?.toLocaleString() || '0'}
              InputProps={{
                inputComponent: CommaSeparatedField as any,
              }}
              onChange={handleAmountChange}
            />
          </Div>
        </Grid>
        
        <Grid 
          size={{
            xs: 12,
            md: 4,
            lg: !formData.stakeholder_id ? 4 : 5
          }}
        >
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={formData.reference || ''}
              label="Reference"
              onChange={handleReferenceChange}
            />
          </Div>
        </Grid>
        
        <Grid  
          size={{
            xs: 12,
            md: !formData.stakeholder_id ? 12 : 4,
            lg: !formData.stakeholder_id ? 4 : 7
          }}
        >
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline={true}
              rows={2}
              value={formData.narration || ''}
              label="Narration"
              onChange={handleNarrationChange}
            />
          </Div>
        </Grid>
        
        <Grid size={{xs:12, md:12, lg:12 }} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            size='small'
            sx={{ marginBottom: 0.5 }}
            onClick={handleAddClick} // Changed from type='submit' to onClick
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
    </Box>
  );
}

export default FuelVouchers;