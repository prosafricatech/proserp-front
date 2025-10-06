import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import requisitionsServices from '../../../requisitionsServices';
import ApprovalRequisitionProductItem from './ApprovalRequisitionProductItem';
import ApprovalRequisitionLedgerItem from './ApprovalRequisitionLedgerItem';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import { Approval, Requisition, RequisitionItem, Vendor } from '@/components/processApproval/RequisitionType';

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

  const getInitialProductItems = (): RequisitionItem[] => {
    const items = approval?.items || requisition.items || [];
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
    const items = approval?.items || requisition.items || [];
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

  const [requisitionProductItem, setRequisitionProductItem] = useState<RequisitionItem[]>(getInitialProductItems());
  const [requisitionLedgerItem, setRequisitionLedgerItem] = useState<RequisitionItem[]>(getInitialLedgerItems());

  useEffect(() => {
    setRequisitionProductItem(getInitialProductItems());
    setRequisitionLedgerItem(getInitialLedgerItems());
  }, [requisition, approval]);

  const isPurchaseType = requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase';
  const isFinal = isEdit ? approval?.is_final === 1 : requisition?.next_approval_level?.is_final;

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
      product_items: isPurchaseType ? (approval?.items || requisition.items) : [],
      ledger_items: !isPurchaseType ? (approval?.items || requisition.items) : [],
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
  }, [requisitionProductItem, requisitionLedgerItem, setValue, isPurchaseType]);

  const saveMutation = React.useMemo(() => {
    return isEdit ? editApprovalRequisition.mutate : approveRequisition.mutate;
  }, [isEdit, editApprovalRequisition, approveRequisition]);

  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    saveMutation(formData);
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container spacing={2}>
          <Grid size={{xs: 12}} textAlign={"center"} mb={2}>
            {isEdit ? 'Edit Approval' : 'Approve Requisition'}
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 4}} sx={{ mt: 1, mb: 1 }}>
            <Stack direction="row" spacing={1}>
              <Typography sx={{ fontWeight: 'bold'}}>Requisition Date:</Typography>
              <Typography>{readableDate(requisition.requisition_date)}</Typography>
            </Stack>
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 4}} sx={{ mt: 1, mb: 1 }}>
            <Stack direction="row" spacing={1}>
              <Typography sx={{ fontWeight: 'bold'}}>Currency:</Typography>
              <Typography>{requisition.currency?.name}</Typography>
            </Stack>
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 4}} sx={{ mt: 1, mb: 1 }}>
            <Stack direction="row" spacing={1}>
              <Typography sx={{ fontWeight: 'bold'}}>Cost Center:</Typography>
              <Typography>{requisition.cost_center?.name}</Typography>
            </Stack>
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
            <ApprovalRequisitionProductItem 
              approval={approval} 
              requisition={requisition} 
              errors={errors.product_items} 
              requisitionProductItem={requisitionProductItem} 
              setRequisitionProductItem={setRequisitionProductItem} 
              handleItemChange={handleItemChange}
            /> 
          :
            <ApprovalRequisitionLedgerItem 
              approval={approval} 
              requisition={requisition} 
              errors={errors.ledger_items} 
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
      </DialogActions>
    </React.Fragment>
  );
}

export default ApprovalForm;