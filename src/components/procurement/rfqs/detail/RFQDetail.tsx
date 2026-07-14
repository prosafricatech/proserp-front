'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DeleteOutlined, EditOutlined, ReplyOutlined, ArrowBackOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import rfqServices from '../rfq-services';
import { RFQ, RFQComparison } from '../rfq-types';
import RFQDialogForm from '../form/RFQDialogForm';
import purchaseServices from '@/components/procurement/purchases/purchase-services';

interface RFQDetailProps {
  rfqId: string;
}

interface ResponseFormValues {
  currency_id: number;
  exchange_rate: number;
  response_date: string;
  validity_date: string;
  remarks?: string;
}

const responseValidationSchema = yup.object({
  currency_id: yup.number().required('Currency is required').typeError('Currency is required'),
  exchange_rate: yup.number().required('Exchange rate is required').positive('Exchange rate is required').typeError('Exchange rate is required'),
  response_date: yup.string().required('Response date is required'),
  validity_date: yup.string().required('Validity date is required'),
  remarks: yup.string().nullable(),
});

function RFQResponseDialog({
  open,
  rfq,
  stakeholder,
  onClose,
  onSaved,
}: {
  open: boolean;
  rfq: RFQ;
  stakeholder: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [serverError, setServerError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>(
    (rfq.items || []).map((item: any) => ({
      rfq_item_id: item.id,
      quantity: item.quantity || 0,
      rate: '',
      vat_percentage: 0,
      lead_time_days: '',
      remarks: '',
    }))
  );

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<ResponseFormValues>({
    resolver: yupResolver(responseValidationSchema) as any,
    defaultValues: {
      currency_id: 1,
      exchange_rate: 1,
      response_date: dayjs().toISOString(),
      validity_date: dayjs().add(30, 'day').toISOString(),
      remarks: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: any) => rfqServices.addResponse(rfq.id, payload),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'Supplier response saved', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfq', rfq.id] });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfq.id] });
      onSaved();
    },
    onError: (error: any) => {
      setServerError(error?.response?.data?.message || 'Please check the information you submitted');
      enqueueSnackbar(error?.response?.data?.message || 'Please check the information you submitted', { variant: 'error' });
    },
  });

  const updateItem = (index: number, key: string, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSave = handleSubmit((formData) => {
    if (!items.length) {
      enqueueSnackbar('Add at least one quote item', { variant: 'error' });
      return;
    }

    const payload = {
      stakeholder_id: stakeholder.id,
      ...formData,
      items: items.map((item) => ({
        rfq_item_id: item.rfq_item_id,
        quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0,
        rate: Number.isFinite(Number(item.rate)) ? Number(item.rate) : 0,
        vat_percentage: Number.isFinite(Number(item.vat_percentage)) ? Number(item.vat_percentage) : 0,
        lead_time_days: item.lead_time_days === '' ? null : Number(item.lead_time_days),
        remarks: item.remarks,
      })),
    };

    mutation.mutate(payload);
  });

  return (
    <Dialog open={open} fullWidth maxWidth="xl" onClose={onClose}>
      <DialogTitle textAlign="center">Record Response - {stakeholder?.name}</DialogTitle>
      <DialogContent>
        <Grid container columnSpacing={1} rowSpacing={1}>
          {serverError && (
            <Grid size={12}>
              <Alert severity="error">{serverError}</Alert>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 3 }}>
            <CurrencySelector
              defaultValue={watch('currency_id')}
              onChange={(newValue) => {
                setValue('currency_id', newValue?.id || 1, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Exchange Rate"
              fullWidth
              size="small"
              value={watch('exchange_rate') ?? ''}
              InputProps={{ inputComponent: CommaSeparatedField as any }}
              onChange={(e) => {
                const value = e.target.value ? sanitizedNumber(e.target.value) : '';
                setValue('exchange_rate', Number.isFinite(value) ? value : 0, { shouldDirty: true, shouldValidate: true });
              }}
              error={!!errors.exchange_rate}
              helperText={errors.exchange_rate?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Response Date"
              type="datetime-local"
              fullWidth
              size="small"
              value={watch('response_date') ? dayjs(watch('response_date')).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) => setValue('response_date', dayjs(e.target.value).toISOString(), { shouldDirty: true, shouldValidate: true })}
              error={!!errors.response_date}
              helperText={errors.response_date?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              label="Validity Date"
              type="datetime-local"
              fullWidth
              size="small"
              value={watch('validity_date') ? dayjs(watch('validity_date')).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(e) => setValue('validity_date', dayjs(e.target.value).toISOString(), { shouldDirty: true, shouldValidate: true })}
              error={!!errors.validity_date}
              helperText={errors.validity_date?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Remarks"
              fullWidth
              size="small"
              value={watch('remarks') || ''}
              onChange={(e) => setValue('remarks', e.target.value, { shouldDirty: true, shouldValidate: true })}
            />
          </Grid>
          <Grid size={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          <Grid size={12}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Requested Qty</TableCell>
                  <TableCell align="right">Quoted Qty</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">VAT %</TableCell>
                  <TableCell align="right">Lead Time (days)</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.rfq_item_id || index}>
                    <TableCell>{rfq.items?.[index]?.product?.item_name || rfq.items?.[index]?.product?.name || `Item ${index + 1}`}</TableCell>
                    <TableCell align="right">{rfq.items?.[index]?.quantity}</TableCell>
                    <TableCell align="right">
                      <TextField size="small" value={item.quantity ?? ''} onChange={(e) => updateItem(index, 'quantity', e.target.value ? sanitizedNumber(e.target.value) : '')} InputProps={{ inputComponent: CommaSeparatedField as any }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" value={item.rate ?? ''} onChange={(e) => updateItem(index, 'rate', e.target.value ? sanitizedNumber(e.target.value) : '')} InputProps={{ inputComponent: CommaSeparatedField as any }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" value={item.vat_percentage ?? ''} onChange={(e) => updateItem(index, 'vat_percentage', e.target.value ? sanitizedNumber(e.target.value) : '')} InputProps={{ inputComponent: CommaSeparatedField as any }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" value={item.lead_time_days ?? ''} onChange={(e) => updateItem(index, 'lead_time_days', e.target.value ? sanitizedNumber(e.target.value) : '')} InputProps={{ inputComponent: CommaSeparatedField as any }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" fullWidth value={item.remarks || ''} onChange={(e) => updateItem(index, 'remarks', e.target.value)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton loading={mutation.isPending} variant="contained" onClick={handleSave}>Save Response</LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

function RFQDetail({ rfqId }: RFQDetailProps) {
  const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [openEdit, setOpenEdit] = useState(false);
  const [responseDialog, setResponseDialog] = useState<{ open: boolean; stakeholder: any | null }>({ open: false, stakeholder: null });
  const [selectedQuoteByItem, setSelectedQuoteByItem] = useState<Record<number, any>>({});

  const { data: rfq, isLoading } = useQuery<RFQ>({
    queryKey: ['rfq', rfqId],
    queryFn: () => rfqServices.getOne(rfqId),
    enabled: !!rfqId,
  });

  const { data: comparison } = useQuery<RFQComparison>({
    queryKey: ['rfqComparison', rfqId],
    queryFn: () => rfqServices.getComparison(rfqId),
    enabled: !!rfqId,
  });

  const deleteMutation = useMutation({
    mutationFn: rfqServices.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      router.push('/en-US/procurement/rfqs');
    },
  });

  const awardMutation = useMutation({
    mutationFn: async () => {
      const grouped = Object.entries(selectedQuoteByItem).reduce((acc: any[], [itemId, quote]: any) => {
        const comparisonItem = comparison?.items?.find((item) => String(item.id) === String(itemId));
        if (!comparisonItem) return acc;

        const key = quote.stakeholder.id;
        const rfqResponse = rfq?.responses?.find(
          (response: any) => Number(response?.stakeholder?.id) === Number(quote.stakeholder.id)
        );
        const existing = acc.find((group) => group.stakeholder_id === key);
        const poItem = {
          rfq_response_item_id: quote.id,
          product_id: comparisonItem.product?.id,
          measurement_unit_id: comparisonItem.measurement_unit?.id,
          quantity: quote.quantity,
          rate: quote.rate,
          vat_percentage: quote.vat_percentage || 0,
        };
        if (existing) {
          existing.items.push(poItem);
        } else {
          acc.push({
            stakeholder_id: key,
            currency_id: rfqResponse?.currency?.id || 1,
            exchange_rate: rfqResponse?.exchange_rate || 1,
            rfq_id: Number(rfqId),
            order_date: dayjs().toISOString(),
            items: [poItem],
          });
        }
        return acc;
      }, []);

      for (const group of grouped) {
        await purchaseServices.add(group);
      }
      return grouped;
    },
    onSuccess: () => {
      enqueueSnackbar('Purchase orders created from selected RFQ quotes', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Unable to award selected quotes', { variant: 'error' });
    },
  });

  const responseSuccess = () => {
    setResponseDialog({ open: false, stakeholder: null });
    queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
    queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
  };

  const selectedCount = Object.keys(selectedQuoteByItem).length;

  if (!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
    return <UnsubscribedAccess modules={'Procurement & Supply'} />;
  }

  if (!checkOrganizationPermission([PERMISSIONS.RFQS_READ, PERMISSIONS.RFQS_EDIT])) {
    return <UnauthorizedAccess />;
  }

  return (
    <CurrencySelectProvider>
      <Grid container spacing={1}>
        <Grid size={12} display="flex" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={() => router.push('/en-US/procurement/rfqs')}>
              <ArrowBackOutlined />
            </IconButton>
            <Typography variant="h4">{rfq?.rfqNo || 'RFQ Details'}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            {checkOrganizationPermission(PERMISSIONS.RFQS_EDIT) && (
              <Button variant="outlined" startIcon={<EditOutlined />} onClick={() => setOpenEdit(true)}>
                Edit
              </Button>
            )}
            {checkOrganizationPermission(PERMISSIONS.RFQS_DELETE) && (
              <Button color="error" variant="outlined" startIcon={<DeleteOutlined />} onClick={() => deleteMutation.mutate({ id: rfq?.id })}>
                Delete
              </Button>
            )}
          </Stack>
        </Grid>

        {isLoading && (
          <Grid size={12}>
            <Typography>Loading RFQ...</Typography>
          </Grid>
        )}

        {rfq && (
          <Grid size={12}>
            <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
              <Chip label={rfq.status || 'draft'} />
              <Chip label={`Items: ${rfq.items?.length || 0}`} />
              <Chip label={`Responses: ${rfq.responses?.length || 0}`} />
            </Stack>
            <Typography variant="body2">Reference: {rfq.reference || '-'}</Typography>
            <Typography variant="body2">RFQ Date: {readableDate(rfq.rfq_date)}</Typography>
            <Typography variant="body2">Deadline: {readableDate(rfq.response_deadline)}</Typography>
          </Grid>
        )}

        <Grid size={12}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
            <Tab label="Overview" />
            <Tab label="Comparison" />
          </Tabs>
        </Grid>

        {activeTab === 0 && rfq && (
          <Grid size={12}>
            <Grid container spacing={1}>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>Invited Suppliers</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(rfq.stakeholders || []).map((stakeholder) => (
                    <Chip
                      key={stakeholder.id}
                      label={`${stakeholder.name}${stakeholder.status ? ` · ${stakeholder.status}` : ''}`}
                      onClick={stakeholder.status === 'pending' ? () => setResponseDialog({ open: true, stakeholder }) : undefined}
                      icon={stakeholder.status === 'pending' ? <ReplyOutlined /> : undefined}
                    />
                  ))}
                  {!rfq.stakeholders?.length && <Typography color="text.secondary">No suppliers invited yet</Typography>}
                </Stack>
              </Grid>

              <Grid size={12}>
                <Typography variant="h6" gutterBottom>Items</Typography>
                {rfq.items?.map((item: any, index: number) => (
                  <Typography key={`${item.id || index}`} variant="body2">
                    {index + 1}. {item.product?.item_name || item.product?.name || 'Item'} - {item.quantity} {item.unit_symbol || item.measurement_unit?.symbol || ''}
                  </Typography>
                ))}
              </Grid>

              <Grid size={12}>
                <Typography variant="h6" gutterBottom>Responses</Typography>
                {rfq.responses?.map((response: any) => (
                  <Grid container key={response.id} alignItems="center" spacing={1} mb={1}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography>{response.stakeholder?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {response.currency?.name} · {response.exchange_rate}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2">Response: {readableDate(response.response_date)}</Typography>
                      <Typography variant="body2">Validity: {readableDate(response.validity_date)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} textAlign="right">
                      <Button size="small" color="error" onClick={() => rfqServices.deleteResponse({ id: response.id }).then(() => responseSuccess())}>
                        Delete
                      </Button>
                    </Grid>
                  </Grid>
                ))}
                {!rfq.responses?.length && <Typography color="text.secondary">No responses yet</Typography>}
              </Grid>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && comparison && (
          <Grid size={12}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Selected quotes: {selectedCount}. Group by supplier and create purchase orders when ready.
            </Alert>
            <Divider sx={{ mb: 1 }} />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  {Array.from(new Set((comparison.items || []).flatMap((item) => item.quotes.map((quote) => quote.stakeholder.name)))).map((supplier) => (
                    <TableCell key={supplier}>{supplier}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(comparison.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2">{item.product?.item_name || item.product?.name || 'Item'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.quantity} {item.measurement_unit?.symbol || ''}
                      </Typography>
                    </TableCell>
                    {Array.from(new Set((comparison.items || []).flatMap((row) => row.quotes.map((quote) => quote.stakeholder.name)))).map((supplier) => {
                      const quote = item.quotes.find((quote) => quote.stakeholder.name === supplier);
                      if (!quote) {
                        return <TableCell key={`${item.id}-${supplier}`}>-</TableCell>;
                      }
                      return (
                        <TableCell key={`${item.id}-${supplier}`}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Radio
                              checked={selectedQuoteByItem[item.id]?.id === quote.id}
                              onChange={() => setSelectedQuoteByItem((prev) => ({ ...prev, [item.id]: quote }))}
                            />
                            <Typography variant="body2">{quote.amount?.toLocaleString()}</Typography>
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Stack direction="row" justifyContent="flex-end" mt={2}>
              <LoadingButton variant="contained" loading={awardMutation.isPending} onClick={() => awardMutation.mutate()}>
                Award Selected
              </LoadingButton>
            </Stack>
          </Grid>
        )}
      </Grid>

      {rfq && (
        <Dialog
          fullWidth
          maxWidth="xl"
          fullScreen={belowLargeScreen}
          scroll={belowLargeScreen ? 'body' : 'paper'}
          open={openEdit}
        >
          <RFQDialogForm toggleOpen={setOpenEdit} rfq={rfq} />
        </Dialog>
      )}

      {responseDialog.open && rfq && responseDialog.stakeholder && (
        <RFQResponseDialog
          open={responseDialog.open}
          rfq={rfq}
          stakeholder={responseDialog.stakeholder}
          onClose={() => setResponseDialog({ open: false, stakeholder: null })}
          onSaved={responseSuccess}
        />
      )}
    </CurrencySelectProvider>
  );
}

export default RFQDetail;
