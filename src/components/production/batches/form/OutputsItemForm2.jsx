import { useContext, useEffect } from 'react';
import { Grid, InputAdornment, TextField, Tooltip, Typography } from '@mui/material';
import { ProductionBatchesContext } from '../ProductionBatchesList';
import * as yup from 'yup';
import { useForm, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import StoreSelector from '@/components/procurement/stores/StoreSelector';

function OutputsItemForm2() {
  const { fetchedBOMs, setOutputs, outputs = [], submitType, setInventoryInputs, productionDates } = useFormContext();
  const { activeWorkCenter } = useContext(ProductionBatchesContext);

  const outputSchema = yup.object().shape({
    quantity: yup
      .number()
      .typeError('Produced Quantity is required')
      .required('Produced Quantity is required'),
    store_id: yup
      .number()
      .required('Store is required')
      .typeError('Store is required'),
  });

  const {
    setValue,
    watch,
    clearErrors,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: yupResolver(outputSchema),
    defaultValues: {
      quantity: outputs[0]?.quantity || null,
      store_id: outputs[0]?.store_id || null,
      remarks: outputs[0]?.remarks || '',
      submit_type: submitType,
    },
  });
  
  useEffect(() => {
    setValue('submit_type', submitType);
  }, [submitType, setValue]);

  const quantity = watch('quantity');
  const submit_type = watch('submit_type');

  useEffect(() => {
    if (submit_type === 'close' || quantity > 0) {
      trigger('quantity');
      trigger('store_id');
    } else if (quantity === null) {
      clearErrors('store_id');
      clearErrors(`quantity`)
      setOutputs([]);
    } else {
      clearErrors('store_id');
      clearErrors(`quantity`)
    }
  }, [quantity, submit_type, trigger, clearErrors, setOutputs]);

  const defaultOutput = {
    product_id: fetchedBOMs?.product.id,
    expectedQunatity: fetchedBOMs?.quantity,
    product: fetchedBOMs?.product,
    quantity: fetchedBOMs?.quantity,
    value_percentage: 100,
    remarks: '',
    measurement_unit_id: fetchedBOMs?.measurement_unit?.id,
    conversion_factor: fetchedBOMs?.conversion_factor,
  };

  const handleOutputChange = (fieldKey, value) => {
    setValue(fieldKey, value, { shouldValidate: true, shouldDirty: true });

    if (fieldKey === 'store_id') {
      setValue(`selected_store_id`, value)
    }
  
    setOutputs([
      {
        ...defaultOutput,
        store_id: fieldKey === 'store_id' ? value : watch(`selected_store_id`),
        ...(outputs[0] || {}),
        [fieldKey]: value,
      },
    ]);
  };

  useEffect(() => {
    if (!fetchedBOMs?.items?.length) return;

    const defaultInputs = fetchedBOMs?.items.map((item) => ({
      product_id: item.product_id || item.product.id,
      consumption_date: productionDates.end_date ? productionDates.end_date : dayjs().toISOString(),
      product: item.product,
      measurement_unit_id: item.measurement_unit_id || item.measurement_unit.id,
      conversion_factor: item.conversion_factor,
      quantity: ((outputs[0]?.quantity * item.quantity) / outputs[0]?.expectedQunatity) || item.quantity,
      store_id: null,
      available_balance: null,
      unit_cost: null,
      remarks: '',
    }));

    setInventoryInputs(defaultInputs);
  }, [fetchedBOMs]);

  return (
    <Grid container columnSpacing={1} rowSpacing={1} mt={1}>
      <Grid size={{xs: 9, md: 8}}>
        <Div sx={{ mt: 1.7, mb: 1.7 }}>
          <Tooltip title="Product">
            <Typography textAlign={{ md: 'center' }}>{fetchedBOMs?.product.name}</Typography>
          </Tooltip>
        </Div>
      </Grid>
      <Grid size={{xs: 3, md: 4}}>
        <Div sx={{ mt: 1.7, mb: 1.7 }}>
          <Tooltip title="Expected Produced Quantity">
            <Typography>{`${fetchedBOMs?.measurement_unit.symbol} ${fetchedBOMs?.quantity}`}</Typography>
          </Tooltip>
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 3}}>
        <StoreSelector
          allowSubStores={true}
          proposedOptions={activeWorkCenter?.stores}
          frontError={errors?.store_id}
          onChange={(newValue) => {
            handleOutputChange('store_id', newValue?.id);
          }}
        />
      </Grid>
      <Grid size={{xs: 12, md: 3}}>
        <TextField
          label="Produced Quantity"
          fullWidth
          size="small"
          value={outputs[0]?.quantity || ''}
          InputProps={{
            inputComponent: CommaSeparatedField,
            endAdornment: (
              <InputAdornment position="end">
                {fetchedBOMs?.measurement_unit.symbol}
              </InputAdornment>
            ),
          }}
          error={!!errors?.quantity}
          helperText={errors?.quantity?.message}
          onChange={(e) => {
            const val = sanitizedNumber(e.target.value);
            handleOutputChange('quantity', val ? val : null);
          }}
        />
      </Grid>
      <Grid size={{xs: 12, md: 6}}>
        <TextField
          label="Remarks"
          fullWidth
          size="small"
          onChange={(e) => {
            handleOutputChange('remarks', e.target.value);
          }}
        />
      </Grid>
    </Grid>
  );
}

export default OutputsItemForm2;