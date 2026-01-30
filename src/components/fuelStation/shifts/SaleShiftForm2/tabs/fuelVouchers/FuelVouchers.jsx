'use client';

import { useContext, useEffect, useState } from 'react';
import { Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { useForm, useFormContext } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useStakeholderSelect } from '@/components/masters/stakeholders/StakeholderSelectProvider';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import { StationFormContext } from '../../../SalesShifts';

function FuelVouchers({ index = -1, setShowForm = null, fuelVoucher, productPrices, fuelVouchers=[], setFuelVouchers }) {
  const iu = {id: null, name: 'Calibration/Internal use'};
  const [isAdding, setIsAdding] = useState(false);
  const {activeStation} = useContext(StationFormContext);
  const { products } = activeStation;
  const { productOptions } = useProductsSelect();
  const {stakeholders} = useStakeholderSelect();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] = useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState(null);

  const product = fuelVoucher && productOptions.find(product => product.id === fuelVoucher?.product_id);
  const product_price = fuelVoucher && productPrices.find(price => price?.product_id === product.id)?.price

  // Define validation schema
  const validationSchema = yup.object({
    product_id: yup.number().required("Product is required").typeError('Product is required'),
    quantity: yup.number().required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
  });

  const {setValue, handleSubmit, watch, reset, formState: {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      product: fuelVoucher && product,
      stakeholder: fuelVoucher && stakeholders.find(stakeholder => stakeholder.id === fuelVoucher.stakeholder?.id),
      stakeholder_id: fuelVoucher ? fuelVoucher.stakeholder?.id : null,
      expense_ledger: fuelVoucher && ungroupedLedgerOptions.find(ledger => ledger.id === fuelVoucher.expense_ledger?.id),
      expense_ledger_id: fuelVoucher && fuelVoucher.expense_ledger?.id,
      product_id: fuelVoucher && fuelVoucher.product_id, 
      quantity: fuelVoucher && fuelVoucher.quantity,
      amount: fuelVoucher && product_price * fuelVoucher.quantity, 
      reference: fuelVoucher && fuelVoucher.reference,
      narration: fuelVoucher && fuelVoucher.narration,
    }
  });

  // setvalues from coming addedStakeholder
  useEffect(() => {
    if(addedStakeholder?.id){
      setValue('stakeholder_id', addedStakeholder.id);
      setValue('stakeholder', addedStakeholder);
      setStakeholderQuickAddDisplay(false)
    }
  }, [addedStakeholder])

  const updateItems = async (item) => {
    setIsAdding(true);
    if (index > -1) {
      // Replace the existing item with the edited item
      let updatedFuelVouchers = [...fuelVouchers];
      updatedFuelVouchers[index] = item;
      await setFuelVouchers(updatedFuelVouchers);
    } else {
      // Add the new item to the fuelVouchers array
      await setFuelVouchers((fuelVouchers) => [...fuelVouchers, item]);
    }

    reset();
    setIsAdding(false);
    setAddedStakeholder(null);
    setShowForm && setShowForm(false);
  };

  const [quantityFieldKey, setQuantityFieldKey] = useState(0)
  const [amountFieldKey, setAmountFieldKey] = useState(0)

  const calculateAndSetValues = (field, value) => {
    const productId = watch('product_id');
    if (productId) {
      const product = productPrices.find(price => price?.product_id === productId);
      if (product) {
        if (field === 'quantity') {
          const calculatedAmount = sanitizedNumber(value * product.price);
          setValue('amount', calculatedAmount);
          setAmountFieldKey(key=>key+1);
        } else if (field === 'amount') {
          const calculatedQuantity = sanitizedNumber(value / product.price);
          setValue('quantity', calculatedQuantity);
          setQuantityFieldKey(key=> key+1)
        }
      }
    }
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container spacing={1} marginTop={0.5}>
        {!stakeholderQuickAddDisplay &&
          <Grid size={{xs:12, md:4, lg: !watch(`stakeholder_id`) ? 4 : 5}}>
            <Div sx={{ mt: 1}}>
              <StakeholderSelector
                label='Client'
                initialOptions={[iu]}
                defaultValue={fuelVoucher && fuelVoucher.stakeholder?.id}
                frontError={errors.stakeholder_id}
                addedStakeholder={addedStakeholder}
                onChange={(newValue) => {
                  setValue(`stakeholder`, newValue)
                  setValue(`stakeholder_id`, newValue ? newValue.id : null,{
                    shouldDirty: true,
                    shouldValidate: true
                  });
                }}
                startAdornment= {
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
        }

        {stakeholderQuickAddDisplay && <StakeholderQuickAdd setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay} create_receivable={true} setAddedStakeholder={setAddedStakeholder}/>} 
  
        {!watch(`stakeholder_id`) &&
          <Grid size={{xs: 12, md: 4, lg: 4}}>
            <Div sx={{ mt: 1}}>
              <LedgerSelect
                label={'Expense Ledger'}
                frontError={errors.expense_ledger_id}
                defaultValue={ungroupedLedgerOptions.find(ledger => ledger.id === watch(`expense_ledger`)?.id)}
                allowedGroups={['Expenses']}
                onChange={(newValue) => {
                  setValue(`expense_ledger`, newValue)
                  setValue('expense_ledger_id', newValue ? newValue.id : null,{
                    shouldValidate: true,
                    shouldDirty: true
                  })
                }}
              />
            </Div>
          </Grid>
        }
        <Grid size={{xs:12, md:4, lg: !watch(`stakeholder_id`) ? 4 : 3}}>
          <Div sx={{ mt: 1}}>
            <ProductSelect
              label='Fuel'
              frontError={errors.product_id}
              defaultValue={fuelVoucher && productOptions.find(product => product.id === fuelVoucher.product_id)}
              requiredProducts={products}
              onChange={(newValue) => {
                setValue(`product`, newValue)
                calculateAndSetValues('amount', 0);
                setValue(`product_id`, newValue ? newValue.id : '', {
                  shouldValidate: true, 
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
       <Grid size={{xs:12, md:4, lg: !watch(`stakeholder_id`) ? 1.5 : 1.5}}>
          <Div sx={{ mt: 1}}>
            <TextField
              size="small"
              fullWidth
              key={quantityFieldKey}
              defaultValue={fuelVoucher && fuelVoucher.quantity}
              error={errors && !!errors?.quantity}
              helperText={errors && errors.quantity?.message}
              label="Quantity"
              value={watch(`quantity`)?.toLocaleString()}
              InputProps={{
                inputComponent: CommaSeparatedField
              }}
              onChange={(e) => {
                const value = sanitizedNumber(e.target.value);
                setValue('quantity', value, { shouldValidate: true, shouldDirty: true });
                calculateAndSetValues('quantity', value);
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs:12, md:4, lg: !watch(`stakeholder_id`) ? 2.5 : 2}}>
          <Div sx={{ mt: 1}}>
            <TextField
              label="Amount"
              fullWidth
              key={amountFieldKey}
              size='small'
              value={watch(`amount`)?.toLocaleString() || 0}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e) => {
                const value = sanitizedNumber(e.target.value);
                setValue('amount', value, { shouldValidate: true, shouldDirty: true });
                calculateAndSetValues('amount', value);
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs:12, md:4, lg: !watch(`stakeholder_id`) ? 4 : 5}}>
          <Div sx={{ mt: 1}}>
            <TextField
              size="small"
              fullWidth
              defaultValue={fuelVoucher && fuelVoucher.reference}
              label="Reference"
              onChange={(e) => {
                setValue(`reference`,e.target.value ? e.target.value : null,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs:12, md:!watch(`stakeholder_id`)? 12 : 4, lg:!watch(`stakeholder_id`) ? 4 : 7}}>
          <Div sx={{ mt: 1}}>
            <TextField
              size="small"
              fullWidth
              multiline={true}
              rows={2}
              defaultValue={watch(`narration`)}
              label="Narration"
              onChange={(e) => {
                setValue(`narration`,e.target.value ? e.target.value : null,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 12, lg: 12}} textAlign={'end'}>
          <LoadingButton
            loading={false}
            variant='contained'
            type='submit'
            size='small'
            sx={{marginBottom: 0.5}}
          >
            {
              fuelVoucher ? (
                <><CheckOutlined fontSize='small' /> Done</>
              ) : (
                <><AddOutlined fontSize='small' /> Add</>
              )
            }
          </LoadingButton>
          {
            fuelVoucher && 
             <Tooltip title='Close Edit'>
              <IconButton size='small' 
                onClick={() => {
                  setShowForm?.(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success'/>
              </IconButton>
            </Tooltip>
          }
        </Grid>
      </Grid>
    </form>
  );
}

export default FuelVouchers;
