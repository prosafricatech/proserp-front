import React, { useEffect, useState } from 'react';
import { Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useLedgerSelect } from '../ledgers/forms/LedgerSelectProvider';
import { Div } from '@jumbo/shared';
import LedgerSelect from '../ledgers/forms/LedgerSelect';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Ledger } from '../ledgers/LedgerType';

type TransactionItem = {
  debit_ledger_id?: number;
  credit_ledger_id?: number;
  amount: number;
  description: string;
};

type TransactionItemFormProps = {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  isReceipt?: boolean;
  isPayment?: boolean;
  isTransfer?: boolean;
  index?: number;
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
  item?: TransactionItem;
  items?: TransactionItem[];
  setItems: React.Dispatch<React.SetStateAction<TransactionItem[]>>;
};

type FormValues = {
  debit_ledger?: Ledger;
  debit_ledger_id?: number;
  credit_ledger?: Ledger;
  credit_ledger_id?: number;
  amount: number;
  description: string;
};

const TransactionItemForm: React.FC<TransactionItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  isReceipt = false,
  isPayment = false,
  isTransfer = false,
  index = -1,
  setShowForm = null,
  item,
  items = [],
  setItems
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const validationSchema = yup.object().shape({
    debit_ledger_id: yup
      .number()
      .when('$isPaymentOrTransfer', {
        is: (isPaymentOrTransfer: boolean) => isPaymentOrTransfer,
        then: (schema) => schema
          .required("Debit account is required")
          .positive("Debit account is required")
          .test('unique-ledgers', 'Debit and credit accounts cannot be the same', function (value) {
            return value !== this.parent.credit_ledger_id;
          })
          .typeError("Debit account is required"),
        otherwise: (schema) => schema.nullable(),
      }),
    credit_ledger_id: yup
      .number()
      .when('$isReceipt', {
        is: (isReceipt: boolean) => isReceipt,
        then: (schema) => schema
          .required("Credit account is required")
          .positive("Credit account is required")
          .test('unique-ledgers', 'Debit and credit accounts cannot be the same', function (value) {
            return value !== this.parent.debit_ledger_id;
          })
          .typeError("Credit account is required"),
        otherwise: (schema) => schema.nullable(),
      }),
    description: yup.string().required('Description is required').typeError('Description is required'),
    amount: yup.number().required("Amount is required").positive("Amount must be greater than 0").typeError('Amount is required'),
  });

  const { setValue, handleSubmit, watch, reset, formState: { errors, dirtyFields } } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      credit_ledger: item && ungroupedLedgerOptions.find(ledger => ledger.id === item.credit_ledger_id),
      credit_ledger_id: item?.credit_ledger_id,
      debit_ledger: item && ungroupedLedgerOptions.find(ledger => ledger.id === item.debit_ledger_id),
      debit_ledger_id: item?.debit_ledger_id,
      amount: item?.amount || 0, 
      description: item?.description || '', 
    }
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty, watch]);

  const updateItems = async (formData: FormValues) => {
    setIsAdding(true);
    const newItem: TransactionItem = {
      debit_ledger_id: formData.debit_ledger_id,
      credit_ledger_id: formData.credit_ledger_id,
      amount: formData.amount,
      description: formData.description
    };

    if (index > -1) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[index] = newItem;
      await setItems(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      // Add new item
      await setItems(prevItems => [...prevItems, newItem]);
      if (submitItemForm) {
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

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <Grid container spacing={1} marginTop={0.5}>
      {/* Debit Ledger Field */}
      {(isPayment || isTransfer) && (
        <Grid size={{xs: 12, md: 4}}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              label={isPayment ? 'Pay (Debit)' : isTransfer ? 'To (Debit)' : 'Debit'}
              frontError={errors.debit_ledger_id}
              defaultValue={ungroupedLedgerOptions.find(ledger => ledger.id === watch('debit_ledger_id'))}
              allowedGroups={isPayment ? ['Expenses', 'Accounts Receivable', 'Liabilities', 'Capital', 'Duties and Taxes'] : isTransfer ? ['Cash and cash equivalents'] : []}
              onChange={(newValue) => {
                const selected = Array.isArray(newValue) ? newValue[0] : newValue;
                setValue('debit_ledger', selected || undefined);
                setValue('debit_ledger_id', selected?.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
      )}

      {/* Credit Ledger Field */}
      {isReceipt && (
        <Grid size={{xs: 12, md: 4}}>
          <Div sx={{ mt: 1 }}>
            <LedgerSelect
              label={isReceipt ? 'From (Credit)' : 'Credit'}
              frontError={errors.credit_ledger_id}
              allowedGroups={isReceipt ? ['Accounts Receivable','Accounts Payable','Capital'] : []}
              defaultValue={ungroupedLedgerOptions.find(ledger => ledger.id === watch('credit_ledger_id'))}
              onChange={(newValue) => {
                const selected = Array.isArray(newValue) ? newValue[0] : newValue;
                setValue('credit_ledger', selected || undefined);
                setValue('credit_ledger_id', selected?.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Div>
        </Grid>
      )}

      <Grid size={{xs: 12, md: 4}}>
        <Div sx={{ mt: 1 }}>
          <TextField
            size="small"
            fullWidth
            defaultValue={watch('description')}
            label="Description"
            error={!!errors.description}
            helperText={errors.description?.message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setValue('description', e.target.value, {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{xs: 12, md: 4}}>
        <Div sx={{ mt: 1 }}>
          <TextField
            label="Amount"
            fullWidth
            size='small'
            value={watch('amount')}
            error={!!errors.amount}
            helperText={errors.amount?.message}
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = sanitizedNumber(e.target.value);
              setValue('amount', value, { shouldValidate: true, shouldDirty: true });
            }}
          />
        </Div>
      </Grid>

      {/* Action Buttons */}
      <Grid size={12} textAlign={'end'}>
        <LoadingButton
          loading={false}
          variant='contained'
          type='submit'
          size='small'
          onClick={handleSubmit(updateItems)}
          sx={{ marginBottom: 0.5 }}
        >
          {item ? (
            <><CheckOutlined fontSize='small' /> Done</>
          ) : (
            <><AddOutlined fontSize='small' /> Add</>
          )}
        </LoadingButton>
        {item && setShowForm && (
          <Tooltip title='Close Edit'>
            <IconButton size='small' onClick={() => setShowForm(false)}>
              <DisabledByDefault fontSize='small' color='success' />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default TransactionItemForm;