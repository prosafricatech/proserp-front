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
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import userLedgerServices from '@/components/accounts/ledgers/user-ledger-services';
import AttachmentForm from '@/components/filesShelf/attachments/AttachmentForm';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';

type RetirementItem = {
  id?: number;
  ledger_id: number | null;
  amount: number;
  description: string;
  ledger?: {
    id: number;
    name: string;
  };
};

type ImprestRetirementFormProps = {
  toggleOpen: (open: boolean) => void;
  approvedRequisition: any;
  approvedDetails?: any;
  preferredRetirementId?: number | null;
};

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const EMPTY_ITEM: RetirementItem = {
  ledger_id: null,
  amount: 0,
  description: '',
};

function ImprestRetirementForm({
  toggleOpen,
  approvedRequisition,
  approvedDetails,
  preferredRetirementId = null,
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
    enabled: !!approvedDetails?.id,
  });

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
  }, [existingRetirementsResponse, preferredRetirementId]);

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

    const normalizedItems = extractList(existingRetirement.items).map((item: any) => ({
      id: item.id,
      ledger_id: Number(item.ledger_id || item.ledger?.id) || null,
      amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0,
      description: item.description || item.remarks || '',
      ledger: item.ledger,
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

  const totalAmount = React.useMemo(
    () => items.reduce((sum, item) => sum + (Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0), 0),
    [items]
  );

  const ceilingAmount = Number(approvedDetails?.amount || approvedRequisition?.amount || 0);

  const statusRaw = String(statusLabel || '').toLowerCase();
  const isLocked = statusRaw.includes('approved') || statusRaw.includes('pending');

  const addRetirement = useMutation({
    mutationFn: imprestRetirementServices.add,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Imprest retirement draft created', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      const createdId = Number(response?.id || response?.data?.id || 0);
      if (createdId) {
        setRetirementId(createdId);
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
      const amount = Number(item.amount);
      return !item.ledger_id || !Number.isFinite(amount) || amount <= 0;
    });

    if (hasInvalidItem) {
      setClientError('Each item requires an expense ledger and amount greater than 0.');
      return false;
    }

    setClientError(null);
    return true;
  };

  const buildPayload = () => ({
    requisition_approval_id: approvedDetails?.id,
    ledger_id: ledgerId,
    retirement_date: retirementDate ? retirementDate.format('YYYY-MM-DD') : null,
    remarks,
    items: items.map((item) => ({
      ledger_id: item.ledger_id,
      amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : 0,
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
      setClientError('Save draft first before submitting.');
      return;
    }

    await submitRetirement.mutateAsync(retirementId);
  };

  if (isFetchingExisting) {
    return <DialogContent>Loading retirement draft...</DialogContent>;
  }

  return (
    <>
      <DialogTitle textAlign="center">Imprest Retirement Form</DialogTitle>
      <DialogContent>
        <Grid container spacing={1.5} marginBottom={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Chip size="small" color="primary" label={`Status: ${statusLabel || 'Draft'}`} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }} textAlign={{ md: 'right' }}>
            <Typography variant="body2">
              Approved Amount: {ceilingAmount.toLocaleString('en-US')}
            </Typography>
          </Grid>
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
        </Grid>

        <Divider sx={{ mb: 1.5 }} />

        {items.map((item, index) => (
          <Grid container spacing={1} alignItems="center" key={`${item.id || 'new'}-${index}`} mb={1}>
            <Grid size={{ xs: 12, md: 0.5 }}>
              <Typography variant="body2">{index + 1}.</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4.5 }}>
              <LedgerSelect
                label="Expense Ledger"
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
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                size="small"
                fullWidth
                disabled={isLocked}
                label="Amount"
                value={item.amount ?? 0}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e) => {
                  const amount = sanitizedNumber(e.target.value);
                  updateItem(index, { amount: Number.isFinite(amount) ? amount : 0 });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                size="small"
                fullWidth
                disabled={isLocked}
                label="Description"
                value={item.description || ''}
                onChange={(e) => updateItem(index, { description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 0.5 }} textAlign="right">
              {!isLocked && items.length > 1 && (
                <Tooltip title="Remove Item">
                  <IconButton size="small" onClick={() => removeItem(index)}>
                    <DisabledByDefault fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              )}
            </Grid>
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

        <Grid container spacing={1} mb={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Alert severity={totalAmount > ceilingAmount ? 'warning' : 'info'}>
              Total Retired: {Number.isFinite(totalAmount) ? totalAmount.toLocaleString('en-US') : '0'}
            </Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Alert severity="info">
              Retirement can exceed approved amount as per policy.
            </Alert>
          </Grid>
        </Grid>

        {clientError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {clientError}
          </Alert>
        )}

        {retirementId && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" mb={1}>
              Receipts / Supporting Documents
            </Typography>
            <AttachmentForm
              hideFeatures
              attachmentable_id={retirementId}
              attachmentable_type="imprest_retirement"
              attachment_name="imprest retirement"
              attachment_sourceNo={approvedRequisition?.requisition?.requisitionNo || ''}
            />
          </>
        )}
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
            {retirementId ? 'Update Draft' : 'Save Draft'}
          </LoadingButton>
        )}
        {!isLocked && (
          <LoadingButton
            size="small"
            color="success"
            variant="contained"
            onClick={handleSubmitForApproval}
            loading={submitRetirement.isPending}
          >
            Submit
          </LoadingButton>
        )}
      </DialogActions>
    </>
  );
}

export default React.memo(ImprestRetirementForm);
