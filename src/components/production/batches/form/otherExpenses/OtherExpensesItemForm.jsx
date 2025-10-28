import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Divider, Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react'
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

function OtherExpensesItemForm({setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, setIsDirty, otherExpenses, setOtherExpenses, item = null,index = -1, setShowForm = null}) {
  const [isAdding, setIsAdding] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies.find(c => c.is_base === 1);

  const validationSchema = yup.object({
    currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
    exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
    ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    quantity: yup.number().positive('Quantity is required').required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
    rate: yup.number().positive('Rate is required').required("Rate is required").positive("Rate is required").typeError('Rate is required'),
  });

  const {setValue, handleSubmit, watch, clearErrors, register, reset, formState: {errors, dirtyFields}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      ledger_id: item && item.ledger_id,
      ledger: item && item.ledger,
      quantity: item && item.quantity,
      rate: item && item.rate,
      remarks: item && item.remarks,
      currency_id: item?.currency_id ? item.currency_id : 1,
      currency: item ? item?.currency : baseCurrency,
      exchange_rate: item?.exchange_rate ? item.exchange_rate : 1,
    }
  });

  useEffect(() => {
      const subscription = watch(() => {
          const hasDirtyFields = Object.keys(dirtyFields).length > 0;
          setIsDirty(hasDirtyFields);
      });
      return () => subscription.unsubscribe();
  }, [watch, dirtyFields, setIsDirty]);

  const calculateAmount = () => {
    const quantity = parseFloat(watch(`quantity`)) || item?.quantity || 0;
    const rate = parseFloat(watch(`rate`)) || (item?.rate || 0);
    return quantity * rate;
  };

  useEffect(() => {
    const amount = calculateAmount();
    setCalculatedAmount(amount);
  }, [watch('quantity'), watch('rate')]);

  const updateItems = async (item) => {
    setIsAdding(true);
    if (index > -1) {
      // Replace the existing item with the edited item
      let updatedItems = [...otherExpenses];
      updatedItems[index] = item;
      await setOtherExpenses(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      // Add the new item to the items array
      await setOtherExpenses((otherExpenses) => [...otherExpenses, item]);
      if (!!submitItemForm) {
        submitMainForm()
        setClearFormKey(prevKey => prevKey + 1);
      }
      setSubmitItemForm(false)
    }

    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false); // Reset submitItemForm if there are errors
      })();
    }
  }, [submitItemForm]);

  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container spacing={1}>
        <Grid size={12}>
          <Divider/>
        </Grid>
        <Grid size={{xs: 12, md: watch('currency_id') > 1 ? 3 : 6}}>
          <Div sx={{ mt: 0.3 }}>
            <LedgerSelect
              multiple={false}
              label="Expense"
              allowedGroups={['Expenses']}
              defaultValue={item && item.ledger}
              frontError={errors?.ledger_id}
              onChange={(newValue) => {
                setValue(`ledger`, newValue);
                setValue(`ledger_id`, newValue ? newValue.id : null,{
                  shouldValidate: true,
                  shouldDirty: true
                })
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3}}>
          <Div sx={{ mt: 0.3}}>
            <CurrencySelector
              frontError={errors?.currency_id}
              defaultValue={item ? item.currency_id : 1}
              onChange={(newValue) => {
                setValue('currency_id', newValue ? newValue.id : null, {
                  shouldDirty: true,
                  shouldValidate: true
                });

                setValue(`currency`, newValue);

                clearErrors('exchange_rate');

                setValue('exchange_rate', newValue?.exchangeRate ? newValue.exchangeRate : 1);
              }}
            />
          </Div>
        </Grid>
        {
          watch('currency_id') > 1 &&
          <Grid size={{xs: 12, md: 3}}>
            <Div sx={{ mt: 0.3}}>
              <TextField
                label="Exchange Rate"
                fullWidth
                size='small'
                error={!!errors?.exchange_rate}
                helperText={errors?.exchange_rate?.message}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                }}
                value={watch('exchange_rate')}
                onChange={(e) => {
                  setValue(`exchange_rate`, e.target.value ? sanitizedNumber(e.target.value) : null, {
                    shouldValidate: true,
                    shouldDirty: true
                  });
                }}
              />
            </Div>
          </Grid>
        }
        <Grid size={{xs: 12, md: 3}}>
          <Div sx={{mt: 0.3}}>
            <TextField
              label="Quantity"
              fullWidth
              size="small"
              defaultValue={item && item.quantity}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              error={errors && !!errors?.quantity}
              helperText={errors && errors?.quantity?.message}
              onChange={(e) => {
                setValue(`quantity`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3}}>
          <Div sx={{mt: 0.3}}>
            <TextField
              label="Rate"
              fullWidth
              size="small"
              defaultValue={item && item.rate}
              error={errors && !!errors?.rate}
              helperText={errors && errors?.rate?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e) => {
                setValue(`rate`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3}}>
          <Div sx={{mt: 0.3}}>
            <TextField
              label="Amount"
              fullWidth
              size='small'
              value={calculatedAmount}
              InputProps={{
                inputComponent: CommaSeparatedField,
                readOnly: true
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 6}}>
          <Div sx={{mt: 0.3}}>
            <TextField
              label="Remarks"
              fullWidth
              size="small"
              {...register('remarks')}
            />
          </Div>
        </Grid>
        <Grid size={12} textAlign={'end'} paddingBottom={0.5}>
          <Button
            variant='contained'
            size='small'
            type='submit'
            onClick={()=> setIsDirty(false)}
          >
            {
              item ? (
                <><CheckOutlined fontSize='small' /> Done</>
              ) : (
                <><AddOutlined fontSize='small' /> Add</>
              )
            }
          </Button>
          {
            item && 
            <Tooltip title='Close Edit'>
              <IconButton size='small' 
                onClick={() => {
                  setShowForm(false);
                  setIsDirty(false)
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

export default OtherExpensesItemForm