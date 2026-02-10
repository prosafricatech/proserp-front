import { yupResolver } from '@hookform/resolvers/yup';
import { Divider, Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react'
import * as yup from 'yup';
import { useForm, useFormContext } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Div } from '@jumbo/shared';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

function AdditionalCostsTab({index = -1, setShowForm = null, additionalCost, setIsDirty}) {
  const {ungroupedLedgerOptions} = useLedgerSelect();
  const {additionalCosts=[], setAdditionalCosts} = useFormContext();
  const [isAdding, setIsAdding] = useState(false);
  const {currencies} = useCurrencySelect();

  // Define validation schema
  const validationSchema = yup.object({
    credit_ledger_id: yup.number().required("Cost name is required").typeError('Cost name is required'),
    currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
    exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
    amount: yup.number().required("Amount is required").positive("Amount is required").typeError('Amount is required'),
  });

  const {setValue, handleSubmit, watch, reset, formState: {errors, dirtyFields}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      credit_ledger_name: additionalCost && additionalCost.credit_ledger_name,
      credit_ledger_id : additionalCost && additionalCost.credit_ledger_id,
      currency_id: additionalCost ? additionalCost.currency_id : 1,
      currency_name: additionalCost ? additionalCost.currency_name : currencies.find(currency => currency.id === 1).name_plural,
      exchange_rate: additionalCost ? additionalCost.exchange_rate : 1,
      reference: additionalCost && additionalCost.reference,
      amount: additionalCost && additionalCost.amount,
    }
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0); // Update dirty state
  }, [dirtyFields, setIsDirty]);

  const updateItems = async (item) => {
    setIsAdding(true);
    if (index > -1) {
      // Replace the existing item with the edited item
      let updatedAdditionalCosts = [...additionalCosts];
      updatedAdditionalCosts[index] = item;
      await setAdditionalCosts(updatedAdditionalCosts);
    } else {
      // Add the new item to the additionalCosts array
      await setAdditionalCosts((additionalCosts) => [...additionalCosts, item]);
    }

    reset();
    setIsAdding(false);
    setShowForm && setShowForm(false);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
  <form autoComplete='off' onSubmit={handleSubmit(updateItems)} >
    <Grid size={12}>
      <Divider/>
    </Grid>
    <Grid container columnSpacing={1}>
      <Grid size={{xs: 12, md: 3, lg: 4}}>
        <Div sx={{ mt: 1 }}>
          <LedgerSelect
            multiple={false}
            allowedGroups={['Expenses']}
            label="Cost name"
            defaultValue={ungroupedLedgerOptions.find(ledger => ledger.id === additionalCost?.credit_ledger_id)}
            frontError={errors?.credit_ledger_id}
            onChange={(newValue) => {
              if (!!newValue) {
                setValue(`credit_ledger_name`,newValue.name)
                setValue(`credit_ledger_id`, newValue ? newValue.id : null,{
                  shouldValidate: true,
                  shouldDirty: true
              });}
            }}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 2, lg: 2}}>
        <Div sx={{mt: 1}}>
          <TextField
            label="Reference"
            fullWidth
            size="small"
            defaultValue={additionalCost && additionalCost.reference}
            onChange={(e) => {
              setValue(`reference`,e.target.value,{
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: watch(`currency_id`) > 1 ? 3.5 : 5, lg: watch(`currency_id`) > 1 ? 2 : 4}}>
        <Div sx={{mt: 1}}>
          <CurrencySelector
            frontError={errors?.currency_id}
            defaultValue={additionalCost && additionalCost.currency_id}
            onChange={(newValue) => {
              setValue(`currency_id`, newValue ? newValue.id : 1,{
                shouldDirty: true,
                shouldValidate: true
              });
              setValue(`currency_name`, newValue.name);
              setValue(`exchange_rate`, newValue ? newValue.exchangeRate : 1);
            }}
          />
        </Div>
      </Grid>
      {
        watch(`currency_id`) > 1 &&
        <Grid size={{xs: 6, md: 2, lg: 2}}>
          <Div sx={{mt: 1}}>
            <TextField
              label="Exchange Rate"
              fullWidth
              size='small'
              error={errors && !!errors.exchange_rate}
              helperText={errors && errors.exchange_rate?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              defaultValue={watch(`exchange_rate`)}
              onChange={(e) => {
                setValue(`exchange_rate`,e.target.value ? sanitizedNumber(e.target.value ): null,{
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
      }
      <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 1.5 : 2, lg: watch(`currency_id`) > 1 ? 2 : 2}}>
        <Div sx={{mt: 1}}>
          <TextField
            label="Amount"
            fullWidth
            size="small"
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            defaultValue={additionalCost && additionalCost.amount}
            error={errors && !!errors?.amount}
            helperText={errors && errors?.amount?.message}
            onChange={(e) => {
              setValue(`amount`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Div>
      </Grid>
    </Grid>
    <Grid size={{xs: 12, md: 12, lg: 12}} mt={1} textAlign={'end'}>
      <LoadingButton
        loading={false}
        variant='contained'
        size='small'
        type='submit'
        sx={{marginBottom: 0.5}}
      >
        {
          additionalCost ? (
            <><CheckOutlined fontSize='small' /> Done</>
          ) : (
            <><AddOutlined fontSize='small' /> Add</>
          )
        }
      </LoadingButton>
      {
        additionalCost && 
        <Tooltip title='Close Edit'>
          <IconButton size='small' 
            onClick={() => {
              setShowForm(false);
            }}
          >
            <DisabledByDefault fontSize='small' color='success'/>
          </IconButton>
        </Tooltip>
      }
    </Grid>
  </form>
  )
}

export default AdditionalCostsTab