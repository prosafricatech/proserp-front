'use client';

import React, { useEffect, useState } from 'react';
import { Grid, IconButton, LinearProgress, TextField, Tooltip, Box } from '@mui/material';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useFormContext } from 'react-hook-form';         
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { Div } from '@jumbo/shared';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { FuelVoucherData, ProductPrice } from '../../SalesShiftType';
import FuelVouchersItemRow from './FuelVouchersItemRow';

interface FuelVouchersProps {
  index?: number;
  setShowForm?: (show: boolean) => void;
  fuelVoucher?: FuelVoucherData;
  productPrices: ProductPrice[];
  showList?: boolean;
  onAddSuccess?: (voucher: FuelVoucherData) => void;
  onUpdateSuccess?: (voucher: FuelVoucherData, index: number) => void;
}

interface FormData {
  product_id?: number | null;
  product?: Product | null;
  quantity?: number;
  amount?: number;
  reference?: string | null;
  narration?: string | null;
  stakeholder_id?: number | null;
  expense_ledger_id?: number | null;
  expense_ledger?: Ledger | null;
  stakeholder?: Partial<Stakeholder> | null | undefined;
}

function FuelVouchers({ index = -1, setShowForm, fuelVoucher, productPrices, showList = true, onAddSuccess, onUpdateSuccess }: FuelVouchersProps) {
  const iu = { id: 0, name: 'Calibration/Internal use' } as Partial<Stakeholder>;
  const [isAdding, setIsAdding] = useState(false);
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] = useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState<any>(null);

  const { productOptions = [] } = useProductsSelect();
  const { ungroupedLedgerOptions = [] } = useLedgerSelect();

  const { setValue, getValues } = useFormContext<any>();
  const fuelVouchers: FuelVoucherData[] = getValues('fuelVouchers') || [];
  const setFuelVouchers = (newVouchers: FuelVoucherData[] | ((prev: FuelVoucherData[]) => FuelVoucherData[])) => {
    if (typeof newVouchers === 'function') {
      setValue('fuelVouchers', newVouchers(fuelVouchers));
    } else {
      setValue('fuelVouchers', newVouchers);
    }
  };

  const [formData, setFormData] = useState<FormData>({
    product_id: null,
    product: null,
    quantity: undefined,
    amount: 0,
    reference: '',
    narration: '',
    stakeholder_id: null,
    stakeholder: null,
    expense_ledger_id: null,
    expense_ledger: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quantityFieldKey, setQuantityFieldKey] = useState(0);
  const [amountFieldKey, setAmountFieldKey] = useState(0);

  // Selected objects for display
  const selectedProduct = formData.product_id
    ? productOptions.find(p => p.id === formData.product_id) || null
    : null;

  const selectedStakeholder = formData.stakeholder_id === 0
    ? iu
    : formData.stakeholder || null;

  // Sync when editing
  useEffect(() => {
    if (fuelVoucher && productOptions.length) {
      const product = productOptions.find(p => p.id === fuelVoucher.product_id) || null;
      const stakeholder = fuelVoucher.stakeholder?.id === 0
        ? iu
        : ungroupedLedgerOptions.find(s => s.id === fuelVoucher.stakeholder?.id) || null;

      const priceInfo = productPrices.find(p => p.product_id === product?.id);
      const amount = fuelVoucher.quantity && priceInfo ? fuelVoucher.quantity * priceInfo.price : 0;

      setFormData({
        product_id: fuelVoucher.product_id ?? null,
        product,
        quantity: fuelVoucher.quantity ?? undefined,
        amount,
        reference: fuelVoucher.reference ?? '',
        narration: fuelVoucher.narration ?? '',
        stakeholder_id: fuelVoucher.stakeholder?.id ?? null,
        stakeholder,
        expense_ledger_id: fuelVoucher.expense_ledger?.id ?? null,
        expense_ledger: fuelVoucher.expense_ledger ?? null,
      });

      setQuantityFieldKey(k => k + 1);
      setAmountFieldKey(k => k + 1);
    }
  }, [fuelVoucher, productOptions, productPrices, ungroupedLedgerOptions]);

  // Quick-add stakeholder
  useEffect(() => {
    if (addedStakeholder?.id) {
      setFormData(prev => ({
        ...prev,
        stakeholder: addedStakeholder,
        stakeholder_id: addedStakeholder.id,
      }));
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder]);

  // CALCULATION LOGIC FROM VERSION 1 - IMPLEMENTED PROPERLY
  const calculateAndSetValues = (field: 'quantity' | 'amount', value: number) => {
    if (formData.product_id) {
      const product = productPrices.find(price => price?.product_id === formData.product_id);
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

  const calculateAmount = () => {
    if (!formData.product_id || !formData.quantity) return 0;
    const price = productPrices.find(p => p.product_id === formData.product_id)?.price || 0;
    return sanitizedNumber(formData.quantity * price);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.product_id) newErrors.product_id = 'Fuel is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateItems = async () => {
    if (!validateForm()) return;

    setIsAdding(true);
    
    // Use the calculated amount for final submission
    const finalAmount = formData.amount || calculateAmount();

    const voucherData: FuelVoucherData = {
      ...formData,
      amount: finalAmount,
      product: selectedProduct,
      stakeholder: formData.stakeholder_id === 0 ? iu as any : formData.stakeholder,
      expense_ledger: formData.expense_ledger,
    } as FuelVoucherData;

    try {
      if (index > -1) {
        const updated = fuelVouchers.map((v, i) => (i === index ? voucherData : v));
        setFuelVouchers(updated);
        onUpdateSuccess?.(voucherData, index);
      } else {
        setFuelVouchers(prev => [...prev, voucherData]);
        onAddSuccess?.(voucherData);
        // Reset form
        setFormData({
          product_id: null, product: null, quantity: undefined, amount: 0,
          reference: '', narration: '', stakeholder_id: null, stakeholder: null,
          expense_ledger_id: null, expense_ledger: null,
        });
        setQuantityFieldKey(k => k + 1);
        setAmountFieldKey(k => k + 1);
      }
    } finally {
      setIsAdding(false);
      setShowForm?.(false);
    }
  };

  const handleProductChange = (newValue: Product | null) => {
    setFormData(prev => ({
      ...prev,
      product_id: newValue?.id ?? null,
      product: newValue,
    }));
    // Reset calculations when product changes
    setFormData(prev => ({ ...prev, amount: 0 }));
    setAmountFieldKey(k => k + 1);
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

  if (isAdding) return <LinearProgress />;

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={1} mt={0.5}>
        {/* Client */}
        {!stakeholderQuickAddDisplay ? (
          <Grid size={{ xs: 12, md: 4, lg: formData.stakeholder_id ? 5 : 4 }}>
            <Div sx={{ mt: 1 }}>
              <StakeholderSelector
                label='Client'
                initialOptions={[iu as any]}
                defaultValue={fuelVoucher && fuelVoucher.stakeholder?.id}
                frontError={errors.stakeholder_id ? { message: errors.stakeholder_id } : undefined}
                addedStakeholder={addedStakeholder}
                onChange={(newValue: any | null) => {
                  setFormData(prev => ({
                    ...prev,
                    stakeholder: newValue,
                    stakeholder_id: newValue ? newValue.id : null
                  }));
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
        ) : (
          <StakeholderQuickAdd
            setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
            create_receivable={true}
            setAddedStakeholder={setAddedStakeholder}
          />
        )}

        {/* Expense Ledger – only when no client */}
        {!formData.stakeholder_id && (
          <Grid size={{ xs: 12, md: 4, lg: 4 }}>
            <Div sx={{ mt: 1 }}>
              <LedgerSelect
                label="Expense Ledger"
                defaultValue={formData.expense_ledger ? [formData.expense_ledger] : undefined}
                onChange={(val) => {
                  const ledger = Array.isArray(val) ? val[0] : val;
                  setFormData(prev => ({
                    ...prev,
                    expense_ledger: ledger || null,
                    expense_ledger_id: ledger?.id ?? null,
                  }));
                }}
              />
            </Div>
          </Grid>
        )}

        {/* Fuel */}
        <Grid size={{ xs: 12, md: 4, lg: formData.stakeholder_id ? 3.5 : 4 }}>
          <Div sx={{ mt: 1 }}>
            <ProductSelect
              label="Fuel"
              defaultValue={selectedProduct}
              frontError={errors.product_id ? { message: errors.product_id } : undefined}
              onChange={handleProductChange}
              excludeIds={productOptions.filter(p => p.type !== 'Inventory').map(p => p.id)}
            />
          </Div>
        </Grid>

        {/* Quantity */}
        <Grid size={{ xs: 12, md: 4, lg: 1.5 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              key={quantityFieldKey}
              value={formData.quantity?.toLocaleString() || ''}
              error={!!errors.quantity}
              helperText={errors.quantity}
              label="Quantity"
              InputProps={{ inputComponent: CommaSeparatedField as any }}
              onChange={handleQuantityChange}
            />
          </Div>
        </Grid>

        {/* Amount */}
        <Grid size={{ xs: 12, md: 4, lg: formData.stakeholder_id ? 2 : 2.5 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              label="Amount"
              fullWidth
              size="small"
              key={amountFieldKey}
              value={formData.amount?.toLocaleString() || '0'}
              InputProps={{ inputComponent: CommaSeparatedField as any }}
              onChange={handleAmountChange}
            />
          </Div>
        </Grid>

        {/* Reference */}
        <Grid size={{ xs: 12, md: 4, lg: formData.stakeholder_id ? 5 : 4 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              label="Reference"
              value={formData.reference || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value || null }))}
            />
          </Div>
        </Grid>

        {/* Narration */}
        <Grid size={{ xs: 12, md: formData.stakeholder_id ? 4 : 12, lg: formData.stakeholder_id ? 7 : 4 }}>
          <Div sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              multiline
              rows={2}
              label="Narration"
              value={formData.narration || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value || null }))}
            />
          </Div>
        </Grid>

        {/* Buttons */}
        <Grid size={12} textAlign="end">
          <LoadingButton
            loading={isAdding}
            variant="contained"
            size="small"
            onClick={updateItems}
            startIcon={fuelVoucher ? <CheckOutlined /> : <AddOutlined />}
            sx={{ mb: 0.5 }}
          >
            {fuelVoucher ? 'Done' : 'Add'}
          </LoadingButton>

          {fuelVoucher && setShowForm && (
            <Tooltip title="Close">
              <IconButton size="small" onClick={() => setShowForm(false)}>
                <DisabledByDefault color="success" />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>

      {/* Display Added Vouchers */}
      {showList && fuelVouchers.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {fuelVouchers.map((voucher, idx) => (
            <FuelVouchersItemRow
              key={idx}
              fuelVoucher={voucher}
              index={idx}
              productPrices={productPrices}
            />
          ))}
        </Box> 
      )}
    </Box>
  );
}

export default FuelVouchers;