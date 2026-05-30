import {
  Button,
  Divider,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import requisitionsServices from '../../../../requisitionsServices';
import ApprovalRequisitionProductItem from './ApprovalRequisitionProductItem';
import ApprovalRequisitionLedgerItem from './ApprovalRequisitionLedgerItem';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { readableDate, sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import { Approval, Requisition, RequisitionItem, Vendor } from '@/components/processApproval/RequisitionType';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';

interface ApprovalFormProps {
  toggleOpen: (value: boolean) => void;
  requisition: Requisition;
  approval?: Approval;
  isEdit?: boolean;
}

interface FormValues {
  id?: number;
  requisition_id: number;
  approval_date: string;
  process_type: string;
  remarks?: string;
  product_items?: any[];
  ledger_items?: any[];
  additional_costs?: any[];
  chain_level_id?: number;
  submit_type?: string;
}

interface ItemChangeParams {
  index: number;
  key: string;
  value: number | null;
}

function ApprovalForm({ toggleOpen, requisition, approval, isEdit = false }: ApprovalFormProps) {
  const [approvalDate] = useState<Dayjs>(dayjs());
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { checkOrganizationPermission } = useJumboAuth();
  const requisitionItems: RequisitionItem[] = 'items' in requisition ? (requisition.items || []) : [];

  const getInitialProductItems = (): RequisitionItem[] => {
    const items = approval?.items || requisitionItems;
    return items.map((item: RequisitionItem) => ({
      ...item,
      id: item.requisition_product?.id || item.id,
      product: item.product || item.requisition_product?.product,
      vendors: item.vendors?.map((vendor: Vendor) => ({
        ...vendor,
        stakeholder_id: vendor.id
      })),
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      remarks: item.remarks || ''
    }));
  };

  const getInitialLedgerItems = (): RequisitionItem[] => {
    const items = approval?.items || requisitionItems;
    return items.map((item: RequisitionItem) => ({
      ...item,
      id: item.requisition_ledger_item?.id || item.id,
      ledger: item.ledger || item.requisition_ledger_item?.ledger,
      measurement_unit: item.measurement_unit || item.requisition_ledger_item?.measurement_unit,
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      remarks: item.remarks || ''
    }));
  };

  const getInitialAdditionalCosts = () => {
    const source =
      (approval as any)?.additional_costs ||
      (requisition as any)?.additional_costs ||
      [];

    return source.map((cost: any) => ({
      ...cost,
      id: cost?.requisition_additional_cost?.id || cost?.id,
      amount: Number(cost?.amount || 0),
      exchange_rate: Number(cost?.exchange_rate || 1),
      credit_ledger_name:
        cost?.credit_ledger_name || cost?.ledger?.name || cost?.name || '',
      currency_name: cost?.currency_name || cost?.currency?.name || '',
      currency_id: cost?.currency_id || cost?.currency?.id,
    }));
  };

  const [requisitionProductItem, setRequisitionProductItem] = useState<RequisitionItem[]>(getInitialProductItems());
  const [requisitionLedgerItem, setRequisitionLedgerItem] = useState<RequisitionItem[]>(getInitialLedgerItems());
  const [requisitionAdditionalCosts, setRequisitionAdditionalCosts] = useState<any[]>(getInitialAdditionalCosts());
  const [activePurchaseTab, setActivePurchaseTab] = useState(0);

  useEffect(() => {
    setRequisitionProductItem(getInitialProductItems());
    setRequisitionLedgerItem(getInitialLedgerItems());
    setRequisitionAdditionalCosts(getInitialAdditionalCosts());
  }, [requisition, approval]);

  const isPurchaseType = requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase';
  const isImprestType = requisition?.approval_chain?.process_type?.toLowerCase() === 'imprest';
  const isFinal = isEdit ? approval?.is_final === 1 : requisition?.next_approval_level?.is_final;
  const approvalDisplayValue = React.useMemo(() => {
    const lineItemsTotal = (isPurchaseType ? requisitionProductItem : requisitionLedgerItem).reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
      0
    );

    if (!isPurchaseType) {
      return lineItemsTotal;
    }

    const vatTotal = requisitionProductItem.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.rate || 0) *
          Number(item.vat_percentage || 0) *
          0.01,
      0
    );
    const additionalTotal = requisitionAdditionalCosts.reduce(
      (sum, cost) => sum + Number(cost.amount || 0),
      0
    );

    return lineItemsTotal + vatTotal + additionalTotal;
  }, [isPurchaseType, requisitionProductItem, requisitionLedgerItem, requisitionAdditionalCosts]);

  const validationSchema = yup.object().shape({
    approval_date: yup.string().required('Approval Date is required').typeError('Approval Date is required'),
    product_items: isPurchaseType
      ? yup.array().of(
          yup.object().shape({
            rate: isFinal
              ? yup.number()
                .required('Rate is required for final approval')
                .positive('Rate is required for final approval')
                .typeError('Rate is required for final approval')
              : yup.number().nullable(),
            quantity: isFinal
              ? yup.number()
                .required('Quantity is required for final approval')
                .positive('Quantity is required for final approval')
                .typeError('Quantity is required for final approval')
              : yup.number().nullable(),
          })
        )
      : yup.array().nullable(),
    additional_costs: isPurchaseType
      ? yup.array().of(
          yup.object().shape({
            amount: yup.number()
              .required('Amount is required')
              .positive('Amount is required')
              .typeError('Amount is required'),
          })
        )
      : yup.array().nullable(),
    ledger_items: !isPurchaseType
      ? yup.array().of(
          yup.object().shape({
            rate: yup.number()
              .required('Rate is required')
              .positive('Rate is required')
              .typeError('Rate is required'),
            quantity: yup.number()
              .required('Quantity is required')
              .positive('Quantity is required')
              .typeError('Quantity is required')
          })
        )
      : yup.array().nullable(),
  });

  const { 
    handleSubmit, 
    setValue, 
    register, 
    formState: { errors } 
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: approval?.id,
      requisition_id: requisition.id,
      approval_date: approvalDate.toISOString(),
      process_type: requisition?.approval_chain?.process_type,
      remarks: approval?.remarks || requisition?.remarks || '',
      product_items: isPurchaseType ? (approval?.items || requisitionItems) : [],
      additional_costs: isPurchaseType ? getInitialAdditionalCosts() : [],
      ledger_items: !isPurchaseType ? (approval?.items || requisitionItems) : [],
      chain_level_id: approval && isEdit ? approval.approval_chain_level_id : requisition?.next_approval_level?.id,
    }
  });

  const approveRequisition = useMutation({
    mutationFn: requisitionsServices.approveRequisition,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const editApprovalRequisition = useMutation({
    mutationFn: requisitionsServices.editApprovalRequisition,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const handleItemChange = ({ index, key, value }: ItemChangeParams) => {
    let updatedItems;

    if (requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase') {
      updatedItems = [...requisitionProductItem];
      if (updatedItems[index]) {
        updatedItems[index] = {
          ...updatedItems[index],
          [key]: Number.isNaN(value) ? null : value
        };
        setRequisitionProductItem(updatedItems);
      }
    } else {
      updatedItems = [...requisitionLedgerItem];
      if (updatedItems[index]) {
        updatedItems[index] = {
          ...updatedItems[index],
          [key]: Number.isNaN(value) ? null : value
        };
        setRequisitionLedgerItem(updatedItems);
      }
    }
  };

  const handleAdditionalCostAmountChange = (index: number, value: number) => {
    setRequisitionAdditionalCosts((prevCosts) => {
      const updatedCosts = [...prevCosts];
      if (updatedCosts[index]) {
        updatedCosts[index] = {
          ...updatedCosts[index],
          amount: value,
        };
      }
      return updatedCosts;
    });
  };

  useEffect(() => {
    if (isPurchaseType) {
      const product_items = requisitionProductItem?.map((item) => ({
        requisition_product_item_id: item.id,
        vat_percentage: item.vat_percentage,
        quantity: item.quantity,
        rate: item.rate,
        remarks: item.remarks,
        vendors: item.vendors
      }));

      setValue('product_items', product_items, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const additional_costs = requisitionAdditionalCosts?.map((cost) => ({
        requisition_additional_cost_id: cost.id,
        ledger_id: cost.ledger_id || cost.ledger?.id,
        credit_ledger_name: cost.credit_ledger_name || cost.name,
        currency_id: cost.currency_id || cost.currency?.id,
        exchange_rate: Number(cost.exchange_rate || 1),
        reference: cost.reference,
        amount: Number(cost.amount || 0),
      }));

      setValue('additional_costs', additional_costs, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      const ledger_items = requisitionLedgerItem?.map((item) => ({
        requisition_ledger_item_id: item.id,
        quantity: item.quantity,
        rate: item.rate,
        remarks: item.remarks,
        measurement_unit_id: item.measurement_unit?.id
      }));

      setValue('ledger_items', ledger_items, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [
    requisitionProductItem,
    requisitionLedgerItem,
    requisitionAdditionalCosts,
    setValue,
    isPurchaseType,
  ]);

  const saveMutation = React.useMemo(() => {
    return isEdit ? editApprovalRequisition.mutate : approveRequisition.mutate;
  }, [isEdit, editApprovalRequisition, approveRequisition]);

  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    const payload = {
      ...formData,
      product_items: isPurchaseType ? formData.product_items : undefined,
      additional_costs: isPurchaseType ? formData.additional_costs : undefined,
      ledger_items: !isPurchaseType ? formData.ledger_items : undefined,
    };
    saveMutation(payload as FormValues);
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container spacing={2}>
          <Grid size={{xs: 12}} textAlign={"center"} mb={2}>
            {isEdit
              ? 'Edit Approval'
              : isImprestType
                ? 'Approve Imprest Requisition'
                : 'Approve Requisition'}
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} sx={{ mt: 1, mb: 1 }}>
            <Div sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary'>Requisition Date</Typography>
              <Typography variant='body2'>{readableDate(requisition.requisition_date)}</Typography>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} sx={{ mt: 1, mb: 1 }}>
            <Div sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary'>Currency</Typography>
              <Typography variant='body2'>{requisition.currency?.name}</Typography>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ mt: 1, mb: 1 }}>
            <Div sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary'>Cost Center</Typography>
              <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
                {requisition.cost_center?.name || '-'}
              </Typography>
            </Div>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }} sx={{ mt: 1, mb: 1 }}>
            <Div sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant='caption' color='text.secondary'>Grand Total</Typography>
              <Typography variant='body2'>
                {Number(approvalDisplayValue || 0).toLocaleString('en-US', {
                  style: 'currency',
                  currency: requisition.currency?.code || 'USD',
                })}
              </Typography>
            </Div>
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 4}}>
            <Div sx={{mt: 1}}>
              <DateTimePicker
                label="Approval Date"
                readOnly={true}
                defaultValue={approvalDate}
                minDate={
                  checkOrganizationPermission(PERMISSIONS.APPROVAL_BACKDATE)
                  ? dayjs(requisition.requisition_date)
                  : dayjs().startOf('day')
                }
                maxDate={
                  checkOrganizationPermission(PERMISSIONS.APPROVAL_POSTDATE)
                  ? dayjs().add(10, 'year').endOf('year')
                  : dayjs().endOf('day')
                }
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    error: !!errors?.approval_date,
                    helperText: errors?.approval_date?.message
                  }
                }}
                onChange={(newValue: Dayjs | null) => {
                  if (newValue) {
                    setValue('approval_date', newValue.toISOString(), {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                }}
              />
            </Div>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {isPurchaseType ? 
            <>
              <Tabs
                value={activePurchaseTab}
                onChange={(_, newValue) => setActivePurchaseTab(newValue)}
                variant='scrollable'
                scrollButtons='auto'
                allowScrollButtonsMobile
                sx={{ mb: 1 }}
              >
                <Tab label='Products' />
                <Tab label='Additional Costs' />
              </Tabs>

              {activePurchaseTab === 0 && (
                <ApprovalRequisitionProductItem 
                  approval={approval} 
                  requisition={requisition} 
                  errors={errors.product_items} 
                  requisitionProductItem={requisitionProductItem} 
                  setRequisitionProductItem={setRequisitionProductItem} 
                  handleItemChange={handleItemChange}
                />
              )}

              {activePurchaseTab === 1 && requisitionAdditionalCosts.length > 0 && (
                <Grid container spacing={1} sx={{ mt: 1, mb: 2 }}>
                  {requisitionAdditionalCosts.map((cost, index) => {
                    const additionalCostErrors = (errors as any)?.additional_costs?.[index];

                    return (
                      <React.Fragment key={cost.id || index}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant='body2' sx={{ mt: 1.5 }}>
                          {`${index + 1}. ${cost.credit_ledger_name || cost.name}`}
                        </Typography>
                        {cost.reference && (
                          <Typography variant='caption' color='text.secondary'>
                            Ref: {cost.reference}
                          </Typography>
                        )}
                      </Grid>
                      <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant='body2' sx={{ mt: 1.5 }}>
                          {cost.currency_name || requisition.currency?.name}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant='body2' sx={{ mt: 1.5 }}>
                          Rate: {Number(cost.exchange_rate || 1).toLocaleString('en-US')}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Div sx={{ mt: 0.5 }}>
                          <TextField
                            label='Amount'
                            fullWidth
                            size='small'
                            value={Number(cost.amount || 0).toLocaleString('en-US')}
                            error={!!additionalCostErrors?.amount}
                            helperText={additionalCostErrors?.amount?.message as string}
                            InputProps={{
                              inputComponent: CommaSeparatedField,
                            }}
                            onChange={(e) =>
                              handleAdditionalCostAmountChange(
                                index,
                                sanitizedNumber(e.target.value) || 0
                              )
                            }
                          />
                        </Div>
                      </Grid>
                      </React.Fragment>
                    );
                  })}
                </Grid>
              )}

              {activePurchaseTab === 1 && requisitionAdditionalCosts.length === 0 && (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  No additional costs on this requisition.
                </Typography>
              )}
            </>
          :
            <ApprovalRequisitionLedgerItem 
              approval={approval} 
              requisition={requisition} 
              errors={errors.ledger_items} 
              readOnlyMode={isImprestType}
              requisitionLedgerItem={requisitionLedgerItem} 
              setRequisitionLedgerItem={setRequisitionLedgerItem} 
              handleItemChange={handleItemChange}
            />
        }
        <Grid size={{xs: 12}}>
          <Div sx={{ mt: 1, mb: 1 }}>
            <TextField
              label='Remarks'
              fullWidth
              defaultValue={approval?.remarks}
              multiline={true}
              minRows={2}
              error={!!errors?.remarks}
              helperText={errors?.remarks?.message}
              {...register('remarks')}
            />
          </Div>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        {isPurchaseType && activePurchaseTab === 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setActivePurchaseTab(1)}
          >
            Next &gt;
          </Button>
        )}
        {isPurchaseType && activePurchaseTab === 1 && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setActivePurchaseTab(0)}
          >
            &lt; Prev
          </Button>
        )}
        {(!isPurchaseType || activePurchaseTab === 1) && (
          <>
        <LoadingButton
          loading={approveRequisition.isPending || editApprovalRequisition.isPending}
          size="small"
          variant="contained"
          color="error"
          type="submit"
          onClick={(e) => {
            setValue('submit_type', 'rejected');
            handleSubmit(onSubmit)(e);
          }}
        >
          Reject
        </LoadingButton>
        <LoadingButton
          loading={approveRequisition.isPending || editApprovalRequisition.isPending}
          size="small"
          variant="contained"
          type="submit"
          onClick={(e) => {
            setValue('submit_type', 'on hold');
            handleSubmit(onSubmit)(e);
          }}
        >
          Hold
        </LoadingButton>
        <LoadingButton
          loading={approveRequisition.isPending || editApprovalRequisition.isPending}
          variant="contained"
          color="success"
          type="submit"
          size="small"
          onClick={(e) => {
            setValue('submit_type', 'approved');
            handleSubmit(onSubmit)(e);
          }}
        >
          Approve
        </LoadingButton>
          </>
        )}
      </DialogActions>
    </React.Fragment>
  );
}

export default ApprovalForm;