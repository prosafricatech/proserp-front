import React, { useEffect, useState } from 'react';
import { Grid, IconButton, LinearProgress, TextField, Tooltip, Autocomplete } from '@mui/material';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useLedgerSelect } from '../../ledgers/forms/LedgerSelectProvider';

interface LedgerOption {
  id: number;
  name: string;
}

interface JournalItem {
  debit_ledger_id?: number;
  credit_ledger_id?: number;
  amount: number;
  description: string;
}

interface JournalItemFormProps {
  setClearFormKey: (value: React.SetStateAction<number>) => void;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (value: boolean) => void;
  index?: number;
  setShowForm?: (value: boolean) => void;
  item?: JournalItem;
  items: JournalItem[];
  setItems: (items: JournalItem[] | ((prevItems: JournalItem[]) => JournalItem[])) => void;
}

interface FormValues {
  debit_ledger?: LedgerOption | null;
  debit_ledger_id?: number | null;
  credit_ledger?: LedgerOption | null;
  credit_ledger_id?: number | null;
  amount: number;
  description: string;
}

function JournalItemForm({ 
  setClearFormKey, 
  submitMainForm, 
  submitItemForm, 
  setSubmitItemForm, 
  setIsDirty, 
  index = -1, 
  setShowForm, 
  item, 
  items = [], 
  setItems 
}: JournalItemFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const dob: LedgerOption = { id: 1, name: 'Diff. in Opening Balances' };

  // Combine dob with ungroupedLedgerOptions
  const options: LedgerOption[] = [dob, ...ungroupedLedgerOptions];

  // Define validation schema
  const validationSchema = yup.object().shape({
    debit_ledger_id: yup
      .number()
      .required("Debit account is required")
      .positive("Debit account must be a positive number")
      .typeError("Debit account is required")
      .test('unique-ledgers', 'Debit and credit accounts cannot be the same', function (value) {
          return value !== this.parent.credit_ledger_id;
      }),
    credit_ledger_id: yup
      .number()
      .required("Credit account is required")
      .positive("Credit account must be a positive number")
      .typeError("Credit account is required")
      .test('unique-ledgers', 'Debit and credit accounts cannot be the same', function (value) {
        return value !== this.parent.debit_ledger_id;
      }),
    description: yup.string().required('Description is required').typeError('Description is required'),
    amount: yup.number().required("Amount is required").positive("Amount must be greater than 0").typeError('Amount must be a number'),
  });

  const { 
    setValue, 
    handleSubmit, 
    watch, 
    reset, 
    formState: { errors, dirtyFields } 
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      credit_ledger: item ? options.find(option => option.id === item.credit_ledger_id) : null,
      credit_ledger_id: item?.credit_ledger_id,
      debit_ledger: item ? options.find(option => option.id === item.debit_ledger_id) : null,
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
    const newItem: JournalItem = {
      debit_ledger_id: formData.debit_ledger_id || undefined,
      credit_ledger_id: formData.credit_ledger_id || undefined,
      amount: formData.amount,
      description: formData.description
    };

    if (index > -1) {
      // Replace the existing item with the edited item
      const updatedItems = [...items];
      updatedItems[index] = newItem;
      await setItems(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      // Add the new item to the items array
      await setItems((prevItems: JournalItem[]) => [...prevItems, newItem]);
      if (submitItemForm) {
        submitMainForm();
      }
      setSubmitItemForm(false);
      setClearFormKey(prevKey => prevKey + 1);
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

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <Grid container spacing={1} marginTop={0.5}>
      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1 }}>
          <Autocomplete<LedgerOption>
            options={options}
            getOptionLabel={(option) => option.name}
            value={options.find(option => option.id === watch('debit_ledger_id')) || null}
            onChange={(event, newValue) => {
              setValue('debit_ledger', newValue);
              setValue('debit_ledger_id', newValue?.id || null, {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                fullWidth
                label="Debit"
                error={!!errors.debit_ledger_id}
                helperText={errors.debit_ledger_id?.message}
              />
            )}
          />
        </Div>
      </Grid>

      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1 }}>
          <Autocomplete<LedgerOption>
            options={options}
            getOptionLabel={(option) => option.name}
            value={options.find(option => option.id === watch('credit_ledger_id')) || null}
            onChange={(event, newValue) => {
              setValue('credit_ledger', newValue);
              setValue('credit_ledger_id', newValue?.id || null, {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                fullWidth
                label="Credit"
                error={!!errors.credit_ledger_id}
                helperText={errors.credit_ledger_id?.message}
              />
            )}
          />
        </Div>
      </Grid>

      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1 }}>
          <TextField
            size="small"
            fullWidth
            defaultValue={watch('description')}
            label="Description"
            error={!!errors.description}
            helperText={errors.description?.message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setValue('description', e.target.value || '', {
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Div>
      </Grid>

      <Grid size={{xs: 12, md: 3}}>
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

      <Grid size={12} textAlign={'end'}>
        <LoadingButton
          loading={false}
          variant='contained'
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
}

export default JournalItemForm;