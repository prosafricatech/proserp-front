'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Button,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Box,
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
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import RFQResponseItemRow from './RFQResponseItemRow';
import { RFQItem } from '../../rfq-types';
import rfqServices from '../../rfq-services';
import { Restore } from '@mui/icons-material';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';

interface RFQResponsesFormProps {
  toggleOpen: (open: boolean) => void;
  rfqDetails: any;
  rfqId: number;
  subContract?: any;
  preselectedStakeholder?: any;
  response?: any;
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
  vat_percentage?: number;
  remarks?: string;
  lead_time_days?: number;
  total?: number;
  isRemoved?: boolean;
  uniqueKey: string;
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
  response,
  onSuccess 
}: RFQResponsesFormProps) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [serverError, setServerError] = useState<string | null>(null);
  const [responseItems, setResponseItems] = useState<ResponseItem[]>([]);
  const [removedItems, setRemovedItems] = useState<ResponseItem[]>([]);

  const isEditMode = !!response?.id;

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
      response_date: response?.response_date ? dayjs(response.response_date) : dayjs(),
      status: response?.status || 'sent',
      validity_date: response?.validity_date ? dayjs(response.validity_date) : dayjs().add(30, 'day'),
      stakeholder_id: response?.stakeholder?.id || preselectedStakeholder?.id || undefined,
      currency_id: response?.currency?.id || subContract?.currency_id || 1,
      exchange_rate: response?.exchange_rate || subContract?.exchange_rate || 1,
      remarks: response?.remarks || '',
    },
  });

  // Generate a unique key
  const generateUniqueKey = useCallback((prefix: string, id: number) => {
    return `${prefix}-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize response items — overlay existing quoted values when editing
  useEffect(() => {
    if (rfqDetails?.items?.length) {
      const items = rfqDetails.items.map((item: any) => {
        // Find if this item exists in the response
        const existing = response?.items?.find((ri: any) => ri.rfq_item_id === item.id);
        
        return {
          rfq_item_id: item.id,
          rfq_item: item,
          // If editing, use the response values, otherwise use defaults
          quantity: existing?.quantity ?? (isEditMode ? 0 : (item.quantity || 0)),
          rate: existing?.rate || 0,
          vat_percentage: existing?.vat_percentage || 0,
          remarks: existing?.remarks ?? item?.remarks,
          lead_time_days: existing?.lead_time_days,
          total: existing?.amount || 0,
          isRemoved: false,
          uniqueKey: generateUniqueKey('active', item.id),
        };
      });
      setResponseItems(items);
      setRemovedItems([]);
    }
  }, [rfqDetails, response, generateUniqueKey, isEditMode]);

  // Set stakeholder if preselected or from response
  useEffect(() => {
    if (isEditMode && response?.stakeholder?.id) {
      setValue('stakeholder_id', response.stakeholder.id, { shouldDirty: true, shouldValidate: true });
    } else if (preselectedStakeholder?.id && !isEditMode) {
      setValue('stakeholder_id', preselectedStakeholder.id, { shouldDirty: true, shouldValidate: true });
    }
  }, [preselectedStakeholder, setValue, isEditMode, response]);

  const addMutation = useMutation({
    mutationFn: (payload: any) => rfqServices.addResponse(rfqId, payload),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'RFQ response saved successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfqDetails', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetails'] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      toggleOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setServerError(error?.response?.data?.message || 'Please check the information you submitted');
      enqueueSnackbar(error?.response?.data?.message || 'Please check the information you submitted', { variant: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: rfqServices.updateResponse,
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'RFQ response updated successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rfqDetails', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetails'] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['rfqResponseDetail', response?.id] });
      toggleOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setServerError(error?.response?.data?.message || 'Please check the information you submitted');
      enqueueSnackbar(error?.response?.data?.message || 'Please check the information you submitted', { variant: 'error' });
    },
  });

  // Remove an item from the response (move to removed items)
  const removeItem = (index: number) => {
    // Find the active item at this index
    const activeItems = responseItems.filter(item => !item.isRemoved);
    
    // Ensure at least one item remains in active list
    if (activeItems.length <= 1) {
      enqueueSnackbar('At least one item must remain in the response', { variant: 'warning' });
      return;
    }

    const itemToRemove = activeItems[index];
    if (!itemToRemove) return;

    // Find the actual index in the full responseItems array
    const actualIndex = responseItems.findIndex(item => item.uniqueKey === itemToRemove.uniqueKey);
    if (actualIndex === -1) return;

    // Create removed version with unique key
    const removedItem = {
      ...responseItems[actualIndex],
      isRemoved: true,
      uniqueKey: generateUniqueKey('removed', responseItems[actualIndex].rfq_item_id),
      quantity: 0,
      rate: 0,
      total: 0,
      lead_time_days: undefined,
    };

    // Update responseItems - mark as removed
    setResponseItems((prev) => {
      const next = [...prev];
      next[actualIndex] = {
        ...next[actualIndex],
        isRemoved: true,
        quantity: 0,
        rate: 0,
        total: 0,
        lead_time_days: undefined,
      };
      return next;
    });

    // Add to removedItems
    setRemovedItems((prev) => [...prev, removedItem]);
  };

  // Restore a removed item back to the response
  const restoreItem = (index: number) => {
    const itemToRestore = removedItems[index];
    if (!itemToRestore) return;

    // Find the corresponding item in responseItems
    const existingIndex = responseItems.findIndex(
      item => item.rfq_item_id === itemToRestore.rfq_item_id && item.isRemoved
    );

    if (existingIndex === -1) {
      // If not found, add it back to the list
      const restoredItem = {
        ...itemToRestore,
        isRemoved: false,
        uniqueKey: generateUniqueKey('active', itemToRestore.rfq_item_id),
        quantity: 0,
        rate: 0,
        total: 0,
        lead_time_days: undefined,
      };
      
      // Remove from removedItems
      setRemovedItems((prev) => {
        const next = [...prev];
        next.splice(index, 1);
        return next;
      });

      // Add back to responseItems
      setResponseItems((prev) => [...prev, restoredItem]);
      
      enqueueSnackbar('Item restored successfully', { variant: 'success' });
      return;
    }

    // Restore the existing item
    setResponseItems((prev) => {
      const next = [...prev];
      next[existingIndex] = {
        ...next[existingIndex],
        isRemoved: false,
        uniqueKey: generateUniqueKey('active', itemToRestore.rfq_item_id),
        quantity: 0,
        rate: 0,
        total: 0,
        lead_time_days: undefined,
      };
      return next;
    });

    // Remove from removedItems
    setRemovedItems((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });

    enqueueSnackbar('Item restored successfully', { variant: 'success' });
  };

  // Restore all removed items
  const restoreAllItems = () => {
    if (removedItems.length === 0) return;

    // Process each removed item
    removedItems.forEach((removedItem) => {
      const existingIndex = responseItems.findIndex(
        item => item.rfq_item_id === removedItem.rfq_item_id && item.isRemoved
      );

      if (existingIndex !== -1) {
        // Update existing item
        setResponseItems((prev) => {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            isRemoved: false,
            uniqueKey: generateUniqueKey('active', removedItem.rfq_item_id),
            quantity: 0,
            rate: 0,
            total: 0,
            lead_time_days: undefined,
          };
          return next;
        });
      } else {
        // Add new item
        const restoredItem = {
          ...removedItem,
          isRemoved: false,
          uniqueKey: generateUniqueKey('active', removedItem.rfq_item_id),
          quantity: 0,
          rate: 0,
          total: 0,
          lead_time_days: undefined,
        };
        setResponseItems((prev) => [...prev, restoredItem]);
      }
    });

    // Clear removed items
    setRemovedItems([]);
    enqueueSnackbar(`Restored ${removedItems.length} item(s)`, { variant: 'success' });
  };

  const activeItems = responseItems.filter(item => !item.isRemoved);

  const handleSave = handleSubmit((formData) => {
    const itemsToSend = responseItems
      .filter(item => !item.isRemoved && item.quantity > 0 && item.rate > 0)
      .map((item) => ({
        rfq_item_id: item.rfq_item_id,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        vat_percentage: Number(item.vat_percentage) || 0,
        remarks: item.remarks || '',
        lead_time_days: item.lead_time_days ? Number(item.lead_time_days) : undefined,
      }));

    if (itemsToSend.length === 0) {
      enqueueSnackbar('Please add at least one item with quantity and rate', { variant: 'warning' });
      return;
    }

    const payload = {
      rfq_id: rfqId,
      response_date: formData.response_date?.toISOString(),
      validity_date: formData.validity_date?.toISOString(),
      status: formData.status || 'sent',
      stakeholder_id: formData.stakeholder_id,
      currency_id: formData.currency_id,
      exchange_rate: formData.exchange_rate || 1,
      remarks: formData.remarks,
      items: itemsToSend,
    };

    if (isEditMode) {
      updateMutation.mutate({ id: response.id, ...payload } as any);
    } else {
      addMutation.mutate(payload as any);
    }
  });

  const updateItem = (uniqueKey: string, field: keyof ResponseItem, value: any) => {
    setResponseItems((prev) => {
      const actualIndex = prev.findIndex((item) => item.uniqueKey === uniqueKey);
      if (actualIndex === -1) return prev;

      const next = [...prev];
      const updatedItem = { ...next[actualIndex], [field]: value };
      
      // Calculate total if quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        const quantity = Number(updatedItem.quantity) || 0;
        const rate = Number(updatedItem.rate) || 0;
        updatedItem.total = quantity * rate;
      }
      
      next[actualIndex] = updatedItem;
      return next;
    });
  };

  const loading = addMutation.isPending || updateMutation.isPending;

  // Watch currency_id with null check
  const watchedCurrencyId = watch('currency_id') || 0;

  // Check if any active item has valid quantity and rate
  const hasItemsWithValues = activeItems.some(item => item.quantity > 0 && item.rate > 0);

  // Handle stakeholder selection from StakeholderSelector
  const handleStakeholderChange = (newValue: any) => {
    if (newValue) {
      setValue('stakeholder_id', newValue.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      clearErrors('stakeholder_id');
    } else {
      setValue('stakeholder_id', undefined, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <>
    <StakeholderSelectProvider type='suppliers'>
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
          <StakeholderSelector
            label="Supplier"
            frontError={errors?.stakeholder_id as any}
            defaultValue={isEditMode ? response?.stakeholder?.id : preselectedStakeholder?.id || undefined}
            onChange={handleStakeholderChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <CurrencySelector
            frontError={errors?.currency_id}
            defaultValue={response?.currency?.id || subContract?.currency_id || 1}
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

        <Grid size={12} display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              RFQ Response Items
            </Typography>
          </Box>
        </Grid>

        <Grid size={12}>
          {activeItems.map((item, displayIndex) => (
            <RFQResponseItemRow
              key={item.uniqueKey}
              index={displayIndex}
              item={item}
              onUpdate={(_ignoredIndex: number, field: string, value: any) => updateItem(item.uniqueKey, field as any, value)}
              onRemove={() => removeItem(displayIndex)}
              isLastItem={activeItems.length <= 1}
            />
          ))}
        </Grid>

        {/* Removed Items Section */}
        {removedItems.length > 0 && (
          <Grid size={12}>
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" color="text.secondary">
                  Removed Items ({removedItems.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<Restore />}
                  onClick={restoreAllItems}
                  variant="text"
                >
                  Restore All
                </Button>
              </Box>
              {removedItems.map((item, index) => (
                <Box
                  key={item.uniqueKey}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1,
                    px: 2,
                    mb: 0.5,
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2" color="text.secondary">
                      {index + 1}.
                    </Typography>
                    <Typography variant="body2">
                      {item.rfq_item?.product?.name || item.rfq_item?.product?.item_name || 'Item'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Required: {item.rfq_item?.quantity || 0} {item.rfq_item?.measurement_unit?.symbol || ''}
                    </Typography>
                    <Chip
                      label="Removed"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  </Box>
                  <Tooltip title="Restore this item">
                    <IconButton
                      size="small"
                      onClick={() => restoreItem(index)}
                      color="primary"
                    >
                      <Restore fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Grid>
        )}

        {activeItems.length === 0 && (
          <Grid size={12}>
            <Alert severity="warning" sx={{ mt: 1 }}>
              All items have been removed. Please restore at least one item to submit the response.
            </Alert>
          </Grid>
        )}
      </Grid>

      <Grid container justifyContent="space-between" mt={2}>
        <Grid size={12} display="flex" justifyContent="flex-end" gap={1} mt={1}>
          <Button size="small" onClick={() => toggleOpen(false)}>
            Cancel
          </Button>
          <LoadingButton 
            loading={loading} 
            size="small" 
            variant="contained" 
            onClick={handleSave}
            disabled={!hasItemsWithValues || activeItems.length === 0}
          >
            {isEditMode ? 'Update Response' : 'Submit Response'}
          </LoadingButton>
        </Grid>
      </Grid>
    </StakeholderSelectProvider>

    </>
  );
}

function RFQResponsesForm({ toggleOpen, rfqDetails, rfqId, subContract, preselectedStakeholder, response, onSuccess }: RFQResponsesFormProps) {
  const title = response?.id
    ? `Edit RFQ Response - ${response?.stakeholder?.name || ''}`
    : preselectedStakeholder?.name
    ? `New RFQ Response - ${preselectedStakeholder.name}`
    : 'New RFQ Response';

  return (
    <>
      <DialogTitle textAlign="center">{title}</DialogTitle>
      <DialogContent>
        <RFQResponsesFormContent
          toggleOpen={toggleOpen}
          rfqDetails={rfqDetails}
          rfqId={rfqId}
          subContract={subContract}
          preselectedStakeholder={preselectedStakeholder}
          response={response}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </>
  );
}

export default RFQResponsesForm;