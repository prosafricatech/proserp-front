'use client';

import {
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  AddOutlined,
  CheckOutlined,
  DisabledByDefault,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

import OperationSelector from '@/components/sharedComponents/OperationSelector';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';

// ==================== Types ====================
interface Adjustment {
  id?: number | string;
  description?: string;
  type?: string; // '+' | '-' | 'addition' | 'deduction'
  type_name?: string;
  amount?: number | string;
  complement_ledger_id?: number;
  complement_ledger?: { id: number; name: string };
}

interface LedgerOption {
  id: number;
  name: string;
  // ... other ledger fields
}

interface CertifiedAdjustmentsProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>; // Accepts number or updater function
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (value: boolean) => void;
  index?: number;
  setShowForm?: ((value: boolean) => void) | null;
  adjustment?: Adjustment;
  adjustments: Adjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<Adjustment[]>>;
}

// ==================== Component ====================
const CertifiedAdjustments: React.FC<CertifiedAdjustmentsProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm = null,
  adjustment,
  adjustments,
  setAdjustments,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const normalizeType = (type?: string): '+' | '-' => {
    if (!type) return '-';
    return type === 'addition' || type === '+' ? '+' : '-';
  };

  const validationSchema = yup.object({
    type: yup.string().oneOf(['+', '-']).required('Type is required'),
    type_name: yup.string(),
    description: yup.string().required('Description is required'),
    amount: yup
      .number()
      .required('Amount is required')
      .positive('Amount must be positive')
      .typeError('Valid amount is required'),
    complement_ledger_id: yup
      .number()
      .required('Complement Ledger is required')
      .typeError('Complement Ledger is required'),
  });

  type FormData = yup.InferType<typeof validationSchema>;

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty: isFormDirty },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      type: normalizeType(adjustment?.type),
      type_name:
        adjustment?.type_name ||
        (normalizeType(adjustment?.type) === '+' ? 'Addition' : 'Deduction'),
      description: adjustment?.description || '',
      amount: adjustment?.amount ? Number(adjustment.amount) : undefined,
      complement_ledger_id:
        adjustment?.complement_ledger_id || adjustment?.complement_ledger?.id,
    },
  });

  // Sync dirty state to parent
  useEffect(() => {
    setIsDirty(isFormDirty);
  }, [isFormDirty, setIsDirty]);

  // Watch form values
  const watchedType = watch('type');
  const watchedAmount = watch('amount');
  const watchedDescription = watch('description');
  const watchedComplementLedgerId = watch('complement_ledger_id');

  const onSubmit = async (data: FormData) => {
    setIsAdding(true);

    const newAdjustment: Adjustment = {
      ...adjustment,
      description: data.description,
      type: data.type,
      type_name: data.type_name,
      amount: data.amount,
      complement_ledger_id: data.complement_ledger_id,
    };

    if (index > -1) {
      const updated = [...adjustments];
      updated[index] = newAdjustment;
      setAdjustments(updated);
    } else {
      setAdjustments((prev) => [...prev, newAdjustment]);
      if (submitItemForm) {
        submitMainForm();
        setSubmitItemForm(false);
      }
    }

    // Reset form
    reset({
      type: '-',
      type_name: 'Deduction',
      description: '',
      amount: undefined,
      complement_ledger_id: undefined,
    });

    // Increment key safely – now supports function updater
    setClearFormKey((prev) => prev + 1);

    setShowForm?.(false);
    setIsAdding(false);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <Grid container spacing={1} mt={0.5} width="100%">
      {/* Type Selector */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 0.3 }}>
          <OperationSelector
            label="Type"
            frontError={errors.type}
            value={
              watchedType === '+'
                ? { value: '+', label: 'Addition' }
                : { value: '-', label: 'Deduction' }
            }
            onChange={(newValue: { value: string; label: string } | null) => {
              if (newValue) {
                setValue('type', newValue.value as '+' | '-', {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue('type_name', newValue.label, { shouldDirty: true });
              }
            }}
          />
        </Div>
      </Grid>

      {/* Complement Ledger */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 0.3 }}>
          <LedgerSelect
            multiple={false}
            label="Complement Ledger"
            value={
              ungroupedLedgerOptions?.find(
                (l: LedgerOption) => l.id === watchedComplementLedgerId
              ) || null
            }
            allowedGroups={['Expenses', 'Fixed Assets', 'Liabilities']}
            frontError={errors.complement_ledger_id}
            onChange={(newValue: any) => {
              // Safe access: newValue is always single object or null when multiple={false}
              setValue(
                'complement_ledger_id',
                newValue ? newValue.id : undefined,
                {
                  shouldValidate: true,
                  shouldDirty: true,
                }
              );
            }}
          />
        </Div>
      </Grid>

      {/* Amount */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size="small"
            fullWidth
            value={watchedAmount ?? ''}
            label="Amount"
            error={!!errors.amount}
            helperText={errors.amount?.message}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
            }}
            onChange={(e) => {
              const sanitized = e.target.value
                ? sanitizedNumber(e.target.value)
                : undefined;
              setValue('amount', sanitized, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      {/* Description */}
      <Grid size={12}>
        <Div sx={{ mt: 0.3 }}>
          <TextField
            size="small"
            fullWidth
            multiline
            rows={2}
            value={watchedDescription || ''}
            label="Description"
            error={!!errors.description}
            helperText={errors.description?.message}
            onChange={(e) => {
              setValue('description', e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      {/* Actions */}
      <Grid size={12} textAlign="end">
        <LoadingButton
          loading={isAdding}
          variant="contained"
          size="small"
          startIcon={adjustment ? <CheckOutlined /> : <AddOutlined />}
          onClick={handleSubmit(onSubmit)}
          sx={{ mb: 0.5, mr: 1 }}
        >
          {adjustment ? 'Done' : 'Add'}
        </LoadingButton>

        {adjustment && setShowForm && (
          <Tooltip title="Cancel Edit">
            <IconButton
              size="small"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
            >
              <DisabledByDefault fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default CertifiedAdjustments;