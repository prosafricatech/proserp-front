'use client';
import React from 'react';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';

type ApprovalItem = {
  imprest_retirement_item_id: number;
  ledger_id: number | null;
  measurement_unit_id: number | null;
  quantity: number;
  rate: number;
  description: string;
  ledger?: any;
  measurement_unit?: any;
};

type ApprovalItemFieldErrors = {
  ledger_id?: string;
  measurement_unit_id?: string;
  quantity?: string;
  rate?: string;
};

type ImprestRetirementApprovalFormProps = {
  toggleOpen: (open: boolean) => void;
  retirement: any;
  isEdit?: boolean;
};

const extractList = (p: any): any[] => {
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.data?.data)) return p.data.data;
  return [];
};

function ImprestRetirementApprovalForm({
  toggleOpen,
  retirement,
  isEdit = false,
}: ImprestRetirementApprovalFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const approvals = extractList(retirement?.approvals);
  const latestApproval =
    retirement?.latest_approval ||
    retirement?.approval ||
    (approvals.length > 0 ? approvals[approvals.length - 1] : null);
  const approvalId = Number(latestApproval?.id || 0) || 0;

  const nextApprovalLevelId = Number(retirement?.next_approval_level?.id || 0) || 0;
  const nextApprovalLevelIsFinal = Number(
    retirement?.next_approval_level?.is_final ||
      retirement?.next_approval_level?.can_finalize ||
      0
  ) || 0;
  const isFinalLevel = Boolean(nextApprovalLevelIsFinal || latestApproval?.is_final);

  const chainLevelId = Number(
    isEdit
      ? latestApproval?.chain_level_id ||
          latestApproval?.approval_chain_level_id ||
          latestApproval?.approval_chain_level?.id ||
          latestApproval?.chain_level?.id ||
          approvals[approvals.length - 1]?.approval_chain_level?.id ||
          nextApprovalLevelId
      : nextApprovalLevelId ||
          latestApproval?.chain_level_id ||
          latestApproval?.approval_chain_level_id ||
          latestApproval?.approval_chain_level?.id ||
          latestApproval?.chain_level?.id ||
          approvals[approvals.length - 1]?.approval_chain_level?.id
  ) || 0;

  const isFinal = Number(
    isEdit
      ? latestApproval?.is_final ||
          latestApproval?.approval_chain_level?.is_final ||
          latestApproval?.chain_level?.is_final ||
          approvals[approvals.length - 1]?.is_final ||
        nextApprovalLevelIsFinal
      : nextApprovalLevelIsFinal ||
          latestApproval?.is_final ||
          latestApproval?.approval_chain_level?.is_final ||
          latestApproval?.chain_level?.is_final ||
          approvals[approvals.length - 1]?.is_final
  ) || 0;

  // Seed editable items — prefer items from the most recent approval that has items;
  // fall back to the retirement's own items (mirrors ApprovalForm's getInitialLedgerItems)
  const seedItems = React.useMemo((): ApprovalItem[] => {
    const lastWithItems = [...approvals]
      .reverse()
      .find((a) => extractList(a?.items).length > 0);
    const source = lastWithItems
      ? extractList(lastWithItems.items)
      : extractList(retirement?.items);

    return source.map((item: any) => ({
      imprest_retirement_item_id: Number(item?.imprest_retirement_item_id || item?.id || 0),
      ledger_id: Number(item?.ledger_id || item?.ledger?.id) || null,
      measurement_unit_id:
        Number(item?.measurement_unit_id || item?.measurement_unit?.id) || null,
      quantity: Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 1,
      rate: Number.isFinite(Number(item?.rate)) ? Number(item.rate) : 0,
      description: item?.description || item?.remarks || '',
      ledger: item?.ledger,
      measurement_unit: item?.measurement_unit,
    }));
  }, [retirement]);

  const [items, setItems] = React.useState<ApprovalItem[]>(seedItems);
  const [fieldErrors, setFieldErrors] = React.useState<ApprovalItemFieldErrors[]>([]);
  const [remarks, setRemarks] = React.useState('');
  const [clientError, setClientError] = React.useState<string | null>(null);

  const currencyCode =
    String(
      retirement?.currency?.code ||
        retirement?.currency_code ||
        retirement?.imprest_approval?.requisition?.currency?.code ||
        'TZS'
    ).trim() || 'TZS';

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );

  const statusLabel = String(retirement?.status_label || retirement?.status || '');
  const retirementNo = retirement?.retirementNo || `#${retirement?.id}`;

  const updateItem = (
    index: number,
    patch: Partial<ApprovalItem>,
    clearFields: (keyof ApprovalItemFieldErrors)[] = []
  ) =>
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });

  const clearFieldErrors = (
    index: number,
    fields: (keyof ApprovalItemFieldErrors)[]
  ) => {
    setFieldErrors((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || {}) };
      fields.forEach((field) => {
        delete next[index][field];
      });
      return next;
    });
  };

  const handleItemChange = (
    index: number,
    patch: Partial<ApprovalItem>,
    clearFields: (keyof ApprovalItemFieldErrors)[] = []
  ) => {
    updateItem(index, patch);
    if (clearFields.length > 0) {
      clearFieldErrors(index, clearFields);
    }
  };

  const { mutate: submitApproval, isPending } = useMutation({
    mutationFn: isEdit
      ? imprestRetirementServices.updateApproval
      : imprestRetirementServices.approve,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Decision recorded', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to submit decision',
        { variant: 'error' }
      );
    },
  });

  const buildItemsPayload = () =>
    items
      .map((item) => ({
        imprest_retirement_item_id: item.imprest_retirement_item_id,
        ledger_id: Number(item.ledger_id || 0),
        measurement_unit_id: Number(item.measurement_unit_id || 0),
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        description: item.description || '',
      }))
      .filter(
        (i) =>
          i.imprest_retirement_item_id > 0 &&
          i.ledger_id > 0 &&
          i.measurement_unit_id > 0 &&
          i.quantity > 0 &&
          (!isFinalLevel || i.rate > 0)
      );

  const validateItems = (): boolean => {
    const nextFieldErrors: ApprovalItemFieldErrors[] = items.map(() => ({}));
    let hasAnyError = false;

    items.forEach((item, index) => {
      if (!item.ledger_id) {
        nextFieldErrors[index].ledger_id = 'Ledger is required.';
        hasAnyError = true;
      }

      if (!item.measurement_unit_id) {
        nextFieldErrors[index].measurement_unit_id = 'Unit is required.';
        hasAnyError = true;
      }

      if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
        nextFieldErrors[index].quantity = 'Quantity must be greater than 0.';
        hasAnyError = true;
      }

      if (isFinalLevel && (!Number.isFinite(Number(item.rate)) || Number(item.rate) <= 0)) {
        nextFieldErrors[index].rate = 'Rate is required for final approval.';
        hasAnyError = true;
      }
    });

    setFieldErrors(nextFieldErrors);
    return !hasAnyError;
  };

  const validate = (requireRemarks: boolean): boolean => {
    if (!chainLevelId) {
      setClientError(
        'Approval chain level could not be determined. Please contact support.'
      );
      return false;
    }
    if (requireRemarks && !remarks.trim()) {
      setClientError('Remarks are required for this decision.');
      return false;
    }
    if (!validateItems()) {
      setClientError(
        isFinalLevel
          ? 'Final approval requires valid ledger, unit, quantity, and rate on each item.'
          : 'Each item requires valid ledger, unit, and quantity.'
      );
      return false;
    }
    setClientError(null);
    return true;
  };

  const run = (status: 'approved' | 'on hold' | 'rejected') => {
    if (!validate(status !== 'approved')) return;

    if (isEdit && !approvalId) {
      setClientError('Approval record could not be determined for update.');
      return;
    }

    const payload: any = {
      ...(isEdit ? { id: approvalId } : {}),
      imprest_retirement_id: retirement.id,
      chain_level_id: chainLevelId,
      is_final: isFinal,
      status,
      approval_date: dayjs().format('YYYY-MM-DD'),
      remarks: remarks.trim() || null,
    };

    if (status === 'approved' || status === 'on hold') {
      const builtItems = buildItemsPayload();
      if (builtItems.length) payload.items = builtItems;
    }

    submitApproval(payload);
  };

  const handleRemarksChange = (value: string) => {
    setRemarks(value);

    if (clientError === 'Remarks are required for this decision.' && value.trim()) {
      setClientError(null);
    }
  };

  return (
    <>
      <DialogTitle textAlign="center">
        {isEdit ? `Edit Approval — ${retirementNo}` : `Approve Retirement ${retirementNo}`}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={1.5} mb={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <Chip size="small" color="primary" label={`Status: ${statusLabel}`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Total:{' '}
            </Typography>
            <Typography variant="body2" fontWeight={700} component="span">
              {totalAmount.toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
              })}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 1.5 }} />

        {items.map((item, index) => (
          <Grid
            container
            spacing={1}
            alignItems="flex-start"
            key={`${item.imprest_retirement_item_id}-${index}`}
            mb={1}
          >
            <Grid size={{ xs: 1, md: 0.5 }}>
              <Typography variant="body2" mt={1}>
                {index + 1}.
              </Typography>
            </Grid>
            <Grid size={{ xs: 11, md: 3.5 }}>
              <LedgerSelect
                label="Item Ledger"
                frontError={fieldErrors[index]?.ledger_id ? { message: fieldErrors[index].ledger_id } : null}
                defaultValue={
                  item.ledger_id
                    ? ({ id: item.ledger_id, name: item.ledger?.name || '' } as any)
                    : null
                }
                onChange={(v: any) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  handleItemChange(index, {
                    ledger_id: Number(val?.id || 0) || null,
                    ledger: val,
                  }, ['ledger_id']);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <MeasurementSelector
                label="Unit"
                frontError={fieldErrors[index]?.measurement_unit_id ? { message: fieldErrors[index].measurement_unit_id } : null}
                defaultValue={item.measurement_unit_id || null}
                onChange={(v: any) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  handleItemChange(index, {
                    measurement_unit_id: Number(val?.id || 0) || null,
                    measurement_unit: val,
                  }, ['measurement_unit_id']);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                label="Qty"
                value={item.quantity ?? 0}
                error={!!fieldErrors[index]?.quantity}
                helperText={fieldErrors[index]?.quantity}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e) => {
                  const q = sanitizedNumber(e.target.value);
                  handleItemChange(index, { quantity: Number.isFinite(q) ? q : 0 }, ['quantity']);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                size="small"
                fullWidth
                label="Rate"
                value={item.rate ?? 0}
                error={!!fieldErrors[index]?.rate}
                helperText={fieldErrors[index]?.rate}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e) => {
                  const r = sanitizedNumber(e.target.value);
                  handleItemChange(index, { rate: Number.isFinite(r) ? r : 0 }, ['rate']);
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                size="small"
                fullWidth
                label="Amount"
                disabled
                value={(
                  (Number(item.quantity) || 0) * (Number(item.rate) || 0)
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={item.description || ''}
                onChange={(e) => updateItem(index, { description: e.target.value })}
              />
            </Grid>
          </Grid>
        ))}

        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 4 }}
          label="Remarks (required for On Hold / Reject)"
          value={remarks}
          onChange={(e) => handleRemarksChange(e.target.value)}
        />

        {clientError && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {clientError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)} disabled={isPending}>
          Close
        </Button>
        <LoadingButton
          size="small"
          color="error"
          variant="outlined"
          loading={isPending}
          onClick={() => run('rejected')}
        >
          Reject
        </LoadingButton>
        <LoadingButton
          size="small"
          color="warning"
          variant="outlined"
          loading={isPending}
          onClick={() => run('on hold')}
        >
          On Hold
        </LoadingButton>
        <LoadingButton
          size="small"
          color="success"
          variant="contained"
          loading={isPending}
          onClick={() => run('approved')}
        >
          Approve
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default React.memo(ImprestRetirementApprovalForm);
