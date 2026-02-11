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
  DisabledByDefaultOutlined,
} from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';
import OperationSelector from '@/components/sharedComponents/OperationSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

interface Adjustment {
  type?: 'addition' | 'deduction' | '+ ' | '-' | string;
  type_name?: string;
  description?: string;
  amount?: number;
  complement_ledger_id?: number;
  complement_ledger?: { id: number };
}

interface ProjectClaimsAdjustmentsProps {
  setClearFormKey: (fn: (prev: number) => number) => void;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (dirty: boolean) => void;
  index?: number;
  setShowForm?: (value: boolean) => void;
  adjustment?: Adjustment;
  adjustments: Adjustment[];
  setAdjustments: (fn: (prev: Adjustment[]) => Adjustment[]) => void;
}

interface FormValues {
  type: string;
  type_name?: string;
  description: string;
  amount: number | '';
  complement_ledger_id: number | null;
}

const ProjectClaimsAdjustments: React.FC<ProjectClaimsAdjustmentsProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm,
  adjustment,
  adjustments,
  setAdjustments,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const { ungroupedLedgerOptions } = useLedgerSelect();

  const normalizeType = (type?: string): string => {
    if (!type) return '-';
    return type === 'addition' || type === '+' ? '+' : '-';
  };

  const validationSchema = yup.object({
    type: yup.string().oneOf(['+', '-']).required('Type is required'),
    description: yup.string().required('Description is required'),
    amount: yup
      .number()
      .required('Amount is required')
      .positive('Amount must be greater than 0')
      .typeError('Valid amount is required'),
    complement_ledger_id: yup
      .number()
      .nullable()
      .required('Complement Ledger is required'),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      type: normalizeType(adjustment?.type),
      type_name: adjustment?.type_name || '',
      description: adjustment?.description || '',
      amount: adjustment?.amount || '',
      complement_ledger_id:
        adjustment?.complement_ledger_id ||
        adjustment?.complement_ledger?.id ||
        null,
    },
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  useEffect(() => {
    if (submitItemForm) {
      trigger().then((isValid) => {
        if (isValid) {
          handleSubmit(updateItems)();
        }
        setSubmitItemForm(false);
      });
    }
  }, [submitItemForm, trigger, handleSubmit, setSubmitItemForm]);

  const watchedAmount = watch('amount');

  const updateItems = (data: FormValues) => {
    setIsAdding(true);

    const itemToSave: Adjustment = {
      type: data.type,
      type_name: data.type_name,
      description: data.description,
      amount: Number(data.amount),
      complement_ledger_id: data.complement_ledger_id!,
    };

    if (index > -1) {
      const updated = [...adjustments];
      updated[index] = { ...updated[index], ...itemToSave };
      setAdjustments(updated as any);
    } else {
      setAdjustments((prev) => [...prev, itemToSave]);
      if (submitItemForm) {
        submitMainForm();
      }
    }

    reset();
    setClearFormKey((prev) => prev + 1);
    setIsAdding(false);
    setShowForm?.(false);
  };

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <Grid container spacing={1} mt={0.5} width="100%">
      <Grid size={{ xs: 12, md: 3 }}>
        <Div sx={{ mt: 0.3 }}>
          <OperationSelector
            label="Type"
            frontError={errors.type}
            defaultValue={adjustment && normalizeType(adjustment?.type)}
            onChange={(newValue: any) => {
              setValue('type', newValue?.value || '-', {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue('type_name', newValue?.label || '', {
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>

      {/* Complement Ledger */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Div sx={{ mt: 0.3 }}>
          <LedgerSelect
            multiple={false}
            label="Complement Ledger"
            defaultValue={ungroupedLedgerOptions?.find(
              (l: any) => l.id === watch('complement_ledger_id')
            )}
            allowedGroups={['Expenses', 'Fixed Assets', 'Liabilities']}
            frontError={errors.complement_ledger_id}
            onChange={(newValue: any) => {
              setValue('complement_ledger_id', newValue?.id ?? null, {
                shouldDirty: true,
                shouldValidate: true,
              });
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
            label="Amount"
            value={watchedAmount}
            error={!!errors.amount}
            helperText={errors.amount?.message}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
            }}
            onChange={(e) => {
              const sanitized = e.target.value ? sanitizedNumber(e.target.value) : '';
              setValue('amount', sanitized, {
                shouldDirty: true,
                shouldValidate: true,
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
            label="Description"
            value={watch('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
            onChange={(e) =>
              setValue('description', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Div>
      </Grid>

      {/* Action Buttons */}
      <Grid size={12} textAlign="end">
        <Button
          variant="contained"
          size="small"
          disabled={isAdding}
          onClick={handleSubmit(updateItems)}
          startIcon={
            isAdding ? (
              <CircularProgress size={16} color="inherit" />
            ) : adjustment ? (
              <CheckOutlined />
            ) : (
              <AddOutlined />
            )
          }
          sx={{ mb: 0.5 }}
        >
          {adjustment ? 'Done' : 'Add'}
        </Button>

        {adjustment && setShowForm && (
          <Tooltip title="Cancel Edit">
            <IconButton size="small" onClick={() => setShowForm(false)}>
              <DisabledByDefaultOutlined fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  );
};

export default ProjectClaimsAdjustments;