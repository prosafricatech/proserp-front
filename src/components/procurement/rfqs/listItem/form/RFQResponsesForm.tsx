'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LoadingButton } from '@mui/lab';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import RFQResponseItemRow from './RFQResponseItemRow';
import { RFQItem } from '../../rfq-types';
import rfqServices from '../../rfq-services';

interface RFQResponsesFormProps {
  toggleOpen: (open: boolean) => void;
  rfqDetails: any;
  rfqId: number;
  subContract?: any;
  preselectedStakeholder?: any;
  onSuccess?: () => void;
}

interface FormValues {
  response_date: dayjs.Dayjs | null;
  validity_date: dayjs.Dayjs | null;
  stakeholder_id?: number;
  currency_id?: number;
  exchange_rate?: number;
  status: string;
  remarks?: string;
}

interface ResponseItem {
  rfq_item_id: number;
  rfq_item?: RFQItem;
  quantity: number;
  rate: number;
  remarks?: string;
  lead_time_days?: number;
  total?: number;
}

interface Stakeholder {
  id: number;
  name: string;
  status?: string;
  sent_at?: string | null;
}

const validationSchema = yup.object({
  response_date: yup.mixed().required('Response date is required').nullable(),
  validity_date: yup.mixed().nullable(),
  stakeholder_id: yup.number().required('Supplier is required').typeError('Supplier is required'),
  currency_id: yup.number().required('Currency is required').typeError('Currency is required'),
  exchange_rate: yup.number().when('currency_id', {
    is: (val: number) => val > 1,
    then: (schema) => schema.required('Exchange rate is required').positive('Exchange rate must be positive'),
    otherwise: (schema) => schema.nullable(),
  }),
});

function RFQResponsesFormContent({ 
  toggleOpen, 
  rfqDetails, 
  rfqId, 
  subContract,
  preselectedStakeholder,
  onSuccess 
}: RFQResponsesFormProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [serverError, setServerError] = useState<string | null>(null);
  const [responseItems, setResponseItems] = useState<ResponseItem[]>([]);

  // Get stakeholders from rfqDetails
  const stakeholders: Stakeholder[] = rfqDetails?.stakeholders || [];

  const {
    handleSubmit,
    setValue,
    watch,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      response_date: dayjs(),
      validity_date: dayjs().add(30, 'day'),
      stakeholder_id: preselectedStakeholder?.id || undefined,
      currency_id: subContract?.currency_id || 1,
      exchange_rate: subContract?.exchange_rate || 1,
      remarks: '',
    },
  });

  // Initialize response items from RFQ items
  useEffect(() => {
    if (rfqDetails?.items?.length) {
      const items = rfqDetails.items.map((item: any) => ({
        rfq_item_id: item.id,
        rfq_item: item,
        quantity: item.quantity || 0,
        rate: 0,
        remarks: item?.remarks,
        lead_time_days: undefined,
        total: 0,
      }));
      setResponseItems(items);
    }
  }, [rfqDetails]);

  // Set stakeholder if preselected
  useEffect(() => {
    if (preselectedStakeholder?.id) {
      setValue('stakeholder_id', preselectedStakeholder.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [preselectedStakeholder, setValue]);

  const addMutation = useMutation({
    mutationFn: (payload: any) => rfqServices.addResponse(rfqId, payload),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'RFQ response saved successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfqDetails', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toggleOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setServerError(error?.response?.data?.message || 'Please check the information you submitted');
      enqueueSnackbar(error?.response?.data?.message || 'Please check the information you submitted', {
        variant: 'error',
      });
    },
  });

  const updateItem = (index: number, field: keyof ResponseItem, value: any) => {
    setResponseItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      
      // Calculate total if quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        const quantity = Number(next[index].quantity) || 0;
        const rate = Number(next[index].rate) || 0;
        next[index].total = quantity * rate;
      }
      
      return next;
    });
  };

  const handleSave = handleSubmit((formData) => {
    const payload = {
      rfq_id: rfqId,
      response_date: formData.response_date?.toISOString(),
      validity_date: formData.validity_date?.toISOString(),
      stakeholder_id: formData.stakeholder_id,
      currency_id: formData.currency_id,
      exchange_rate: formData.exchange_rate || 1,
      status: formData.status || 'pending',
      remarks: formData.remarks,
      items: responseItems.map((item) => ({
        rfq_item_id: item.rfq_item_id,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        remarks: item.remarks || '',
        lead_time_days: item.lead_time_days ? Number(item.lead_time_days) : undefined,
      })),
    };

    addMutation.mutate(payload as any);
  });

  const loading = addMutation.isPending;

  // Watch currency_id with null check
  const watchedCurrencyId = watch('currency_id') || 0;
  const isPreselected = !!preselectedStakeholder?.id;

  return (
    <>
      <Grid container columnSpacing={1} rowSpacing={1} paddingTop={1}>
        {serverError && (
          <Grid size={12}>
            <Alert severity="error">{serverError}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Response Date"
              value={watch('response_date')}
              onChange={(newValue) => setValue('response_date', newValue, { shouldDirty: true, shouldValidate: true })}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!errors.response_date,
                  helperText: errors.response_date?.message,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Validity Date"
              value={watch('validity_date')}
              minDate={watch('response_date') || dayjs()}
              onChange={(newValue) => setValue('validity_date', newValue, { shouldDirty: true, shouldValidate: true })}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!errors.validity_date,
                  helperText: errors.validity_date?.message,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Controller
            name="stakeholder_id"
            control={control}
            render={({ field, fieldState }) => (
              <FormControl fullWidth size="small" error={!!fieldState.error}>
                <InputLabel>Supplier</InputLabel>
                <Select
                  {...field}
                  label="Supplier"
                  value={field.value || ''}
                  disabled={isPreselected}
                  onChange={(e) => {
                    const value = e.target.value as number;
                    field.onChange(value);
                    clearErrors('stakeholder_id');
                  }}
                >
                  {stakeholders.length === 0 ? (
                    <MenuItem value="" disabled>
                      No suppliers available
                    </MenuItem>
                  ) : (
                    stakeholders.map((stakeholder) => (
                      <MenuItem key={stakeholder.id} value={stakeholder.id}>
                        {stakeholder.name}
                        {stakeholder.status && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ ml: 1, color: 'text.secondary' }}
                          >
                            ({stakeholder.status})
                          </Typography>
                        )}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {fieldState.error && (
                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <CurrencySelector
            frontError={errors?.currency_id}
            defaultValue={subContract?.currency_id || 1}
            onChange={(newValue) => {
              setValue('currency_id', newValue ? newValue.id : undefined, {
                shouldDirty: true,
                shouldValidate: true,
              });
              clearErrors('exchange_rate');
              setValue('exchange_rate', newValue?.exchangeRate ? newValue.exchangeRate : 1);
            }}
          />
        </Grid>

        {watchedCurrencyId > 1 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Exchange Rate"
              fullWidth
              size="small"
              InputProps={{
                inputComponent: CommaSeparatedField,
              }}
              value={watch('exchange_rate') || ''}
              error={!!errors.exchange_rate}
              helperText={errors.exchange_rate?.message}
              onChange={(e) => {
                setValue('exchange_rate', e.target.value ? sanitizedNumber(e.target.value) : undefined, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </Grid>
        )}

        <Grid size={{ xs: 12, md: watchedCurrencyId > 1 ? 4 : 8 }}>
          <TextField
            label="Remarks"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={watch('remarks') || ''}
            error={!!errors.remarks}
            helperText={errors.remarks?.message}
            onChange={(e) => setValue('remarks', e.target.value, { shouldDirty: true, shouldValidate: true })}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        <Grid size={12}>
            <Typography variant="h4" gutterBottom>
                RFQ Response Items
            </Typography>
        </Grid>

        {responseItems.map((item, index) => (
          <RFQResponseItemRow
            key={item.rfq_item_id || index}
            index={index}
            item={item}
            onUpdate={updateItem as any}
          />
        ))}
      </Grid>

      <Grid container justifyContent="space-between" mt={2}>
        <Grid size={12} display="flex" justifyContent="flex-end" gap={1} mt={1}>
          <Button size="small" onClick={() => toggleOpen(false)}>
            Cancel
          </Button>
          <LoadingButton loading={loading} size="small" variant="contained" onClick={handleSave}>
            Submit
          </LoadingButton>
        </Grid>
      </Grid>
    </>
  );
}

function RFQResponsesForm({ 
  toggleOpen, 
  rfqDetails, 
  rfqId, 
  subContract,
  preselectedStakeholder,
  onSuccess 
}: RFQResponsesFormProps) {
  return (
    <>
      <DialogTitle textAlign="center">
        {preselectedStakeholder?.name 
          ? `New RFQ Response - ${preselectedStakeholder.name}`
          : 'New RFQ Response'
        }
      </DialogTitle>
      <DialogContent>
        <RFQResponsesFormContent 
          toggleOpen={toggleOpen} 
          rfqDetails={rfqDetails} 
          rfqId={rfqId} 
          subContract={subContract}
          preselectedStakeholder={preselectedStakeholder}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </>
  );
}

export default RFQResponsesForm;