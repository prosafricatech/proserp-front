import React from 'react';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import MeasurementSelector from '@/components/masters/measurementUnits/MeasurementSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import userLedgerServices from '@/components/accounts/ledgers/user-ledger-services';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';

type RetirementItem = {
  id?: number;
  imprest_retirement_item_id?: number;
  ledger_id: number | null;
  measurement_unit_id: number | null;
  quantity: number;
  rate: number;
  amount?: number;
  description: string;
  ledger?: {
    id: number;
    name: string;
  };
  measurement_unit?: {
    id: number;
    name?: string;
    alias?: string;
    symbol?: string;
  };
};

type ImprestRetirementFormProps = {
  toggleOpen: (open: boolean) => void;
  approvedRequisition: any;
  approvedDetails?: any;
  existingRetirementDetails?: any;
  preferredRetirementId?: number | null;
  startNew?: boolean;
};

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const extractOne = (payload: any): any | null => {
  if (!payload) return null;
  if (payload?.id) return payload;
  if (payload?.data?.id) return payload.data;
  if (payload?.data?.data?.id) return payload.data.data;
  return null;
};

const EMPTY_ITEM: RetirementItem = {
  ledger_id: null,
  measurement_unit_id: null,
  quantity: 1,
  rate: 0,
  description: '',
};

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <Div
      sx={(theme) => ({
        border: 1,
        borderColor:
          theme.type === 'dark' ? 'rgba(255,255,255,0.2)' : 'divider',
        borderRadius: 1,
        px: 1.25,
        py: 1,
        height: '100%',
        bgcolor:
          theme.type === 'dark' ? 'rgba(255,255,255,0.06)' : 'grey.50',
        boxShadow:
          theme.type === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.08)'
            : 'none',
      })}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 0.5, opacity: 0.95 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {value || '-'}
      </Typography>
    </Div>
  );
};

function ImprestRetirementForm({
  toggleOpen,
  approvedRequisition,
  approvedDetails,
  existingRetirementDetails,
  preferredRetirementId = null,
  startNew = false,
}: ImprestRetirementFormProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [retirementId, setRetirementId] = React.useState<number | null>(null);
  const [statusLabel, setStatusLabel] = React.useState<string>('Draft');
  const [ledgerId, setLedgerId] = React.useState<number | null>(null);
  const [retirementDate, setRetirementDate] = React.useState<Dayjs | null>(dayjs());
  const [remarks, setRemarks] = React.useState('');
  const [items, setItems] = React.useState<RetirementItem[]>([{ ...EMPTY_ITEM }]);
  const [clientError, setClientError] = React.useState<string | null>(null);

  const { data: myLedgersResponse } = useQuery({
    queryKey: ['my-ledgers'],
    queryFn: userLedgerServices.getMyLedgers,
  });

  const {
    data: existingRetirementsResponse,
    isFetching: isFetchingExisting,
  } = useQuery({
    queryKey: ['imprestRetirements', { requisition_approval_id: approvedDetails?.id }],
    queryFn: () =>
      imprestRetirementServices.list({
        requisition_approval_id: approvedDetails?.id,
        limit: 20,
      }),
    enabled: !!approvedDetails?.id && !existingRetirementDetails && !startNew,
  });

  const existingRetirementFromShow = React.useMemo(
    () => extractOne(existingRetirementDetails),
    [existingRetirementDetails]
  );

  const myImprestLedgers = React.useMemo(() => {
    return extractList(myLedgersResponse)
      .filter((entry: any) => String(entry?.type || '').toLowerCase() === 'imprest')
      .map((entry: any) => ({
        id: Number(entry?.ledger_id || entry?.ledger?.id),
        name: entry?.ledger?.name || `Ledger #${entry?.ledger_id}`,
      }))
      .filter((entry: any) => Number.isFinite(entry.id));
  }, [myLedgersResponse]);

  const existingRetirement = React.useMemo(() => {
    if (startNew) return null;

    if (existingRetirementFromShow?.id) {
      return existingRetirementFromShow;
    }

    const list = extractList(existingRetirementsResponse);
    if (list.length === 0) return null;

    if (preferredRetirementId) {
      const preferredRetirement = list.find((ret: any) => Number(ret?.id) === Number(preferredRetirementId));
      if (preferredRetirement) return preferredRetirement;
    }

    const editable = list.find((ret: any) => {
      const raw = String(ret?.status || ret?.status_label || '').toLowerCase();
      return raw.includes('draft') || raw.includes('suspended') || raw.includes('reject');
    });

    return editable || list[0];
  }, [startNew, existingRetirementFromShow, existingRetirementsResponse, preferredRetirementId]);

  const retirementDisplayNo =
    existingRetirementFromShow?.retirementNo ||
    existingRetirement?.retirementNo ||
    (preferredRetirementId ? `#${preferredRetirementId}` : '');

  React.useEffect(() => {
    if (!existingRetirement) return;

    setRetirementId(existingRetirement.id);
    setStatusLabel(existingRetirement.status_label || existingRetirement.status || 'Draft');
    setLedgerId(Number(existingRetirement.ledger_id || existingRetirement.ledger?.id) || null);
    setRetirementDate(
      existingRetirement.retirement_date
        ? dayjs(existingRetirement.retirement_date)
        : dayjs()
    );
    setRemarks(existingRetirement.remarks || '');

    const sourceItems = extractList(existingRetirement.items);

    const normalizedItems = sourceItems.map((item: any) => ({
      id: item.id,
      imprest_retirement_item_id:
        Number(item?.imprest_retirement_item_id || item?.id || 0) || undefined,
      ledger_id: Number(item.ledger_id || item.ledger?.id) || null,
      measurement_unit_id:
        Number(item.measurement_unit_id || item.measurement_unit?.id) || null,
      quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1,
      rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0,
      amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : undefined,
      description: item.description || item.remarks || '',
      ledger: item.ledger,
      measurement_unit: item.measurement_unit,
    }));

    setItems(normalizedItems.length > 0 ? normalizedItems : [{ ...EMPTY_ITEM }]);
  }, [existingRetirement]);

  React.useEffect(() => {
    if (ledgerId) return;

    const approvedLedgerId = Number(
      approvedDetails?.imprest_ledger?.id || approvedDetails?.ledger_id || 0
    );

    if (approvedLedgerId) {
      setLedgerId(approvedLedgerId);
      return;
    }

    if (myImprestLedgers.length > 0) {
      setLedgerId(myImprestLedgers[0].id);
    }
  }, [ledgerId, approvedDetails, myImprestLedgers]);

  const totalAmount = React.useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;
      const rate = Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0;
      return sum + qty * rate;
    }, 0);
  }, [items]);

  const ceilingAmount = Number(approvedDetails?.amount || approvedRequisition?.amount || 0);
  const currencyCode = String(
    existingRetirementFromShow?.currency?.code ||
    existingRetirementFromShow?.currency_code ||
    existingRetirementFromShow?.imprest_approval?.requisition?.currency?.code ||
    approvedRequisition?.requisition?.currency?.code ||
    'TZS'
  ).trim() || 'TZS';
  const approvedAmountDisplay = ceilingAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
  });
  const totalItemsAmountDisplay = (Number.isFinite(totalAmount) ? totalAmount : 0).toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
  });

  const statusRaw = String(statusLabel || '').toLowerCase();
  const approvalStatusRaw = String(
    existingRetirementFromShow?.latest_approval?.status ||
      existingRetirement?.latest_approval?.status ||
      existingRetirementFromShow?.approval?.status ||
      existingRetirement?.approval?.status ||
      ''
  ).toLowerCase();
  const isOnHoldStatus =
    approvalStatusRaw === 'on hold' || statusRaw.includes('on hold');
  const isRejectedStatus =
    approvalStatusRaw.includes('reject') || statusRaw.includes('reject');
  const isApprovedStatus =
    approvalStatusRaw === 'approved' || statusRaw.includes('approved');
  const isPendingStatus =
    approvalStatusRaw === 'pending' ||
    (statusRaw.includes('submitted') && !isOnHoldStatus && !isRejectedStatus && !isApprovedStatus);
  const isLocked = false;
  const canSubmitForApproval = !isApprovedStatus && !isPendingStatus;
  const requisitionApprovalId =
    existingRetirementFromShow?.requisition_approval_id ||
    existingRetirement?.requisition_approval_id ||
    existingRetirementFromShow?.imprest_approval?.id ||
    existingRetirement?.imprest_approval?.id ||
    approvedDetails?.id ||
    approvedRequisition?.id ||
    null;
  const selectedLedgerName =
    myImprestLedgers.find((option) => option.id === ledgerId)?.name ||
    existingRetirement?.ledger?.name ||
    (ledgerId ? `Ledger #${ledgerId}` : '-');
  const paidThroughLabel = selectedLedgerName && selectedLedgerName !== '-'
    ? selectedLedgerName
    : (existingRetirementFromShow?.ledger?.name || '-');
  const formattedRetirementDate = retirementDate ? retirementDate.format('DD/MM/YYYY') : '-';

  const resolveRetirementIdFromResponse = React.useCallback(
    async (response: any): Promise<number | null> => {
      const directId = Number(
        response?.id ||
          response?.data?.id ||
          response?.retirement?.id ||
          response?.data?.retirement?.id ||
          response?.imprest_retirement?.id ||
          response?.data?.imprest_retirement?.id ||
          0
      );

      if (directId) return directId;

      const message = String(response?.message || '');
      const match = message.match(/IR\/\d+/i);
      if (!match?.[0] || !requisitionApprovalId) return null;

      const listResponse = await imprestRetirementServices.list({
        requisition_approval_id: requisitionApprovalId,
        limit: 100,
      });

      const found = extractList(listResponse).find(
        (entry: any) => String(entry?.retirementNo || '').toUpperCase() === match[0].toUpperCase()
      );

      return Number(found?.id || 0) || null;
    },
    [requisitionApprovalId]
  );

  const addRetirement = useMutation({
    mutationFn: imprestRetirementServices.add,
    onSuccess: async (response: any) => {
      enqueueSnackbar(response?.message || 'Imprest retirement draft created', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      const createdId = await resolveRetirementIdFromResponse(response);
      if (createdId) {
        setRetirementId(createdId);
      } else {
        enqueueSnackbar('Draft saved. Reopen the form if attachments do not appear yet.', {
          variant: 'info',
        });
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to create retirement draft', {
        variant: 'error',
      });
    },
  });

  const updateRetirement = useMutation({
    mutationFn: imprestRetirementServices.update,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Imprest retirement draft updated', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update retirement draft', {
        variant: 'error',
      });
    },
  });

  const submitRetirement = useMutation({
    mutationFn: imprestRetirementServices.submit,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Imprest retirement submitted for approval', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to submit retirement', {
        variant: 'error',
      });
    },
  });

  const updateItem = (index: number, patch: Partial<RetirementItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const appendItem = () => {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  };

  const validateBeforeSave = () => {
    if (!requisitionApprovalId) {
      setClientError('Requisition approval reference is missing. Please reopen the form and try again.');
      return false;
    }

    if (!ledgerId) {
      setClientError('Imprest ledger is required.');
      return false;
    }

    if (!retirementDate) {
      setClientError('Retirement date is required.');
      return false;
    }

    if (items.length < 1) {
      setClientError('At least one retirement item is required.');
      return false;
    }

    const hasInvalidItem = items.some((item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);
      return (
        !item.ledger_id ||
        !item.measurement_unit_id ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(rate) ||
        rate <= 0
      );
    });

    if (hasInvalidItem) {
      setClientError('Each item requires ledger, measurement unit, quantity > 0 and rate > 0.');
      return false;
    }

    setClientError(null);
    return true;
  };

  const buildPayload = () => ({
    requisition_approval_id: requisitionApprovalId,
    ledger_id: ledgerId,
    retirement_date: retirementDate ? retirementDate.format('YYYY-MM-DD') : null,
    remarks,
    items: items.map((item) => ({
      ledger_id: item.ledger_id,
      measurement_unit_id: item.measurement_unit_id,
      quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0,
      rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0,
      description: item.description || '',
    })),
  });

  const handleSaveDraft = async () => {
    if (!validateBeforeSave()) return;

    const payload = buildPayload();

    if (retirementId) {
      await updateRetirement.mutateAsync({ id: retirementId, ...payload });
      return;
    }

    await addRetirement.mutateAsync(payload);
  };

  const handleSubmitForApproval = async () => {
    if (!retirementId) {
      return;
    }

    await submitRetirement.mutateAsync(retirementId);
  };

  if (isFetchingExisting) {
    return <DialogContent>Loading retirement draft...</DialogContent>;
  }

  return (
    <>
      <DialogTitle textAlign="center">
        {retirementId ? `Update ${retirementDisplayNo}` : 'Imprest Retirement Form'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1.5} marginBottom={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Chip size="small" color="primary" label={`Status: ${statusLabel}`} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <Div sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
              <Div
                sx={(theme) => ({
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: theme.type === 'dark' ? 'rgba(46, 204, 113, 0.45)' : 'success.light',
                  bgcolor: theme.type === 'dark' ? 'rgba(46, 204, 113, 0.12)' : 'rgba(46, 204, 113, 0.1)',
                })}
              >
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  Approved Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {approvedAmountDisplay}
                </Typography>
              </Div>
              <Div
                sx={(theme) => ({
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: theme.type === 'dark' ? 'rgba(33, 150, 243, 0.45)' : 'info.light',
                  bgcolor: theme.type === 'dark' ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.08)',
                })}
              >
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                  Total Items Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {totalItemsAmountDisplay}
                </Typography>
              </Div>
            </Div>
          </Grid>
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={myImprestLedgers}
                disabled={isLocked}
                getOptionLabel={(option) => option.name}
                value={myImprestLedgers.find((option) => option.id === ledgerId) || null}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_e, newValue) => {
                  setLedgerId(newValue?.id || null);
                }}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Imprest Ledger" fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DatePicker
                label="Retirement Date"
                disabled={isLocked}
                value={retirementDate}
                onChange={(value: Dayjs | null) => setRetirementDate(value)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                size="small"
                fullWidth
                label="Reference Requisition"
                disabled
                value={approvedRequisition?.requisition?.requisitionNo || ''}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                disabled={isLocked}
                label="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Grid>
          </>
        </Grid>

        <Divider sx={{ mb: 1.5 }} />

        {items.map((item, index) => (
          <Grid container spacing={1} alignItems="center" key={`${item.id || 'new'}-${index}`} mb={1}>
            <Grid size={{ xs: 1, md: 0.5 }}>
              <Typography variant="body2">{index + 1}.</Typography>
            </Grid>
            {isLocked ? (
              <>
                <Grid size={{ xs: 12, md: 4.5 }}>
                  <ReadOnlyField
                    label="Paid Through (Item Ledger)"
                    value={`${paidThroughLabel} (${item.ledger?.name || (item.ledger_id ? `Ledger #${item.ledger_id}` : '-')})`}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <ReadOnlyField
                    label="Unit"
                    value={item.measurement_unit?.alias || item.measurement_unit?.symbol || item.measurement_unit?.name || '-'}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 1.5 }}>
                  <ReadOnlyField
                    label="Qty"
                    value={Number(item.quantity || 0).toLocaleString('en-US', {
                      maximumFractionDigits: 4,
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2.5 }}>
                  <ReadOnlyField
                    label="Rate"
                    value={(Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0).toLocaleString(
                      'en-US',
                      {
                        style: 'currency',
                        currency: currencyCode,
                      }
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 1.5 }}>
                  <ReadOnlyField
                    label="Amount"
                    value={(
                      (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0) *
                      (Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0)
                    ).toLocaleString('en-US', {
                      style: 'currency',
                      currency: currencyCode,
                    })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ReadOnlyField label="Description" value={item.description || '-'} />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 11, md: 3.5 }}>
                  <LedgerSelect
                    label={`Item Ledger (Paid via ${paidThroughLabel})`}
                    defaultValue={item.ledger_id ? ({ id: item.ledger_id, name: item.ledger?.name || '' } as any) : null}
                    onChange={(newValue: any) => {
                      const singleValue = Array.isArray(newValue) ? newValue[0] : newValue;
                      updateItem(index, {
                        ledger_id: Number(singleValue?.id || 0) || null,
                        ledger: singleValue,
                      });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <MeasurementSelector
                    label="Unit"
                    defaultValue={item.measurement_unit_id || null}
                    onChange={(newValue: any) => {
                      const selected = Array.isArray(newValue) ? newValue[0] : newValue;
                      updateItem(index, {
                        measurement_unit_id: Number(selected?.id || 0) || null,
                        measurement_unit: selected,
                      });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 1.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    disabled={isLocked}
                    label="Qty"
                    value={item.quantity ?? 0}
                    InputProps={{ inputComponent: CommaSeparatedField as any }}
                    onChange={(e) => {
                      const quantity = sanitizedNumber(e.target.value);
                      updateItem(index, { quantity: Number.isFinite(quantity) ? quantity : 0 });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    disabled={isLocked}
                    label="Rate"
                    value={item.rate ?? 0}
                    InputProps={{ inputComponent: CommaSeparatedField as any }}
                    onChange={(e) => {
                      const rate = sanitizedNumber(e.target.value);
                      updateItem(index, { rate: Number.isFinite(rate) ? rate : 0 });
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: items.length > 1 ? 1.5 : 2 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Amount"
                    value={(
                      (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0) *
                      (Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0)
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: items.length > 1 ? 11.5 : 12 }}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    disabled={isLocked}
                    label="Description"
                    value={item.description || ''}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 0.5 }} textAlign="right">
                  {!isLocked && items.length > 1 && (
                    <Tooltip title="Remove Item">
                      <IconButton size="small" onClick={() => removeItem(index)}>
                        <DisabledByDefault fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        ))}

        {!isLocked && (
          <Div sx={{ textAlign: 'right', mb: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddOutlined />}
              onClick={appendItem}
            >
              Add Item
            </Button>
          </Div>
        )}

        {clientError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {clientError}
          </Alert>
        )}

        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" mb={1}>
            Receipts / Supporting Documents
          </Typography>

          {!retirementId && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              Save first to upload supporting documents.
            </Alert>
          )}

          {retirementId && (
            <AttachmentForm
              hideFeatures
              readOnly={isLocked}
              attachmentable_id={retirementId}
              attachmentable_type="imprest_retirement"
              attachment_name="imprest retirement"
              attachment_sourceNo={approvedRequisition?.requisition?.requisitionNo || ''}
            />
          )}
        </>
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        {!isLocked && (
          <LoadingButton
            size="small"
            variant="contained"
            onClick={handleSaveDraft}
            loading={addRetirement.isPending || updateRetirement.isPending}
          >
            {retirementId ? 'Update' : 'Save Draft'}
          </LoadingButton>
        )}
        {canSubmitForApproval && (
          <LoadingButton
            size="small"
            color="success"
            variant="contained"
            onClick={handleSubmitForApproval}
            loading={submitRetirement.isPending}
            disabled={!retirementId}
          >
            Submit
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
}

export default React.memo(ImprestRetirementForm);
