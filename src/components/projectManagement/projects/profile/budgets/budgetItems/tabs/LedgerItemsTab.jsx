import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, TextField } from '@mui/material';
import { useEffect, useState } from 'react'
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';

function LedgerItemsTab({index = -1, setShowForm = null, ledgerItem, ledgerItems = [], setLedgerItems}) {
  const [triggerKey, setTriggerKey] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const validationSchema = yup.object({
    ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    currency_id: yup.number().positive('Currency is required').required('Currency is required').typeError('Currency is required'),
    exchange_rate: yup.number().positive('Exchange rate is required').required('Exchange rate is required').typeError('Exchange rate is required'),
    rate: yup.number().positive('Rate is required').required("Rate is required").positive("Rate is required").typeError('Rate is required'),
    quantity: yup.number().positive('Quantity is required').required("Quantity is required").positive("Quantity is required").typeError('Quantity is required'),
    measurement_unit_id: yup.number().required("Measurement Unit is required").typeError('Measurement Unit is required'),
  });

  const {setValue, handleSubmit, watch, reset, formState: {errors}} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      type: 'ledger',
      currency_id: 1,
      exchange_rate: 1,
    }
  });

  const updateItems = async (item) => {
    setIsAdding(true);
      if (index > -1) {
        // Replace the existing item with the edited item
        let updatedLedgerItems = [...ledgerItems];
        updatedLedgerItems[index] = item;
        await setLedgerItems(updatedLedgerItems);
      } else {
        // Add the new item to the ledgerItems array
        await setLedgerItems((ledgerItems) => [...ledgerItems, item]);
        setTriggerKey(prev => prev + 1);
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
      <Grid container spacing={1} key={triggerKey}>
        <Grid size={{xs: 12, md: 3.5}}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              multiple={false}
              label="Expense Name"
              allowedGroups={['Expenses']}
              frontError={errors?.ledger_id}
              onChange={(newValue) => {
                setValue(`ledger_id`, newValue ? newValue.id : null,{
                  shouldValidate: true,
                  shouldDirty: true
                })
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: watch(`currency_id`) > 1 ? 2.5 : 3}}>
          <Div sx={{mt: 1}}>
            <CurrencySelector
              frontError={errors?.currency_id}
              onChange={(newValue) => {
                setValue(`exchange_rate`, newValue ? newValue.exchangeRate : 1);
                setValue(`currency_id`, newValue ? newValue.id : 1,{
                  shouldDirty: true,
                  shouldValidate: true
                });
              }}
            />
          </Div>
        </Grid>
        {
          watch(`currency_id`) > 1 &&
          <Grid size={{xs: 6, md: 2, lg: 1.5}}>
            <Div sx={{mt: 1}}>
              <TextField
                label="Exchange Rate"
                fullWidth
                size='small'
                defaultValue={watch(`exchange_rate`)}
                error={errors && !!errors.exchange_rate}
                helperText={errors && errors.exchange_rate?.message}
                InputProps={{
                  inputComponent: CommaSeparatedField,
                }}
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
          <Grid size={{xs: 12, md: 1.5}}>
            <Div sx={{ mt: 1}}>
              <MeasurementSelector
                label='Unit'
                frontError={errors && errors?.measurement_unit_id}
                onChange={(newValue) => {
                  setValue(`measurement_unit_id`, newValue ? newValue.id : null,{
                    shouldDirty: true,
                    shouldValidate: true
                  })
                }}      
              />
            </Div>
          </Grid>
          <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 1.5 : 2}}>
            <Div sx={{mt: 1}}>
              <TextField
                label="Quantity"
                fullWidth
                size="small"
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
          <Grid size={{xs: watch(`currency_id`) > 1 ? 6 : 12, md: watch(`currency_id`) > 1 ? 1.5 : 2}}>
            <Div sx={{mt: 1}}>
              <TextField
                label="Rate"
                fullWidth
                size="small"
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
          <Grid size={{xs: 12, md: 12}}>
            <Div sx={{mt: 0.3}}>
              <TextField
                label="Description"
                fullWidth
                multiline={true}
                rows={2}
                size="small"
                onChange={(e) => {
                  setValue(`description`,e.target.value,{
                    shouldValidate: true,
                    shouldDirty: true
                  });
                }}
              />
            </Div>
          </Grid>
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
            ledgerItem ? (
              <><CheckOutlined fontSize='small' /> Done</>
            ) : (
              <><AddOutlined fontSize='small' /> Add</>
            )
          }
        </LoadingButton>
        {
          ledgerItem && 
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

export default LedgerItemsTab