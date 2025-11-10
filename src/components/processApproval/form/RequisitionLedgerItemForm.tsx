import { yupResolver } from '@hookform/resolvers/yup';
import { Autocomplete, Button, Divider, Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import MeasurementSelector from '../../masters/measurementUnits/MeasurementSelector';
import requisitionsServices from '../requisitionsServices';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { readableDate, sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { RelatableTransaction, RequisitionLedgerItem } from '../RequisitionType';

interface RequisitionLedgerItemFormProps {
  setClearFormKey: Dispatch<SetStateAction<number>>;
  submitMainForm?: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: Dispatch<SetStateAction<boolean>>;
  setIsDirty: Dispatch<SetStateAction<boolean>>;
  requisition_ledger_items: RequisitionLedgerItem[];
  setRequisition_ledger_items: Dispatch<SetStateAction<RequisitionLedgerItem[]>>;
  ledger_item?: RequisitionLedgerItem | null;
  index?: number;
  setShowForm?: Dispatch<SetStateAction<boolean>>;
}

function RequisitionLedgerItemForm({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  requisition_ledger_items,
  setRequisition_ledger_items,
  ledger_item = null,
  index = -1,
  setShowForm,
}: RequisitionLedgerItemFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [relatedTransactions, setRelatedTransactions] = useState<RelatableTransaction[]>([]);
  const [selectedRelated, setSelectedRelated] = useState<RelatableTransaction | null>(null);

  const relatableTypes = [{
    value: 'purchase',
    label: 'Purchase',
  }];

  const validationSchema = yup.object({
    ledger_id: yup.number().required("Expense name is required").typeError('Expense name is required'),
    quantity: yup.number()
      .required("Quantity is required")
      .positive("Quantity must be positive")
      .typeError('Quantity is required'),
    rate: yup.number()
      .required("Rate is required")
      .positive("Rate must be positive")
      .typeError('Rate is required'),
    amount: yup
      .number()
      .nullable()
      .when('relatable', (relatable:any, schema) => 
        relatable?.id
          ? schema
              .required("Amount is required")
              .test('max-amount', `Amount should not exceed unapproved amount (${relatable?.unapproved_amount?.toLocaleString()}) of selected relatable`, function (value) {
                return value <= (relatable?.unapproved_amount);
              })
          : schema.nullable()
      ).typeError('Amount is Required'),
    measurement_unit_id: yup.number().required("Measurement Unit is required").typeError('Measurement Unit is required'),
  });

  const { setValue, handleSubmit, watch, register, reset, formState: { errors, dirtyFields } } = useForm<RequisitionLedgerItem>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      ledger_id: ledger_item?.ledger_id,
      ledger: ledger_item?.ledger,
      quantity: ledger_item?.quantity,
      rate: ledger_item?.rate,
      relatable_type: ledger_item ? ledger_item?.relatable_type : null,
      relatable: ledger_item ? ledger_item?.relatable : null,
      relatable_id: ledger_item?.relatable_id,
      measurement_unit_id: ledger_item?.measurement_unit_id ?? ledger_item?.measurement_unit?.id,
      unit_symbol: ledger_item?.measurement_unit?.symbol ?? ledger_item?.unit_symbol,
      remarks: ledger_item?.remarks
    }
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  const calculateAmount = () => {
    const quantity = parseFloat(Number(watch('quantity'))?.toString() ?? ledger_item?.quantity ?? 0);
    const rate = parseFloat(Number(watch('rate'))?.toString() ?? ledger_item?.rate ?? 0);

    if (quantity && rate) {
      setValue(`amount`, quantity*rate,{
        shouldValidate: true,
        shouldDirty: true,
      })
      return quantity * rate;
    }
  };

  useEffect(() => {
    const amount = calculateAmount();
    setCalculatedAmount(Number(amount));
  }, [watch('quantity'), watch('rate')]);

  const updateItems = async (data: RequisitionLedgerItem) => {
    setIsAdding(true);
    const newItem = {
      ...data,
      amount: calculateAmount(),
    };

    if (index > -1) {
      const updatedItems = [...requisition_ledger_items];
      updatedItems[index] = newItem;
      await setRequisition_ledger_items(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      await setRequisition_ledger_items(prevItems => [...prevItems, newItem]);
      if (submitItemForm && submitMainForm) {
        submitMainForm();
      }
      setSubmitItemForm(false);
      setClearFormKey(prevKey => prevKey + 1);
    }

    reset();
    setIsAdding(false);
    setShowForm?.(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false);
      })();
    }
  }, [submitItemForm]);

  const getRelatedTransactions = async () => {
    const ledgerId = watch('ledger_id');
    const relatable_type = watch('relatable_type');
    setIsRetrieving(true);

    if (ledgerId && relatable_type) {
      try {
        const fetchedRelatedTransactions = await requisitionsServices.getRelatedTransactions({
          ledger_id: ledgerId,
          type: relatable_type,
          payment_status: 'partially_and_not_approved'
        });
        setRelatedTransactions(fetchedRelatedTransactions);

        if (ledger_item?.relatable_id) {
          setSelectedRelated(fetchedRelatedTransactions.find((link: any) => link.id === ledger_item.relatable_id));
        }
      } finally {
        setIsRetrieving(false);
      }
    } else {
      setIsRetrieving(false);
    }
  };

  useEffect(() => {
    getRelatedTransactions();
  }, [watch('ledger_id'), watch('relatable_type')]);

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container spacing={1}>
        <Grid size={12}>
          <Divider />
        </Grid>
        <Grid size={{xs: 12, md: 3}}>
          <Div sx={{ mt: 0.3 }}>
            <LedgerSelect
              multiple={false}
              label="Ledger Name"
              allowedGroups={['Accounts Receivable', 'Accounts Payable', 'Expenses', 'Liabilities']}
              defaultValue={ledger_item?.ledger}
              frontError={errors.ledger_id ? { message: errors.ledger_id.message || '' } : undefined}
              onChange={(newValue: any) => {
                setValue('ledger', newValue);
                setValue('ledger_id', newValue?.id ?? null, {
                  shouldValidate: true,
                  shouldDirty: true
                });
                setValue('relatable_id', null);
                setValue('relatable', null);
                setSelectedRelated(null);
                setRelatedTransactions([]);
                getRelatedTransactions();
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 2}}>
          <Div sx={{ mt: 0.3 }}>
            <MeasurementSelector
              label='Unit'
              frontError={errors.measurement_unit_id ? { message: errors.measurement_unit_id.message || '' } : undefined}
              defaultValue={ledger_item?.measurement_unit_id ?? ledger_item?.measurement_unit?.id}
              onChange={(newValue: any) => {
                setValue('unit_symbol', newValue?.symbol);
                setValue('measurement_unit_id', newValue?.id ?? null, {
                  shouldDirty: true,
                  shouldValidate: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 2}}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              label="Quantity"
              fullWidth
              size="small"
              defaultValue={ledger_item?.quantity}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              error={!!errors?.quantity}
              helperText={errors?.quantity?.message}
              onChange={(e) => {
                setValue('quantity', e.target.value ? sanitizedNumber(e.target.value) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 2}}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              label="Rate"
              fullWidth
              size="small"
              defaultValue={ledger_item?.rate}
              error={!!errors?.rate}
              helperText={errors?.rate?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e) => {
                setValue('rate', e.target.value ? sanitizedNumber(e.target.value) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3}}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              label="Amount"
              fullWidth
              size='small'
              value={calculatedAmount}
              error={!!errors?.amount}
              helperText={errors?.amount?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
                readOnly: true
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Div>
        </Grid>
        <Grid size={{xs: 12, md: 3}}>
          <Div sx={{ mt: 0.3 }}>
            <Autocomplete
              id="checkboxes-linked_to_types"
              options={relatableTypes}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              getOptionLabel={(option) => option.label}
              defaultValue={ledger_item ? relatableTypes.find(link => link.value === watch('relatable_type')) : null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Linked To"
                  size="small"
                  fullWidth
                />
              )}
              onChange={(e, newValue) => {
                if (newValue) {
                  setSelectedRelated(null);
                  setValue('relatable_type', newValue.value);
                  setValue('relatable_id', null);
                  getRelatedTransactions();
                } else {
                  setValue('relatable_type', undefined);
                  setValue('relatable', null);
                  setSelectedRelated(null);
                  setRelatedTransactions([]);
                }
              }}
            />
          </Div>
        </Grid>
        {isRetrieving ? (
          <Grid size={{xs: 12, md: 2}}>
            <LinearProgress />
          </Grid>
        ) : (
          <Grid size={{xs: 12, md: 2}}>
            <Div sx={{ mt: 0.3 }}>
              <Autocomplete
                id="checkboxes-related_transitions"
                key={watch('relatable_type')}
                options={relatedTransactions}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => 
                  `${option.relatableNo} (${readableDate(option.order_date, false)} - ${option.total_amount?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: option.currency?.code,
                  })})`
                }
                value={selectedRelated}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Relatable To"
                    size="small"
                    fullWidth
                  />
                )}
                onChange={(e, newValue) => {
                  setSelectedRelated(newValue);
                  setValue('relatable', newValue ?? null);
                  setValue('relatable_id', newValue?.id ?? null);
                  setValue('amount', watch('amount'), {
                    shouldValidate: true,
                    shouldDirty: true
                  });
                }}
              />
            </Div>
          </Grid>
        )}
        <Grid size={{xs: 12, md: 7}}>
          <Div sx={{ mt: 0.3 }}>
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
            onClick={() => setIsDirty(false)}
          >
            {ledger_item ? (
              <>
                <CheckOutlined fontSize='small' /> Done
              </>
            ) : (
              <>
                <AddOutlined fontSize='small' /> Add
              </>
            )}
          </Button>
          {ledger_item && (
            <Tooltip title='Close Edit'>
              <IconButton
                size='small'
                onClick={() => {
                  setShowForm?.(false);
                  setIsDirty(false);
                }}
              >
                <DisabledByDefault fontSize='small' color='success' />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </form>
  );
}

export default RequisitionLedgerItemForm;