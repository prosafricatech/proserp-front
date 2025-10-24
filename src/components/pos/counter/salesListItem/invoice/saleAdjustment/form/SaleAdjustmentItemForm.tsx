import React, { useState } from 'react';
import { Grid, LinearProgress, TextField } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Autocomplete } from '@mui/material';

interface Product {
  id: number;
  name: string;
  unit_symbol?: string;
  category?: {
    income_ledger_id?: number;
  };
}

interface SaleAdjustmentItem {
  product_id: number | null;
  product: Product | null;
  description: string;
  complement_ledger_id: number | null;
  measurement_unit?: MeasurementUnit | null;
  measurement_unit_id: number | null;
  quantity: number;
  rate: number;
  vat_percentage?: number;
  isFromItemForm?: boolean;
}

interface FormData {
  product_id: number | null;
  product: Product | null;
  description: string;
  complement_ledger_id: number | null;
  measurement_unit_id: number | null;
  measurement_unit?: MeasurementUnit | null;
  quantity: number;
  rate: number;
  isFromItemForm: boolean;
}

interface SaleAdjustmentItemFormProps {
  checked?: boolean;
  index?: number;
  item?: Partial<SaleAdjustmentItem> | null;
  items: SaleAdjustmentItem[];
  setItems: React.Dispatch<React.SetStateAction<SaleAdjustmentItem[]>>;
}

function SaleAdjustmentItemForm({
  checked,
  index = -1,
  item = null,
  items,
  setItems,
}: SaleAdjustmentItemFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const validationSchema = yup.object({
    product_id: yup.number().nullable().notRequired(),
    description: yup.string().nullable().notRequired(),
    complement_ledger_id: yup
      .number()
      .required('Complement Ledger is required')
      .min(1, 'Select a valid Complement Ledger')
      .typeError('Complement Ledger is required'),
    measurement_unit_id: yup
      .number()
      .required('Measurement Unit is required')
      .typeError('Measurement Unit is required'),
    quantity: yup
      .number()
      .required('Quantity is required')
      .typeError('Quantity must be a number')
      .positive('Quantity must be positive'),
    rate: yup
      .number()
      .required('Rate is required')
      .typeError('Rate must be a number')
      .positive('Rate must be positive'),
  });

  const { 
    setValue, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors } 
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      product: item?.product || null,
      product_id: item?.product?.id || null,
      description: item?.description || '',
      complement_ledger_id: item?.complement_ledger_id ?? item?.product?.category?.income_ledger_id ?? null,
      measurement_unit_id: item?.measurement_unit?.id ?? null,
      quantity: item?.quantity ?? 0,
      rate: item?.rate ?? 0,
      isFromItemForm: true,
    },
  });

  const formValues = watch();

  const handleQuantityChange = (value: string) => {
    const parsedValue = parseFloat(value.replace(/,/g, '')) || 0;
    setValue('quantity', parsedValue, { shouldValidate: true, shouldDirty: true });
  };

  const handleRateChange = (value: string) => {
    const parsedValue = parseFloat(value.replace(/,/g, '')) || 0;
    setValue('rate', parsedValue, { shouldValidate: true, shouldDirty: true });
  };

  const updateItems = async (data: any) => {
    setIsAdding(true);
    const newItem = {
      product_id: data.product_id,
      product: data.product,
      description: data.description,
      complement_ledger_id: data.complement_ledger_id,
      measurement_unit: data.measurement_unit,
      measurement_unit_id: data.product_id ? items[index]?.measurement_unit?.id : data.measurement_unit_id,
      quantity: parseFloat(data.quantity),
      rate: parseFloat(data.rate),
      vat_percentage: item?.vat_percentage || 0,
      isFromItemForm: true,
    };

    await setItems((prevItems) => [...prevItems, newItem]);

    reset();
    setIsAdding(false);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  const productOptions = items
    .map((item) => item.product)
    .filter(Boolean)
    .filter((product, index, self) => 
      self.findIndex((p: any) => p.id === product?.id) === index
  );

  return (
    <Grid container spacing={1} sx={{ mt: 0.5 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Div sx={{ mt: 0.3 }}>
          <Autocomplete<Product>
            id={`product-select-${index}`}
            options={productOptions as any}
            getOptionLabel={(option) => option?.name || ''}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                size="small"
                fullWidth
                error={!!errors.product_id}
                helperText={errors.product_id?.message}
              />
            )}
            onChange={(e, newValue) => {
              setValue('product_id', newValue ? newValue.id : null, {
                shouldValidate: true,
                shouldDirty: true,
              });
              setValue('product', newValue || null);
              if (!newValue) {
                setValue('measurement_unit_id', null, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }}
            defaultValue={
              items.map((item) => item.product).find((p) => p?.id === item?.product_id) || null
            }
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size="small"
            label="Description"
            fullWidth
            error={!!errors.description}
            helperText={errors.description?.message}
            value={formValues.description || ''}
            onChange={(e) => setValue('description', e.target.value, { shouldValidate: true, shouldDirty: true })}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Div sx={{ mt: 0.3 }}>
          <LedgerSelect
            frontError={errors.complement_ledger_id}
            defaultValue={ungroupedLedgerOptions.find((ledger) => ledger.id === formValues.complement_ledger_id)}
            onChange={(newValue: any) => setValue('complement_ledger_id', newValue ? newValue.id : 0, { shouldValidate: true, shouldDirty: true })}
            label="Complement Ledger"
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <Div sx={{ mt: 0.3 }}>
          <MeasurementSelector
            label="Unit"
            frontError={errors.measurement_unit_id as any}
            defaultValue={formValues.measurement_unit_id}
            onChange={(newValue: any) => {
              setValue('measurement_unit', newValue)
              setValue('measurement_unit_id', newValue ? newValue.id : null, { shouldValidate: true, shouldDirty: true })
            }}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size="small"
            label="Quantity"
            fullWidth
            error={!!errors.quantity}
            helperText={errors.quantity?.message}
            value={formValues.quantity}
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            onChange={(e) => handleQuantityChange(e.target.value)}
          />
        </Div>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size="small"
            label="Rate"
            fullWidth
            error={!!errors.rate}
            helperText={errors.rate?.message}
            value={formValues.rate}
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            onChange={(e) => handleRateChange(e.target.value)}
          />
        </Div>
      </Grid>

      {/* Add Button */}
      {!checked && (
        <Grid size={12} sx={{ textAlign: 'end', mt: 1 }}>
          <LoadingButton
            loading={isAdding}
            variant="contained"
            size="small"
            onClick={handleSubmit(updateItems)}
            sx={{ 
              marginBottom: 0.5,
              minWidth: 80,
              '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground',
              }
            }}
          >
            Add
          </LoadingButton>
        </Grid>
      )}
    </Grid>
  );
}

export default SaleAdjustmentItemForm;