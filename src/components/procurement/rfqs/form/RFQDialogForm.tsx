'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, DeleteOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Button,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import StakeholderSelectProvider, {
  useStakeholderSelect,
} from '@/components/masters/stakeholders/StakeholderSelectProvider';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { DateTimePicker } from '@mui/x-date-pickers';
import rfqServices from '../rfq-services';
import { RFQ, RFQItem, STATUS_OPTIONS } from '../rfq-types';

interface RFQDialogFormProps {
  toggleOpen: (open: boolean) => void;
  rfq?: RFQ | null;
}

interface FormValues {
  rfq_date: string;
  response_deadline: string;
  reference?: string;
  remarks?: string;
  status: string;
}

type EditableRFQItem = RFQItem & {
  product?: any;
  product_id?: number;
  unit_symbol?: string;
};

const validationSchema = yup.object({
  rfq_date: yup.string().required('RFQ date is required'),
  response_deadline: yup.string().required('Response deadline is required'),
  reference: yup.string().nullable(),
  remarks: yup.string().nullable(),
  status: yup.string().required('Status is required'),
});

function RFQDialogFormContent({ toggleOpen, rfq }: RFQDialogFormProps) {
  const { stakeholders = [] } = useStakeholderSelect() as {
    stakeholders: Stakeholder[];
  };
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedStakeholders, setSelectedStakeholders] = useState<
    Stakeholder[]
  >([]);
  const [items, setItems] = useState<EditableRFQItem[]>([
    {
      product_id: undefined,
      product: undefined,
      measurement_unit_id: undefined,
      quantity: undefined,
      remarks: '',
      unit_symbol: undefined,
    },
  ]);

  const isEditMode = !!rfq?.id;

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      rfq_date: rfq?.rfq_date || dayjs().toISOString(),
      response_deadline:
        rfq?.response_deadline || dayjs().add(7, 'day').toISOString(),
      reference: rfq?.reference || '',
      remarks: rfq?.remarks || '',
      status: rfq?.status || 'draft',
    },
  });

  useEffect(() => {
    if (rfq?.items?.length) {
      setItems(
        rfq.items.map((item: any) => ({
          ...item,
          product: item.product,
          product_id: item.product_id || item.product?.id,
          unit_symbol: item.measurement_unit?.symbol || item.unit_symbol,
        }))
      );
    }
    if (rfq?.stakeholders?.length) {
      setSelectedStakeholders(rfq.stakeholders as Stakeholder[]);
    }
  }, [rfq]);

  const addBlankItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: undefined,
        product: undefined,
        measurement_unit_id: undefined,
        quantity: undefined,
        remarks: '',
        unit_symbol: undefined,
      },
    ]);
  };

  const updateItem = (
    index: number,
    key: keyof EditableRFQItem,
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const addMutation = useMutation({
    mutationFn: rfqServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'RFQ saved successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toggleOpen(false);
    },
    onError: (error: any) => {
      setServerError(
        error?.response?.data?.message ||
          'Please check the information you submitted'
      );
      enqueueSnackbar(
        error?.response?.data?.message ||
          'Please check the information you submitted',
        {
          variant: 'error',
        }
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: rfqServices.update,
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'RFQ updated successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      if (rfq?.id) {
        queryClient.invalidateQueries({ queryKey: ['rfq', rfq.id] });
        queryClient.invalidateQueries({ queryKey: ['rfqComparison', rfq.id] });
      }
      toggleOpen(false);
    },
    onError: (error: any) => {
      setServerError(
        error?.response?.data?.message ||
          'Please check the information you submitted'
      );
      enqueueSnackbar(
        error?.response?.data?.message ||
          'Please check the information you submitted',
        {
          variant: 'error',
        }
      );
    },
  });

  const handleSave = handleSubmit((formData) => {
    if (!items.length) {
      enqueueSnackbar('Add at least one RFQ item', { variant: 'error' });
      return;
    }

    const invalidItem = items.find(
      (item) => !item.product_id || !item.quantity
    );
    if (invalidItem) {
      enqueueSnackbar('Each RFQ item needs a product and quantity', {
        variant: 'error',
      });
      return;
    }

    const payload = {
      id: rfq?.id,
      ...formData,
      requisition_approval_id: rfq?.requisition_approval_id ?? null,
      stakeholder_ids: selectedStakeholders.map(
        (stakeholder) => stakeholder.id
      ),
      items: items.map((item) => ({
        product_id: item.product_id,
        measurement_unit_id: item.measurement_unit_id,
        quantity: Number.isFinite(Number(item.quantity))
          ? Number(item.quantity)
          : 0,
        remarks: item.remarks,
      })),
    };

    if (isEditMode) {
      updateMutation.mutate(payload as any);
    } else {
      addMutation.mutate(payload as any);
    }
  });

  const loading = addMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Grid
        container
        columnSpacing={1}
        rowSpacing={1}
        component='form'
        autoComplete='off'
      >
        <Grid size={12}>
          <Divider />
        </Grid>

        {serverError && (
          <Grid size={12}>
            <Alert severity='error'>{serverError}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 3 }}>
          {/* <TextField
            label="RFQ Date"
            type="datetime-local"
            fullWidth
            size="small"
            value={watch('rfq_date') ? dayjs(watch('rfq_date')).format('YYYY-MM-DDTHH:mm') : ''}
            error={!!errors.rfq_date}
            helperText={errors.rfq_date?.message}
            onChange={(e) => setValue('rfq_date', dayjs(e.target.value).toISOString(), { shouldDirty: true, shouldValidate: true })}
          /> */}
          <DateTimePicker
            label='RFQ Date'
            defaultValue={watch('rfq_date') ? dayjs(watch('rfq_date')) : null}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: !!errors.rfq_date,
                helperText: errors.rfq_date?.message,
              },
            }}
            onChange={(v) =>
              setValue('rfq_date', dayjs(v).toISOString(), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          {/* <TextField
            label='Response Deadline'
            type='datetime-local'
            fullWidth
            size='small'
            value={
              watch('response_deadline')
                ? dayjs(watch('response_deadline')).format('YYYY-MM-DDTHH:mm')
                : ''
            }
            error={!!errors.response_deadline}
            helperText={errors.response_deadline?.message}
            onChange={(e) =>
              setValue(
                'response_deadline',
                dayjs(e.target.value).toISOString(),
                { shouldDirty: true, shouldValidate: true }
              )
            }
          /> */}

          <DateTimePicker
            label='Response Deadline'
            defaultValue={
              watch('response_deadline')
                ? dayjs(watch('response_deadline'))
                : null
            }
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: !!errors.response_deadline,
                helperText: errors.response_deadline?.message,
              },
            }}
            onChange={(v) =>
              setValue('response_deadline', dayjs(v).toISOString(), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label='Reference'
            fullWidth
            size='small'
            value={watch('reference') || ''}
            error={!!errors.reference}
            helperText={errors.reference?.message}
            onChange={(e) =>
              setValue('reference', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            label='Status'
            select
            fullWidth
            size='small'
            value={watch('status') || 'draft'}
            error={!!errors.status}
            helperText={errors.status?.message}
            onChange={(e) =>
              setValue('status', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            {STATUS_OPTIONS.map((option: any) => {
              if (option.lable !== 'All') {
                return (
                  <MenuItem key={option.value} value={option.value}>
                    {option.lable}
                  </MenuItem>
                );
              }
            })}
          </TextField>
        </Grid>

        <Grid size={12}>
          <Autocomplete<Stakeholder, true, false, false>
            multiple
            options={stakeholders}
            value={selectedStakeholders}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.name || ''}
            onChange={(_, newValue) => setSelectedStakeholders(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Invited Suppliers'
                size='small'
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        <Grid
          size={12}
          display='flex'
          justifyContent='space-between'
          alignItems='center'
        >
          <Typography variant='h6'>RFQ Items</Typography>
          <Button
            size='small'
            variant='outlined'
            startIcon={<AddOutlined />}
            onClick={addBlankItem}
          >
            Add Item
          </Button>
        </Grid>

        {items.map((item, index) => (
          <React.Fragment key={`${item.id || index}-${index}`}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ProductSelect
                label='Product'
                defaultValue={item.product}
                frontError={null}
                onChange={(newValue: any) => {
                  updateItem(index, 'product', newValue);
                  updateItem(index, 'product_id', newValue?.id);
                  const unitId =
                    newValue?.primary_unit?.id || newValue?.measurement_unit_id;
                  updateItem(index, 'measurement_unit_id', unitId);
                  updateItem(
                    index,
                    'unit_symbol',
                    newValue?.primary_unit?.unit_symbol ||
                      newValue?.measurement_unit?.symbol
                  );
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                label='Quantity'
                fullWidth
                size='small'
                value={item.quantity ?? ''}
                InputProps={{ inputComponent: CommaSeparatedField as any }}
                onChange={(e) => {
                  const value = e.target.value
                    ? sanitizedNumber(e.target.value)
                    : '';
                  updateItem(
                    index,
                    'quantity',
                    Number.isFinite(value) ? value : ''
                  );
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                label='Unit'
                fullWidth
                size='small'
                value={
                  item.unit_symbol ||
                  item.product?.primary_unit?.unit_symbol ||
                  item.product?.measurement_unit?.symbol ||
                  ''
                }
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid size={{ xs: 10, md: 3 }}>
              <TextField
                label='Remarks'
                fullWidth
                size='small'
                value={item.remarks || ''}
                onChange={(e) => updateItem(index, 'remarks', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 2, md: 1 }} textAlign='end'>
              {items.length > 1 && (
                <Tooltip title='Remove Item'>
                  <IconButton size='small' onClick={() => removeItem(index)}>
                    <DeleteOutlined fontSize='small' color='error' />
                  </IconButton>
                </Tooltip>
              )}
            </Grid>
          </React.Fragment>
        ))}
      </Grid>

      <Grid container justifyContent='space-between' mt={2}>
        <Grid size={12}>
          <Divider />
        </Grid>
        <Grid size={12} display='flex' justifyContent='flex-end' gap={1} mt={1}>
          <Button size='small' onClick={() => toggleOpen(false)}>
            Cancel
          </Button>
          <LoadingButton
            loading={loading}
            size='small'
            variant='contained'
            onClick={handleSave}
          >
            {isEditMode ? 'Update RFQ' : 'Save RFQ'}
          </LoadingButton>
        </Grid>
      </Grid>
    </>
  );
}

function RFQDialogForm({ toggleOpen, rfq = null }: RFQDialogFormProps) {
  return (
    <ProductsSelectProvider>
      <StakeholderSelectProvider type='suppliers'>
        <DialogTitle textAlign='center'>
          {rfq?.id ? 'Edit RFQ' : 'New RFQ'}
        </DialogTitle>
        <DialogContent>
          <RFQDialogFormContent toggleOpen={toggleOpen} rfq={rfq} />
        </DialogContent>
      </StakeholderSelectProvider>
    </ProductsSelectProvider>
  );
}

export default RFQDialogForm;
