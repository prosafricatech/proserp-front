import {
  readableDate,
  sanitizedNumber,
} from '@/app/helpers/input-sanitization-helpers';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import {
  RelatableTransaction,
  RequisitionLedgerItem,
} from '../../RequisitionType';
import requisitionsServices from '../../requisitionsServices';

interface RequisitionLedgerItemFormProps {
  requisition_ledger_items: RequisitionLedgerItem[];
  setRequisition_ledger_items: Dispatch<
    SetStateAction<RequisitionLedgerItem[]>
  >;
  ledger_item?: RequisitionLedgerItem | null;
  index?: number;
  setShowForm?: Dispatch<SetStateAction<boolean>>;
}

function RequisitionLedgerItemForm({
  requisition_ledger_items,
  setRequisition_ledger_items,
  ledger_item = null,
  index = -1,
  setShowForm,
}: RequisitionLedgerItemFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [formResetKey, setFormResetKey] = useState(0);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [relatedTransactions, setRelatedTransactions] = useState<
    RelatableTransaction[]
  >([]);
  const [selectedRelated, setSelectedRelated] =
    useState<RelatableTransaction | null>(null);

  const relatableTypes = [
    {
      value: 'purchase',
      label: 'Purchase',
    },
  ];

  const getEmptyFormValues = () => ({
    ledger_id: null as any,
    ledger: null as any,
    quantity: undefined as any,
    rate: undefined as any,
    amount: undefined as any,
    relatable_type: null as any,
    relatable: null as any,
    relatable_id: null as any,
    measurement_unit_id: null as any,
    unit_symbol: undefined as any,
    remarks: '',
  });

  const validationSchema = yup.object({
    ledger_id: yup
      .number()
      .required('Expense name is required')
      .typeError('Expense name is required'),
    quantity: yup
      .number()
      .required('Quantity is required')
      .positive('Quantity must be positive')
      .typeError('Quantity is required'),
    rate: yup
      .number()
      .required('Rate is required')
      .positive('Rate must be positive')
      .typeError('Rate is required'),
    amount: yup
      .number()
      .nullable()
      .when('relatable', (relatable: any, schema) =>
        (Array.isArray(relatable) ? relatable[0] : relatable)?.id
          ? schema
              .required('Amount is required')
              .test(
                'max-amount',
                'Amount should not exceed unapproved amount of selected relatable',
                function (value) {
                  const currentRelatable = this.parent?.relatable;
                  const maxAmount = Number(
                    currentRelatable?.unapproved_amount ?? 0
                  );

                  if (!currentRelatable?.id || value == null) {
                    return true;
                  }

                  if (Number(value) <= maxAmount) {
                    return true;
                  }

                  return this.createError({
                    message: `Amount should not exceed unapproved amount (${maxAmount.toLocaleString()}) of selected relatable`,
                  });
                }
              )
          : schema.nullable()
      )
      .typeError('Amount is Required'),
    measurement_unit_id: yup
      .number()
      .required('Measurement Unit is required')
      .typeError('Measurement Unit is required'),
  });

  const {
    setValue,
    setError,
    clearErrors,
    handleSubmit,
    watch,
    register,
    reset,
    formState: { errors },
  } = useForm<RequisitionLedgerItem>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: ledger_item
      ? {
          ledger_id: ledger_item?.ledger_id,
          ledger: ledger_item?.ledger,
          quantity: ledger_item?.quantity,
          rate: ledger_item?.rate,
          relatable_type: ledger_item?.relatable_type,
          relatable: ledger_item?.relatable,
          relatable_id: ledger_item?.relatable_id,
          measurement_unit_id:
            ledger_item?.measurement_unit_id ?? ledger_item?.measurement_unit?.id,
          unit_symbol:
            ledger_item?.measurement_unit?.symbol ?? ledger_item?.unit_symbol,
          remarks: ledger_item?.remarks,
        }
      : getEmptyFormValues(),
  });

  const calculateAmount = () => {
    const quantity = parseFloat(
      Number(watch('quantity'))?.toString() ?? ledger_item?.quantity ?? 0
    );
    const rate = parseFloat(
      Number(watch('rate'))?.toString() ?? ledger_item?.rate ?? 0
    );

    if (quantity && rate) {
      setValue(`amount`, quantity * rate, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return quantity * rate;
    }
  };

  useEffect(() => {
    const amount = calculateAmount();
    setCalculatedAmount(Number(amount));
  }, [watch('quantity'), watch('rate')]);

  const updateItems = async (data: RequisitionLedgerItem) => {
    setIsAdding(true);
    const calculated = Number(calculateAmount() ?? 0);
    const maxUnapprovedAmount = Number(data?.relatable?.unapproved_amount ?? 0);

    if (data?.relatable?.id && calculated > maxUnapprovedAmount) {
      setError('amount', {
        type: 'manual',
        message: `Amount should not exceed unapproved amount (${maxUnapprovedAmount.toLocaleString()}) of selected relatable`,
      });
      setIsAdding(false);
      return;
    }

    clearErrors('amount');
    const newItem = {
      ...data,
      amount: calculated,
    };

    if (index > -1) {
      const updatedItems = [...requisition_ledger_items];
      updatedItems[index] = newItem;
      await setRequisition_ledger_items(updatedItems);
    } else {
      await setRequisition_ledger_items((prevItems) => [...prevItems, newItem]);

      // Keep form ready for next add by clearing UI state and remounting uncontrolled fields.
      reset(getEmptyFormValues());
      setCalculatedAmount(0);
      setSelectedRelated(null);
      setRelatedTransactions([]);
      setFormResetKey((prev) => prev + 1);
    }

    setIsAdding(false);
    setShowForm?.(false);
  };

  const getRelatedTransactions = async () => {
    const ledgerId = watch('ledger_id');
    const relatable_type = watch('relatable_type');
    setIsRetrieving(true);

    if (ledgerId && relatable_type) {
      try {
        const fetchedRelatedTransactions =
          await requisitionsServices.getRelatedTransactions({
            ledger_id: ledgerId,
            type: relatable_type,
            payment_status: 'partially_and_not_approved',
          });
        setRelatedTransactions(fetchedRelatedTransactions);

        if (ledger_item?.relatable_id) {
          setSelectedRelated(
            fetchedRelatedTransactions.find(
              (link: any) => link.id === ledger_item.relatable_id
            )
          );
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
        <Grid size={{ xs: 12, md: 3 }}>
          <Div sx={{ mt: 0.3 }}>
            <LedgerSelect
              key={`ledger-select-${formResetKey}`}
              multiple={false}
              label='Ledger Name'
              allowedGroups={[
                'Accounts Receivable',
                'Accounts Payable',
                'Expenses',
                'Liabilities',
              ]}
              defaultValue={ledger_item?.ledger}
              frontError={
                errors.ledger_id
                  ? { message: errors.ledger_id.message || '' }
                  : undefined
              }
              onChange={(newValue: any) => {
                setValue('ledger', newValue);
                setValue('ledger_id', newValue?.id ?? null, {
                  shouldValidate: true,
                  shouldDirty: true,
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
        <Grid size={{ xs: 12, md: 2 }}>
          <Div sx={{ mt: 0.3 }}>
            <MeasurementSelector
              key={`measurement-selector-${formResetKey}`}
              label='Unit'
              frontError={
                errors.measurement_unit_id
                  ? { message: errors.measurement_unit_id.message || '' }
                  : undefined
              }
              defaultValue={
                ledger_item?.measurement_unit_id ??
                ledger_item?.measurement_unit?.id
              }
              onChange={(newValue: any) => {
                setValue('unit_symbol', newValue?.symbol);
                setValue('measurement_unit_id', newValue?.id ?? null, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              key={`quantity-${formResetKey}`}
              label='Quantity'
              fullWidth
              size='small'
              defaultValue={ledger_item?.quantity}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              error={!!errors?.quantity}
              helperText={errors?.quantity?.message}
              onChange={(e) => {
                setValue(
                  'quantity',
                  e.target.value ? sanitizedNumber(e.target.value) : 0,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              key={`rate-${formResetKey}`}
              label='Rate'
              fullWidth
              size='small'
              defaultValue={ledger_item?.rate}
              error={!!errors?.rate}
              helperText={errors?.rate?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              onChange={(e) => {
                setValue(
                  'rate',
                  e.target.value ? sanitizedNumber(e.target.value) : 0,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  }
                );
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              label='Amount'
              fullWidth
              size='small'
              value={calculatedAmount}
              error={!!errors?.amount}
              helperText={errors?.amount?.message}
              InputProps={{
                inputComponent: CommaSeparatedField,
                readOnly: true,
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Div>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Div sx={{ mt: 0.3 }}>
            <Autocomplete
              key={`relatable-type-${formResetKey}`}
              id='checkboxes-linked_to_types'
              options={relatableTypes}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              getOptionLabel={(option) => option.label}
              defaultValue={
                ledger_item
                  ? relatableTypes.find(
                      (link) => link.value === watch('relatable_type')
                    )
                  : null
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Linked To'
                  size='small'
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
          <Grid size={{ xs: 12, md: 4 }}>
            <LinearProgress />
          </Grid>
        ) : (
          <Grid size={{ xs: 12, md: 4 }}>
            <Div sx={{ mt: 0.3 }}>
              <Autocomplete
                id='checkboxes-related_transitions'
                key={`${watch('relatable_type')}-${formResetKey}`}
                options={relatedTransactions}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) =>
                  `${option.relatableNo} (${readableDate(option.order_date, false)} - ${option.unapproved_amount?.toLocaleString(
                    'en-US',
                    {
                      style: 'currency',
                      currency: option.currency?.code,
                    }
                  )})`
                }
                value={selectedRelated}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Relatable To'
                    size='small'
                    fullWidth
                  />
                )}
                onChange={(e, newValue) => {
                  setSelectedRelated(newValue);
                  setValue('relatable', newValue ?? null);
                  setValue('relatable_id', newValue?.id ?? null);
                  setValue('amount', watch('amount'), {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Div>
          </Grid>
        )}
        <Grid size={{ xs: 12, md: 5 }}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              key={`remarks-${formResetKey}`}
              label='Remarks'
              fullWidth
              size='small'
              {...register('remarks')}
            />
          </Div>
        </Grid>
        <Grid size={12} textAlign={'end'} paddingBottom={0.5}>
          <Button variant='contained' size='small' type='submit'>
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
