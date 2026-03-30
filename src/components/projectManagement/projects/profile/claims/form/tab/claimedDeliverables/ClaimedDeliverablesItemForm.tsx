'use client';

import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefaultOutlined } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { useProjectProfile } from '@/components/projectManagement/projects/profile/ProjectProfileProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import projectsServices from '@/components/projectManagement/projects/project-services';

interface Deliverable {
  id: number;
  description: string;
  currency_id: number;
  contract_rate: number;
  unit_symbol?: string;
  measurement_unit?: {
    symbol: string;
  };
}

interface ProjectDeliverableGroup {
  deliverables?: Deliverable[];
  children?: ProjectDeliverableGroup[];
}

interface ClaimedDeliverableItem {
  id?: number | string;
  project_deliverable_id?: number;
  project_deliverable?: Deliverable;
  revenue_ledger?: { id: number; name: string };
  revenue_ledger_id?: number;
  rate?: number;
  certified_quantity?: number | string;
  remarks?: string;
  unit_symbol?: string
  measurement_unit?: {
    symbol: string;
  };
  response_uncertified_quantity?: number;
}

interface ClaimedDeliverablesItemFormProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: () => void;
  submitItemForm: boolean;
  setSubmitItemForm: (value: boolean) => void;
  setIsDirty: (value: boolean) => void;
  index?: number;
  setShowForm?: (value: boolean) => void;
  deliverableItem?: ClaimedDeliverableItem;
  deliverableItems: ClaimedDeliverableItem[];
  claimDate: string;
  setDeliverablesItems: React.Dispatch<React.SetStateAction<ClaimedDeliverableItem[]>>;
  selectedCurrencyId?: number;
}

interface FormValues {
  project_deliverable_id?: number;
  revenue_ledger_id?: number;
  certified_quantity?: number | string;
  rate?: number;
  remarks?: string;
  response_uncertified_quantity?: number;
}

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
    .typeError('Valid quantity is required')
    .test('max-uncertified', function (value) {
      if (!value) return true;

      const deliverableId = this.parent.project_deliverable_id;
      const uncertified = this.parent.response_uncertified_quantity ?? 0;

      const alreadyClaimed = this.options.context?.deliverableItems
        .filter((item: ClaimedDeliverableItem, idx: number) => {
          const isSameDeliverable =
            (item.project_deliverable_id || item.project_deliverable?.id) === deliverableId;
          const isNotCurrentItem = idx !== this.options.context?.index;
          return isSameDeliverable && isNotCurrentItem;
        })
        .reduce((sum: number, item: ClaimedDeliverableItem) => sum + (Number(item.certified_quantity) || 0), 0);

      const remaining = uncertified - alreadyClaimed;

      if (value > remaining) {
        return this.createError({
          message: `Max allowable: ${remaining} (Uncertified: ${uncertified}, Already claimed: ${alreadyClaimed})`,
        });
      }
      return true;
    }),
});

const ClaimedDeliverablesItemForm: React.FC<ClaimedDeliverablesItemFormProps> = ({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  index = -1,
  setShowForm,
  deliverableItem,
  deliverableItems = [],
  claimDate,
  setDeliverablesItems,
  selectedCurrencyId,
}) => {
  const { deliverable_groups }: { deliverable_groups: ProjectDeliverableGroup[] } = useProjectProfile() as any;
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [isAdding, setIsAdding] = useState(false);
  const [isRetrievingDetails, setIsRetrievingDetails] = useState(false);
  const [unitToDisplay, setUnitToDisplay] = useState<string | undefined>(
    deliverableItem?.unit_symbol || deliverableItem?.measurement_unit?.symbol
  );

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
    reset,
    trigger,
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    context: { deliverableItems, index },
    defaultValues: {
      project_deliverable_id: deliverableItem?.project_deliverable_id || deliverableItem?.project_deliverable?.id,
      revenue_ledger_id: deliverableItem?.revenue_ledger_id || deliverableItem?.revenue_ledger?.id,
      certified_quantity: deliverableItem?.certified_quantity || '',
      rate: deliverableItem?.project_deliverable?.contract_rate || deliverableItem?.rate,
      remarks: deliverableItem?.remarks || '',
      response_uncertified_quantity: deliverableItem?.response_uncertified_quantity,
    },
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty]);

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

  const updateItems = async (formData: FormValues) => {
    setIsAdding(true);

    const selectedDeliverable = deliverables.find((d) => d.id === formData.project_deliverable_id);

    const itemToAdd = {
      ...formData,
      project_deliverable: selectedDeliverable,
    };

    if (index > -1) {
      const updated = [...deliverableItems];
      updated[index] = { ...updated[index], ...itemToAdd };
      setDeliverablesItems(updated);
    } else {
      setDeliverablesItems((prev) => [...prev, itemToAdd]);
      if (submitItemForm) submitMainForm();
    }

    reset();
    setClearFormKey((prev) => prev + 1);
    setIsAdding(false);
    setShowForm?.(false);
  };

  const retrieveTaskDetails = async (delId?: number) => {
    if (!delId) return;
    setIsRetrievingDetails(true);
    try {
      const details = await projectsServices.showDelUncertifiedQTY(delId, claimDate);
      setValue('response_uncertified_quantity', details?.uncertified_quantity ?? 0);
    } catch (error) {
      console.error('Failed to retrieve uncertified quantity', error);
    } finally {
      setIsRetrievingDetails(false);
    }
  };

  useEffect(() => {
    const delId = deliverableItem?.project_deliverable_id || deliverableItem?.project_deliverable?.id;
    if (delId) {
      retrieveTaskDetails(delId);
    }
  }, [deliverableItem]);

  const getDeliverablesOptions = (groups: ProjectDeliverableGroup[] = []): Deliverable[] => {
    if (!Array.isArray(groups)) return [];

    return groups.flatMap((group) => {
      const deliverableOptions = (group.deliverables || []).map((del) => ({
        id: del.id,
        description: del.description,
        currency_id: del.currency_id,
        contract_rate: del.contract_rate,
        unit_symbol: del.measurement_unit?.symbol,
      }));

      const childrenOptions = getDeliverablesOptions(group.children || []);

      return [...deliverableOptions, ...childrenOptions];
    });
  };

  const deliverables = getDeliverablesOptions(deliverable_groups);
  const watchedDeliverableId = watch('project_deliverable_id');
  const filteredDeliverables = deliverables.filter((del) => del.currency_id === selectedCurrencyId);
  const selectedDeliverable = filteredDeliverables.find(
    (d) => d.id === watchedDeliverableId
  );

  if (isAdding) return <LinearProgress />;

  return (
    <Grid container spacing={1} mt={0.5}>
      {/* Deliverable Selection */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete<Deliverable>
          options={filteredDeliverables}
          getOptionLabel={(option) => option.description || ''}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          value={selectedDeliverable || null}
          onChange={(_, newValue) => {
            if (newValue) {
              setUnitToDisplay(newValue.unit_symbol);
              setValue('unit_symbol' as any, newValue.unit_symbol);
              setValue('rate', newValue.contract_rate);
              setValue('project_deliverable_id', newValue.id, {
                shouldDirty: true,
                shouldValidate: true,
              });
              retrieveTaskDetails(newValue.id);
            } else {
              setUnitToDisplay(undefined);
              setValue('rate', undefined);
              setValue('unit_symbol' as any, undefined);
              setValue('project_deliverable_id', undefined, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Deliverable"
              size="small"
              fullWidth
              error={!!errors.project_deliverable_id}
              helperText={errors.project_deliverable_id?.message}
            />
          )}
        />
      </Grid>

      {/* Revenue Ledger */}
      <Grid size={{ xs: 12, md: 4 }}>
        <LedgerSelect
          multiple={false}
          label="Revenue Ledger"
          defaultValue={ungroupedLedgerOptions?.find((l) => l.id === watch('revenue_ledger_id'))}
          allowedGroups={['Revenue', 'Accounts Receivable']}
          frontError={errors.revenue_ledger_id}
          onChange={(newValue: any) => {
            setValue('revenue_ledger_id', newValue?.id || undefined, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
      </Grid>

      {/* Certified Quantity with Unit Symbol */}
      <Grid size={{ xs: 12, md: 2 }}>
        {isRetrievingDetails ? (
          <LinearProgress />
        ) : (
          <TextField
            label="Certified Quantity"
            fullWidth
            size="small"
            value={watch('certified_quantity') ?? ''}
            InputProps={{
              inputComponent: CommaSeparatedField as any,
              endAdornment: unitToDisplay ? (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary">
                    {unitToDisplay}
                  </Typography>
                </InputAdornment>
              ) : null,
            }}
            error={!!errors.certified_quantity}
            helperText={errors.certified_quantity?.message}
            onChange={(e) => {
              const num = e.target.value ? sanitizedNumber(e.target.value) : '';
              setValue('certified_quantity', num, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 2 }}>
        <TextField
          label="Rate"
          fullWidth
          size="small"
          value={watch('rate')?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          InputProps={{
            readOnly: true,
            inputComponent: CommaSeparatedField as any,
          }}
        />
      </Grid>

      {/* Remarks */}
      <Grid size={12}>
        <TextField
          size="small"
          fullWidth
          label="Remarks"
          value={watch('remarks') ?? ''}
          onChange={(e) =>
            setValue('remarks', e.target.value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </Grid>

      {/* Action Buttons */}
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