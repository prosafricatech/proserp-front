import React, { useState, useEffect } from 'react';
import {
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
  FormControlLabel,
  Checkbox,
  ListItemText,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';

interface Product {
  id: number;
  name: string;
  category?: {
    income_ledger_id?: number;
  };
}

interface LedgerOption {
  id: number;
  name: string;
}

interface Item {
  id?: number;
  product?: Product;
  product_id?: number;
  description?: string;
  complement_ledger_id?: number;
  measurement_unit?: MeasurementUnit;
  quantity?: number;
  rate?: number;
  isFromItemForm?: boolean;
}

interface FormValues {
  isSelected?: boolean;
  product_id?: number | null;
  description?: string;
  complement_ledger_id?: number | null;
  measurement_unit_id?: number | null;
  quantity?: number;
  rate?: number;
}

interface SaleAdjustmentItemRowProps {
  isEdit?: boolean;
  item: Item;
  index: number;
  items: Item[];
  formValues: FormValues;
  setFormValue: (field: keyof FormValues, value: any) => void;
  errors?: Record<string, any>;
}

const SaleAdjustmentItemRow: React.FC<SaleAdjustmentItemRowProps> = ({
  isEdit,
  item,
  index,
  items = [],
  formValues,
  setFormValue,
  errors = {},
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect() as {
    ungroupedLedgerOptions: LedgerOption[];
  };

  const productOptions = items
    .map((it) => it.product)
    .filter(Boolean)
    .filter((product, idx, self) => self.findIndex((p: any) => p.id === product?.id) === idx);

    useEffect(() => {
      if (formValues.isSelected === undefined) {
          setIsChecked(true);
          setFormValue('isSelected', true);
      } else {
          setIsChecked(!!formValues.isSelected);
      }
    }, [formValues.isSelected]);

    useEffect(() => {
      if (item.isFromItemForm) {
        setFormValue('product_id', item.product?.id || item.product_id);
        setFormValue('description', item.description || '');
        setFormValue(
          'complement_ledger_id',
          item.complement_ledger_id || item?.product?.category?.income_ledger_id || null
        );
        setFormValue('measurement_unit_id', item.measurement_unit?.id || null);
        setFormValue('quantity', item.quantity);
        setFormValue('rate', item.rate);
      }
    }, [item.isFromItemForm]);

  const handleCheckboxChange = (event: any) => {
    const checked = event.target.checked;
    setIsChecked(checked);
    setFormValue('isSelected', checked);

    if (checked) {
      // clear for editing
      setFormValue('quantity', '');
      setFormValue('rate', item.rate);
      setFormValue('product_id', item.product?.id || item.product_id);
      setFormValue('description', item.description || '');
      setFormValue(
        'complement_ledger_id',
        item.complement_ledger_id || item?.product?.category?.income_ledger_id || null
      );
      setFormValue('measurement_unit_id', item.measurement_unit?.id || null);
    } else {
      // restore defaults
      setFormValue('quantity', item.quantity || 0);
      setFormValue('rate', item.rate || 0);
      setFormValue('product_id', item.product?.id || item.product_id);
      setFormValue('description', item.description || '');
      setFormValue(
        'complement_ledger_id',
        item.complement_ledger_id || item?.product?.category?.income_ledger_id || null
      );
      setFormValue('measurement_unit_id', item.measurement_unit?.id || null);
    }
  };

  const handleQuantityChange = (value: string) => {
    const parsedValue = parseFloat(value.replace(/,/g, '')) || 0;
    setFormValue('quantity', parsedValue);
  };

  const handleRateChange = (value: string) => {
    const parsedValue = parseFloat(value.replace(/,/g, '')) || 0;
    setFormValue('rate', parsedValue);
  };

  const handleProductChange = (_: any, newValue: Product | null) => {
    setFormValue('product_id', newValue ? newValue.id : null);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValue('description', event.target.value);
  };

  const handleComplementLedgerChange = (newValue: LedgerOption | null) => {
    setFormValue('complement_ledger_id', newValue ? newValue.id : 0);
  };

  const handleMeasurementUnitChange = (newValue: MeasurementUnit | null) => {
    setFormValue('measurement_unit_id', newValue ? newValue.id : null);
  };

  const getProductValue = () =>
    productOptions.find((product) => product?.id === formValues.product_id) || null;

  return (
    <React.Fragment>
      <Divider />
      <Grid container spacing={1} mb={0.5} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
        <Grid size={{xs: 1.5, md: 0.5}} >
          <FormControlLabel
            control={
              <Checkbox
                checked={isChecked}
                onChange={handleCheckboxChange}
                size="small"
                color="primary"
              />
            }
            label={index + 1 + '.'}
          />
        </Grid>

        {isChecked ? (
          <>
            <Grid size={{xs: 10.5, md: 5.5}}>
              <Div sx={{ mt: 0.3 }}>
                <Autocomplete
                  id={`product-select-${index}`}
                  options={productOptions}
                  getOptionLabel={(option) => option?.name || ''}
                  value={getProductValue()}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
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
                  onChange={handleProductChange as any}
                />
              </Div>
            </Grid>

            <Grid size={{xs: 12, md: 6}}>
              <Div sx={{ mt: 0.3 }}>
                <TextField
                  size="small"
                  label="Description"
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  value={formValues.description || ''}
                  onChange={handleDescriptionChange}
                />
              </Div>
            </Grid>

            <Grid size={{xs: 12, md: 6}}>
              <Div sx={{ mt: 0.3 }}>
                <LedgerSelect
                  defaultValue={ungroupedLedgerOptions.find((ledger) => ledger.id === formValues.complement_ledger_id) as any}
                  onChange={handleComplementLedgerChange as any}
                  label="Complement Ledger"
                  frontError={errors.complement_ledger_id}
                />
              </Div>
            </Grid>

            <Grid size={{xs: 12, md: 2}}>
              <Div sx={{ mt: 0.3 }}>
                <MeasurementSelector
                  label="Unit"
                  defaultValue={formValues.measurement_unit_id}
                  onChange={handleMeasurementUnitChange as any}
                  frontError={errors.measurement_unit_id}
                />
              </Div>
            </Grid>

            <Grid size={{xs: 12, md: 2}}>
              <Div sx={{ mt: 0.3 }}>
                <TextField
                  size="small"
                  label="Quantity"
                  fullWidth
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  value={(isEdit || item.isFromItemForm) && formValues.quantity}
                  InputProps={{ inputComponent: CommaSeparatedField }}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
              </Div>
            </Grid>

            <Grid size={{xs: 12, md: 2}}>
              <Div sx={{ mt: 0.3 }}>
                <TextField
                  size="small"
                  label="Rate"
                  fullWidth
                  error={!!errors.rate}
                  helperText={errors.rate?.message}
                  value={formValues.rate}
                  InputProps={{ inputComponent: CommaSeparatedField }}
                  onChange={(e) => handleRateChange(e.target.value)}
                />
              </Div>
            </Grid>

            {errors.message && (
              <Grid size={12} textAlign={'center'}>
                <Typography variant="h5" color="error">
                  {errors.message}
                </Typography>
              </Grid>
            )}
          </>
        ) : (
          <>
            <Grid size={{xs: 6, md: 7}}>
              <ListItemText
                primary={
                  <Tooltip title={'Product'}>
                    <Typography variant={'h5'} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                      {item.product?.name}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <Tooltip title={'Description'}>
                    <Typography component="span" variant="body2" fontSize={14} lineHeight={1.25} mb={0}>
                      {item.description}
                    </Typography>
                  </Tooltip>
                }
              />
            </Grid>

            <Grid size={{xs: 6, md: 4.5}}>
              <Tooltip title="Complement Ledger">
                <Typography>
                  {ungroupedLedgerOptions?.find((ledger) => ledger.id === (item?.product?.category?.income_ledger_id || item?.complement_ledger_id))?.name}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{xs: 6, md: 4}}>
              <Tooltip title="Quantity">
                <Typography textAlign={'right'}>
                  {(item.quantity || 0).toLocaleString()} {item.measurement_unit?.symbol || ''}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{xs: 6, md: 4}}>
              <Tooltip title="Rate">
                <Typography textAlign={'right'}>{(item.rate || 0).toLocaleString()}</Typography>
              </Tooltip>
            </Grid>

            <Grid size={{xs: 6, md: 4}}>
              <Tooltip title="Amount">
                <Typography textAlign={'right'}>{(Number(item?.quantity) * Number(item?.rate) || 0).toLocaleString()}</Typography>
              </Tooltip>
            </Grid>
          </>
        )}
      </Grid>
    </React.Fragment>
  );
};

export default SaleAdjustmentItemRow;
