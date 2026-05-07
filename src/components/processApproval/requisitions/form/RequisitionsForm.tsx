import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import useLeaveTypes from '@/hooks/useLeaveTypes';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { PROCESS_TYPES } from '@/utilities/constants/processTypes';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Button,
  Dialog,
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
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import CostCenterSelector from '../../../masters/costCenters/CostCenterSelector';
import CurrencySelector from '../../../masters/Currencies/CurrencySelector';
import { requisitionContext } from '../../Requisitions';
import requisitionsServices from '../../requisitionsServices';
import LeaveItemForm from './LeaveItemForm';
import LeaveItemRow, { LeaveItemFormValue } from './LeaveItemRow';
import RequisitionLedgerItemForm from './RequisitionLedgerItemForm';
import RequisitionLedgerItemRow from './RequisitionLedgerItemRow';
import RequisitionProductItemForm from './RequisitionProductItemForm';
import RequisitionProductItemRow from './RequisitionProductItemRow';
import RequisitionSummary from './RequisitionSummary';

type EmployeeOption = {
  id: number;
  employee_number?: string;
  first_name?: string;
  last_name?: string;
};

const extractList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const normalizeLeaveDate = (value?: string) => {
  if (!value) return value;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
};

const normalizeLeaveItem = (item: RequisitionItem) => ({
  ...item,
  employee_id: item.employee_id ?? item.employee?.id,
  leave_type_id: item.leave_type_id ?? item.leave_type?.id,
  start_date: normalizeLeaveDate(item.start_date),
  end_date: normalizeLeaveDate(item.end_date),
  days_requested: Number(item.days_requested ?? 0),
  reason: item.reason || '',
});

interface RequisitionItem {
  id?: number;
  employee_id?: number;
  leave_type_id?: number;
  start_date?: string;
  end_date?: string;
  days_requested?: number;
  reason?: string;
  ledger_id?: number;
  measurement_unit_id?: number;
  product_id?: number;
  rate?: number;
  quantity?: number;
  vat_percentage?: number;
  employee?: {
    id?: number;
    employee_number?: string;
    first_name?: string;
    last_name?: string;
  };
  leave_type?: {
    id?: number;
    name?: string;
  };
  ledger?: any;
  measurement_unit?: any;
  product?: any;
}

interface Requisition {
  id?: number;
  requisition_date?: string;
  approval_chain?: {
    process_type?: string;
  };
  currency?: any;
  cost_center?: any;
  exchange_rate?: number;
  remarks?: string;
  items?: RequisitionItem[];
  leave_items?: RequisitionItem[];
}

interface RequisitionsFormProps {
  toggleOpen: (open: boolean) => void;
  requisition?: Requisition;
  isDuplicate?: boolean;
}

function RequisitionsForm({
  toggleOpen,
  requisition,
  isDuplicate = false,
}: RequisitionsFormProps) {
  const [requisition_date] = useState(
    isDuplicate
      ? dayjs()
      : requisition && !isDuplicate
      ? dayjs(requisition.requisition_date)
      : dayjs()
  );
  const { setIsEditAction } = useContext(requisitionContext);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { currencies } = useCurrencySelect();
  const [totalAmount, setTotalAmount] = useState(0);
  const [vatableAmount, setVatableAmount] = useState(0);
  const {
    authOrganization,
    checkOrganizationPermission,
    organizationHasSubscribed,
  } = useJumboAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const [requisition_ledger_items, setRequisition_ledger_items] = useState<
    RequisitionItem[]
  >(
    requisition?.approval_chain?.process_type?.toUpperCase() === 'PAYMENT'
      ? requisition?.items?.map((item) => ({
          ...item,
          ledger_id: item.ledger?.id,
          measurement_unit_id: item.measurement_unit?.id,
        })) || []
      : []
  );

  const [requisition_product_items, setRequisition_product_items] = useState<
    RequisitionItem[]
  >(
    requisition?.approval_chain?.process_type?.toUpperCase() === 'PURCHASE'
      ? requisition?.items?.map((item) => ({
          ...item,
          product_id: item.product?.id,
          measurement_unit_id: item.measurement_unit?.id,
        })) || []
      : []
  );

  const [requisition_leave_items, setRequisition_leave_items] = useState<
    RequisitionItem[]
  >(
    requisition?.approval_chain?.process_type?.toUpperCase() === 'LEAVE_REQUEST'
      ? (requisition?.leave_items || requisition?.items || []).map(
          normalizeLeaveItem
        ) || []
      : []
  );

  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: employeeResponse } = useQuery({
    queryKey: ['employees-for-requisition-leave-items'],
    queryFn: () =>
      humanResourcesServices.getEmployeesList({ page: 1, limit: 500 }),
  });
  const employeeOptions = React.useMemo(
    () => extractList(employeeResponse) as EmployeeOption[],
    [employeeResponse]
  );
  const setLeaveItems = (items: React.SetStateAction<LeaveItemFormValue[]>) => {
    const nextRows =
      typeof items === 'function'
        ? items(requisition_leave_items as LeaveItemFormValue[])
        : items;
    setRequisition_leave_items(nextRows as RequisitionItem[]);
  };

  const validationSchema = yup.object({
    requisition_date: yup
      .string()
      .required('Requisition Date is required')
      .typeError('Requisition Date is required'),
    process_type: yup
      .string()
      .required('Process is required')
      .typeError('Process is required'),
    cost_center_id: yup
      .number()
      .min(-1, 'Cost center is required')
      .required('Cost center is required')
      .typeError('Cost center is required'),
  });

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: requisition?.id,
      requisition_date: requisition_date.toISOString(),
      process_type: requisition?.approval_chain?.process_type,
      currency_id: requisition ? requisition?.currency?.id : 1,
      cost_center_id: requisition?.cost_center?.id,
      exchange_rate: requisition ? requisition?.exchange_rate : 1,
      remarks: requisition?.remarks,
      product_items:
        requisition?.approval_chain?.process_type?.toUpperCase() === 'PURCHASE'
          ? requisition?.items
          : null,
      ledger_items:
        requisition?.approval_chain?.process_type?.toUpperCase() === 'PAYMENT'
          ? requisition?.items
          : null,
      leave_items:
        requisition?.approval_chain?.process_type?.toUpperCase() ===
        'LEAVE_REQUEST'
          ? requisition?.leave_items || requisition?.items || []
          : [],
      currencyDetails: requisition
        ? requisition.currency
        : currencies?.find((c) => c.is_base === 1),
    },
  });

  const addRequisition = useMutation({
    mutationFn: requisitionsServices.addRequisitions,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      setIsEditAction(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisitionDetails'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const updateRequisition = useMutation({
    mutationFn: requisitionsServices.updateRequisition,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      setIsEditAction(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['requisitionDetails'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message &&
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
    },
  });

  const selectedProcessType = watch('process_type');
  const currencyDetails = watch('currencyDetails');
  const processTypeOptions = React.useMemo(
    () =>
      PROCESS_TYPES.filter(
        (type) =>
          type !== 'LEAVE_REQUEST' ||
          organizationHasSubscribed(MODULES.HUMAN_RESOURCES)
      ),
    [organizationHasSubscribed]
  );

  const saveMutation = React.useMemo(() => {
    return requisition && !isDuplicate ? updateRequisition : addRequisition;
  }, [requisition, addRequisition, updateRequisition]);

  useEffect(() => {
    let total = 0;
    let vatableAmount = 0;

    (selectedProcessType === 'PURCHASE'
      ? requisition_product_items
      : requisition_ledger_items
    ).forEach((item) => {
      total += sanitizedNumber(item.rate) * sanitizedNumber(item.quantity);
    });

    if (selectedProcessType === 'PURCHASE') {
      setValue('product_items', requisition_product_items);
      requisition_product_items.forEach((item) => {
        vatableAmount +=
          Number(item.quantity) *
          Number(item.rate) *
          (item.vat_percentage || 0) *
          0.01;
      });
      setVatableAmount(vatableAmount);
      setTotalAmount(total || 0);
    } else if (selectedProcessType === 'PAYMENT') {
      setValue('ledger_items', requisition_ledger_items);
      setTotalAmount(total || 0);
    } else if (selectedProcessType === 'LEAVE_REQUEST') {
      setValue('leave_items', requisition_leave_items);
      setTotalAmount(0);
      setVatableAmount(0);
    } else {
      setTotalAmount(0);
      setVatableAmount(0);
    }
  }, [
    selectedProcessType,
    requisition,
    requisition_ledger_items,
    requisition_product_items,
    requisition_leave_items,
    setValue,
  ]);

  const onSubmit = () => {
    if (selectedProcessType === 'LEAVE_REQUEST') {
      if (!requisition_leave_items.length) {
        enqueueSnackbar('At least one leave item is required', {
          variant: 'error',
        });
        return;
      }

      const invalidRow = requisition_leave_items.find((item) => {
        const start = item.start_date ? dayjs(item.start_date) : null;
        const end = item.end_date ? dayjs(item.end_date) : null;
        return (
          !item.employee_id ||
          !item.leave_type_id ||
          !start ||
          !end ||
          !start.isValid() ||
          !end.isValid() ||
          end.isBefore(start, 'day')
        );
      });

      if (invalidRow) {
        enqueueSnackbar(
          'Please complete all leave item required fields correctly',
          { variant: 'error' }
        );
        return;
      }
    }

    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmit((data) => {
        const normalizedLeaveItems =
          selectedProcessType === 'LEAVE_REQUEST'
            ? requisition_leave_items.map((item) => ({
                ...item,
                start_date: normalizeLeaveDate(item.start_date),
                end_date: normalizeLeaveDate(item.end_date),
              }))
            : [];
        const updatedData = {
          ...data,
          product_items:
            selectedProcessType === 'PURCHASE'
              ? requisition_product_items
              : null,
          ledger_items:
            selectedProcessType === 'PAYMENT' ? requisition_ledger_items : null,
          leave_items: normalizedLeaveItems,
        };
        saveMutation.mutate(updatedData);
      })();
    }
  };

  const handleConfirmSubmitWithoutAdd = async () => {
    handleSubmit((data) => {
      const normalizedLeaveItems =
        selectedProcessType === 'LEAVE_REQUEST'
          ? requisition_leave_items.map((item) => ({
              ...item,
              start_date: normalizeLeaveDate(item.start_date),
              end_date: normalizeLeaveDate(item.end_date),
            }))
          : [];
      const updatedData = {
        ...data,
        product_items:
          selectedProcessType === 'PURCHASE' ? requisition_product_items : null,
        ledger_items:
          selectedProcessType === 'PAYMENT' ? requisition_ledger_items : null,
        leave_items: normalizedLeaveItems,
      };
      saveMutation.mutate(updatedData);
    })();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((prev) => prev + 1);
  };

  return (
    <React.Fragment>
      <DialogTitle>
        <Grid container columnSpacing={2} width={'100%'}>
          <Grid size={{ xs: 12 }} textAlign={'center'} mb={2}>
            {requisition && !isDuplicate
              ? 'Edit Requisition'
              : requisition && isDuplicate
                ? 'Duplicate Requisition'
                : 'New Requisition'}
          </Grid>
          <Grid size={{ xs: 12, md: 8, lg: 9 }} mb={2}>
            <form autoComplete='off'>
              <Grid container columnSpacing={1} rowSpacing={1}>
                <Grid size={{ xs: 12, md: 4, lg: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <DateTimePicker
                      label='Requisition Date'
                      defaultValue={requisition_date}
                      minDate={
                        checkOrganizationPermission(
                          PERMISSIONS.REQUISITIONS_BACKDATE
                        )
                          ? dayjs(
                              authOrganization?.organization
                                .recording_start_date
                            )
                          : dayjs().startOf('day')
                      }
                      maxDate={
                        checkOrganizationPermission(
                          PERMISSIONS.REQUISITIONS_POSTDATE
                        )
                          ? dayjs().add(10, 'year').endOf('year')
                          : dayjs().endOf('day')
                      }
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!errors?.requisition_date,
                          helperText: errors?.requisition_date?.message,
                          inputProps: {
                            readOnly: true,
                          },
                        },
                      }}
                      onChange={(newValue: any) => {
                        setValue(
                          'requisition_date',
                          newValue ? newValue.toISOString() : null,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <Autocomplete
                      id='checkboxes-process_type'
                      options={processTypeOptions}
                      defaultValue={requisition?.approval_chain?.process_type}
                      isOptionEqualToValue={(option, value) => option === value}
                      getOptionLabel={(option) => option.replace(/_/g, ' ')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Process'
                          size='small'
                          fullWidth
                          error={!!errors.process_type}
                          helperText={errors.process_type?.message}
                        />
                      )}
                      onChange={(e, newValue: any) => {
                        setRequisition_product_items([]);
                        setRequisition_ledger_items([]);
                        setRequisition_leave_items([]);

                        setValue('process_type', newValue ? newValue : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });

                        setValue('product_items', null as any, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setValue('ledger_items', null as any, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setValue('leave_items', [] as any, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <CostCenterSelector
                      multiple={false}
                      frontError={errors.cost_center_id}
                      withNotSpecified={true}
                      defaultValue={requisition?.cost_center}
                      label='Cost Center'
                      onChange={(newValue: any) => {
                        setValue(
                          'cost_center_id',
                          newValue ? newValue?.id : null,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <CurrencySelector
                      frontError={errors?.currency_id as any}
                      defaultValue={1}
                      onChange={(newValue) => {
                        setValue('currencyDetails', newValue);
                        setValue('currency_id', newValue ? newValue.id : null, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        clearErrors('exchange_rate');

                        setValue(
                          'exchange_rate',
                          newValue?.exchangeRate ? newValue.exchangeRate : 1
                        );
                      }}
                    />
                  </Div>
                </Grid>
                {watch('currency_id') > 1 && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Div sx={{ mt: 0.3 }}>
                      <TextField
                        label='Exchange Rate'
                        fullWidth
                        size='small'
                        error={!!errors?.exchange_rate}
                        helperText={errors?.exchange_rate?.message}
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                        }}
                        value={watch('exchange_rate')}
                        onChange={(e) => {
                          setValue(
                            'exchange_rate',
                            e.target.value
                              ? sanitizedNumber(e.target.value)
                              : null,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }}
                      />
                    </Div>
                  </Grid>
                )}
              </Grid>
            </form>
          </Grid>
          {selectedProcessType === 'LEAVE_REQUEST' ? (
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <Grid container columnSpacing={1}>
                <Grid size={{ xs: 12 }}>
                  <Typography align='center' variant='h3'>
                    Summary
                  </Typography>
                  <Divider />
                </Grid>
                <Grid size={{ xs: 7 }}>
                  <Typography align='left' variant='body2'>
                    Leave Items:
                  </Typography>
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <Typography align='right' variant='h5'>
                    {requisition_leave_items.length}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 7 }}>
                  <Typography align='left' variant='body2'>
                    Total Days:
                  </Typography>
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <Typography align='right' variant='h5'>
                    {requisition_leave_items.reduce(
                      (sum, item) => sum + (Number(item.days_requested) || 0),
                      0
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <RequisitionSummary
                isPurchase={selectedProcessType === 'PURCHASE'}
                vatableAmount={vatableAmount}
                totalAmount={totalAmount}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            {selectedProcessType === 'PAYMENT' ? (
              <RequisitionLedgerItemForm
                setRequisition_ledger_items={setRequisition_ledger_items}
                requisition_ledger_items={requisition_ledger_items}
              />
            ) : selectedProcessType === 'PURCHASE' ? (
              <RequisitionProductItemForm
                setRequisition_product_items={setRequisition_product_items}
                requisition_product_items={requisition_product_items}
              />
            ) : selectedProcessType === 'LEAVE_REQUEST' ? (
              <LeaveItemForm
                employeeOptions={employeeOptions}
                leaveTypeOptions={leaveTypes}
                setLeaveItems={setLeaveItems}
              />
            ) : null}
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {selectedProcessType === 'PAYMENT' &&
          requisition_ledger_items.map((ledger_item, index) => (
            <RequisitionLedgerItemRow
              key={index}
              index={index}
              currencyDetails={currencyDetails}
              setRequisition_ledger_items={setRequisition_ledger_items}
              requisition_ledger_items={requisition_ledger_items}
              ledger_item={ledger_item}
            />
          ))}
        {selectedProcessType === 'PURCHASE' &&
          requisition_product_items.map((product_item, index) => (
            <RequisitionProductItemRow
              key={index}
              index={index}
              currencyDetails={currencyDetails}
              setRequisition_product_items={setRequisition_product_items}
              requisition_product_items={requisition_product_items}
              product_item={product_item}
            />
          ))}

        {selectedProcessType === 'LEAVE_REQUEST' &&
          requisition_leave_items.map((leave_item, index) => (
            <LeaveItemRow
              key={index}
              row={leave_item as LeaveItemFormValue}
              index={index}
              leaveItems={requisition_leave_items as LeaveItemFormValue[]}
              setLeaveItems={setLeaveItems}
              employeeOptions={employeeOptions}
              leaveTypeOptions={leaveTypes}
            />
          ))}

        {selectedProcessType === 'LEAVE_REQUEST' &&
          requisition_leave_items.length === 0 && (
            <Grid size={{ xs: 12 }}>No leave item added yet.</Grid>
          )}
        <Grid size={{ xs: 12 }} paddingTop={2}>
          <Div sx={{ mt: 0.3 }}>
            <TextField
              label='Remarks'
              size='small'
              multiline={true}
              minRows={2}
              fullWidth
              {...register('remarks')}
            />
          </Div>
        </Grid>

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>
            <Grid container alignItems='center' justifyContent='space-between'>
              <Grid size={{ xs: 11 }}>Unsaved Changes</Grid>
              <Grid size={{ xs: 1 }} textAlign='right'>
                <Tooltip title='Close'>
                  <IconButton
                    size='small'
                    onClick={() => setShowWarning(false)}
                  >
                    <HighlightOff color='primary' />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>Last item was not added to the list</DialogContent>
          <DialogActions>
            <Button
              size='small'
              onClick={() => {
                setSubmitItemForm(true);
                setShowWarning(false);
              }}
            >
              Add and Submit
            </Button>
            <Button
              size='small'
              onClick={handleConfirmSubmitWithoutAdd}
              color='secondary'
            >
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button
          size='small'
          onClick={() => {
            toggleOpen(false);
            setIsEditAction(false);
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          loading={addRequisition.isPending || updateRequisition.isPending}
          size='small'
          variant='contained'
          type='submit'
          onClick={(e) => {
            setValue('submit_type' as any, 'suspended');
            handleSubmit(onSubmit)(e);
          }}
        >
          Suspend
        </LoadingButton>
        <LoadingButton
          loading={addRequisition.isPending || updateRequisition.isPending}
          variant='contained'
          color='success'
          type='submit'
          onClick={(e) => {
            setValue('submit_type' as any, 'submitted');
            handleSubmit(onSubmit)(e);
          }}
          size='small'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </React.Fragment>
  );
}

export default RequisitionsForm;
