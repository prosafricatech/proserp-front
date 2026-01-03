import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefaultOutlined } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useProjectProfile } from '@/components/projectManagement/projects/profile/ProjectProfileProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';

interface DeliverableOption {
  id: number;
  description: string;
  currency_id: number;
  response_uncertified_quantity?: number;
  response_executed_quantity?: number;
  unit_symbol?: string;
}

const ClaimedDeliverablesItemForm = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm = null,
  deliverableItem,
  deliverableItems = [],
  setDeliverablesItems,
  selectedCurrencyId,
}: any) => {
  const { deliverable_groups, setFetchDeliverables }: any = useProjectProfile();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!deliverable_groups) {
      setFetchDeliverables(true);
    }
  }, [deliverable_groups, setFetchDeliverables]);

  const validationSchema = yup.object({
    project_deliverable_id: yup
      .number()
      .required('Deliverable is required')
      .typeError('Deliverable is required'),
    revenue_ledger_id: yup
      .number()
      .required('Revenue Ledger is required')
      .typeError('Revenue Ledger is required'),
    certified_quantity: yup
      .number()
      .required('Quantity is required')
      .positive('Quantity must be positive')
      .typeError('Quantity is required')
      .test('max-uncertified', function (value) {
        const { response_uncertified_quantity } = this.parent;
        if (response_uncertified_quantity != null && value! > response_uncertified_quantity) {
          return this.createError({
            message: `Cannot exceed un-certified quantity (${response_uncertified_quantity})`,
          });
        }
        return true;
      })
      .test('max-executed', function (value) {
        const { response_executed_quantity } = this.parent;
        if (response_executed_quantity != null && value! > response_executed_quantity) {
          return this.createError({
            message: `Cannot exceed executed quantity (${response_executed_quantity})`,
          });
        }
        return true;
      }),
    remarks: yup.string().optional(),
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
    reset,
    trigger,
  } = useForm({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      project_deliverable_id: deliverableItem?.project_deliverable_id || null,
      revenue_ledger_id: deliverableItem?.revenue_ledger_id || null,
      certified_quantity: deliverableItem?.certified_quantity || '',
      remarks: deliverableItem?.remarks || '',
    },
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

  // Trigger submit from parent
  useEffect(() => {
    if (submitItemForm) {
      trigger().then((valid) => {
        if (valid) {
          handleSubmit(updateItems)();
        }
        setSubmitItemForm(false);
      });
    }
  }, [submitItemForm, trigger, handleSubmit, setSubmitItemForm]);

  const updateItems = async (formData: any) => {
    setIsAdding(true);

    const itemToAdd = {
      ...formData,
      description: deliverables.find((d) => d.id === formData.project_deliverable_id)?.description,
    };

    if (index > -1) {
      // Edit existing
      const updated = [...deliverableItems];
      updated[index] = { ...updated[index], ...itemToAdd };
      setDeliverablesItems(updated);
    } else {
      // Add new
      setDeliverablesItems((prev: any[]) => [...prev, itemToAdd]);
      if (submitItemForm) submitMainForm();
    }

    reset();
    setClearFormKey((prev: number) => prev + 1);
    setIsAdding(false);
    setShowForm?.(false);
  };

  const getDeliverablesOptions = (groups: any[], depth = 0): DeliverableOption[] => {
    if (!Array.isArray(groups)) return [];

    return groups.flatMap((group) => {
      const deliverableOptions = (group.deliverables || []).map((del: any) => ({
        id: del.id,
        description: del.description,
        currency_id: del.currency_id,
        response_uncertified_quantity: del.response_uncertified_quantity,
        response_executed_quantity: del.response_executed_quantity,
        unit_symbol: del.unit_symbol,
      }));

      const childrenOptions = getDeliverablesOptions(group.children || [], depth + 1);

      return [...deliverableOptions, ...childrenOptions];
    });
  };

  const deliverables = getDeliverablesOptions(deliverable_groups || []);

  if (isAdding) return <LinearProgress />;

  return (
    <Grid container spacing={1} mt={0.5}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete
          options={deliverables.filter((del) => del.currency_id === selectedCurrencyId)}
          getOptionLabel={(option) => option.description || ''}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          value={deliverables.find((d) => d.id === watch('project_deliverable_id')) || null}
          onChange={(_, newValue) => {
            setValue(`deliverable` as any, newValue)
            setValue('project_deliverable_id', newValue?.id || null, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Deliverable"
              size="small"
              fullWidth
              error={!!errors.project_deliverable_id}
              helperText={errors.project_deliverable_id?.message as any}
            />
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <LedgerSelect
          multiple={false}
          label="Revenue Ledger"
          defaultValue={ungroupedLedgerOptions?.find((l) => l.id === watch('revenue_ledger_id'))}
          allowedGroups={['Revenue']}
          frontError={errors.revenue_ledger_id}
          onChange={(newValue: any) => {
            setValue('revenue_ledger_id', newValue?.id || null, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          label="Certified Quantity"
          fullWidth
          size="small"
          value={watch('certified_quantity')}
          InputProps={{
            inputComponent: CommaSeparatedField as any
          }}
          error={!!errors.certified_quantity}
          helperText={errors.certified_quantity?.message as any}
          onChange={(e) => {
            const num = e.target.value ? sanitizedNumber(e.target.value) : '';
            setValue('certified_quantity', num, { shouldDirty: true, shouldValidate: true });
          }}
        />
      </Grid>

      <Grid size={12}>
        <TextField
          size="small"
          fullWidth
          label="Remarks"
          value={watch('remarks')}
          onChange={(e) =>
            setValue('remarks', e.target.value, { shouldDirty: true, shouldValidate: true })
          }
        />
      </Grid>

      <Grid size={12} textAlign="end">
        <Button
          variant="contained"
          size="small"
          disabled={isAdding}
          onClick={handleSubmit(updateItems)}
          startIcon={isAdding ? <CircularProgress size={16} color="inherit" /> : deliverableItem ? <CheckOutlined /> : <AddOutlined />}
          sx={{ mb: 0.5 }}
        >
          {deliverableItem ? 'Done' : 'Add'}
        </Button>

        {deliverableItem && setShowForm && (
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

export default ClaimedDeliverablesItemForm;