import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  TextField, 
  Button, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Divider, 
  Alert, 
  Dialog, 
  Tooltip, 
  IconButton 
} from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from 'yup';
import { LoadingButton } from '@mui/lab';
import { DateTimePicker } from '@mui/x-date-pickers';
import LedgerSelect from '../../ledgers/forms/LedgerSelect';
import { useSnackbar } from 'notistack';
import fundTransferServices from './fund-transfer-services';
import TransactionItemForm from '../TransactionItemForm';
import TransactionItemRow from '../TransactionItemRow';
import { HighlightOff } from '@mui/icons-material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import dayjs, { Dayjs } from 'dayjs';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import { Div } from '@jumbo/shared';
import { useLedgerSelect } from '../../ledgers/forms/LedgerSelectProvider';

interface TransferItem {
  debit_ledger_id?: number;
  amount: number;
  description: string;
}

interface TransferResponse {
  message?: string;
}

interface TransferFormValues {
  id?: number;
  credit_ledger_id: number;
  reference?: string;
  narration: string;
  currency_id: number | null;
  exchange_rate: number;
  cost_centers: CostCenter[];
  transactionDate: string;
  items: TransferItem[];
}

interface TransferData {
  id?: number;
  voucherNo?: string;
  credit_ledger_id?: number;
  creditLedgerName?: string;
  reference?: string;
  narration?: string;
  currency?: Currency;
  exchange_rate?: number;
  cost_centers?: CostCenter[];
  transactionDate?: string;
  items?: TransferItem[];
}

interface TransferFormDialogContentProps {
  setOpen: (open: boolean) => void;
  transfer?: TransferData | null;
}

function TransferFormDialogContent({ setOpen, transfer = null }: TransferFormDialogContentProps) {
    const { authOrganization, checkOrganizationPermission } = useJumboAuth();
    const costCenters = authOrganization?.costCenters || [];
    const queryClient = useQueryClient();
    const { ungroupedLedgerOptions } = useLedgerSelect();
    const { enqueueSnackbar } = useSnackbar();
    const [serverError, setServerError] = useState<Record<string, string> | null>(null);
    const [items, setItems] = useState<TransferItem[]>(transfer?.items || []);

    const haveAllCostCenters = checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL);

    const [showWarning, setShowWarning] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [clearFormKey, setClearFormKey] = useState(0);
    const [submitItemForm, setSubmitItemForm] = useState(false);

    const addTransfer = useMutation<TransferResponse, Error, TransferFormValues>({
        mutationFn: fundTransferServices.add,
        onSuccess: (data) => {
            data?.message && enqueueSnackbar(data.message, { variant: 'success' });
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: Error & { response?: any }) => {
            if (error.response) {
                if (error.response.status === 400) {
                    setServerError(error.response?.data?.validation_errors);
                } else {
                    enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
                }
            }
        }
    }); 
    
    const updateTransfer = useMutation<TransferResponse, Error, TransferFormValues>({
        mutationFn: fundTransferServices.update,
        onSuccess: (data) => {
            data?.message && enqueueSnackbar(data.message, { variant: 'success' });
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: Error & { response?: any }) => {
            if (error.response) {
                if (error.response.status === 400) {
                    setServerError(error.response?.data?.validation_errors);
                } else {
                    enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
                }
            }
        }
    });

    const validationSchema = yup.object({
        transactionDate: yup.string().required("Transfer Date is required"),
        narration: yup.string().required("Narration is required"),
        currency_id: yup
            .number()
            .positive('Currency is required')
            .required('Currency is required')
            .typeError('Currency is required'),
        exchange_rate: yup
            .number()
            .positive('Exchange rate is required')
            .required('Exchange rate is required')
            .typeError('Exchange rate is required'),
        credit_ledger_id: yup
            .number()
            .required("Transfer from (credit) Ledger is required")
            .positive('Transfer from (credit) Ledger is required')
            .typeError('Transfer from (credit) Ledger is required'),
        items: yup.array().of(
            yup.object().shape({
                debit_ledger_id: yup.number().required("Transfer to (Debit) account is required"),
                description: yup.string().required("Description is required"),
                amount: yup.number().required("Amount is required").positive('Amount must be greater than 0'),
            })
        ),
        cost_centers: yup
            .array()
            .test(
                'cost-center-required',
                'At least one cost center is required',
            (value) => haveAllCostCenters || (value && value.length > 0)
        ),
    });

    const { 
        register, 
        setError, 
        setValue, 
        handleSubmit, 
        clearErrors, 
        watch, 
        formState: { errors } 
    } = useForm<TransferFormValues>({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
            id: transfer?.id,
            transactionDate: transfer?.transactionDate || dayjs().toISOString(),
            credit_ledger_id: transfer?.credit_ledger_id || 0,
            items: transfer?.items || [],
            reference: transfer?.reference,
            narration: transfer?.narration || '',
            currency_id: transfer?.currency?.id || 1,
            exchange_rate: transfer?.exchange_rate || 1,
            cost_centers: transfer?.cost_centers || (costCenters.length === 1 ? costCenters : []),
        }
    });

    useEffect(() => {
        setValue('items', items);
    }, [items, setValue]);

    const totalAmount = items.reduce((totalAmount, item) => totalAmount + item.amount, 0);

    const saveTransfer = React.useMemo(() => {
        return transfer ? updateTransfer : addTransfer;
    }, [updateTransfer, addTransfer, transfer]);

    const onSubmit = (data: TransferFormValues) => {
        if (items.length === 0) {
          clearErrors("items");
          setError("items", { type: "manual", message: "You must add at least one item" });
          return;
        }
        if (isDirty) {
          setShowWarning(true);
        } else {
            handleSubmit((data) => handleSubmitForm(data))();
        }
    };
      
    const handleConfirmSubmitWithoutAdd = async (data: TransferFormValues) => {
        handleSubmit((data) => handleSubmitForm(data))();
        setIsDirty(false);
        setShowWarning(false);
        setClearFormKey((prev) => prev + 1);
    };
      
    const handleSubmitForm = async (data: TransferFormValues) => {
        const updatedData = { 
            ...data, 
            items: items.map(item => ({
                debit_ledger_id: item.debit_ledger_id,
                amount: item.amount,
                description: item.description
            }))
        };
        await saveTransfer.mutate(updatedData);
    };

    return (
        <>  
            <DialogTitle textAlign={'center'}>{transfer ? `Edit ${transfer.voucherNo}` : `New Transfer Form`}</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container columnSpacing={1} marginBottom={2}>
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <DateTimePicker
                                    label="Transfer Date (MM/DD/YYYY)"
                                    minDate={
                                        checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_BACKDATE, PERMISSIONS.FUND_TRANSFERS_BACKDATE]) ? 
                                        dayjs(authOrganization?.organization.recording_start_date) : 
                                        dayjs().startOf('day')
                                    }
                                    maxDate={
                                        checkOrganizationPermission([PERMISSIONS.ACCOUNTS_TRANSACTIONS_POSTDATE, PERMISSIONS.FUND_TRANSFERS_POSTDATE]) ? 
                                        dayjs().add(10, 'year').endOf('year') : 
                                        dayjs().endOf('day')
                                    }
                                    defaultValue={transfer ? dayjs(transfer.transactionDate) : dayjs()}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            InputProps: { readOnly: true },
                                            error: !!errors?.transactionDate,
                                            helperText: errors?.transactionDate?.message
                                        }
                                    }}
                                    onChange={(newValue: Dayjs | null) => {
                                        setValue('transactionDate', newValue ? newValue.toISOString() : '', {
                                            shouldValidate: true,
                                            shouldDirty: true
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <LedgerSelect
                                    frontError={errors.credit_ledger_id}
                                    defaultValue={ungroupedLedgerOptions.find(ledger => ledger.id === transfer?.credit_ledger_id) || null}
                                    allowedGroups={['Cash and cash equivalents']}
                                    onChange={(newValue) => {
                                        if (Array.isArray(newValue)) return;
                                        setValue('credit_ledger_id', newValue ? newValue.id : 0, {
                                            shouldValidate: true,
                                            shouldDirty: true
                                        });
                                    }}
                                    label="Transfer From (Credit)"
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <TextField
                                    size="small"
                                    label="Reference"
                                    fullWidth
                                    defaultValue={transfer?.reference}
                                    {...register('reference')}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setServerError(null);
                                    }}
                                />
                                <span style={{ color: 'red' }}>{serverError?.reference}</span>
                            </Div>
                        </Grid>
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <CurrencySelector
                                    frontError={errors?.currency_id?.message ? { message: errors.currency_id.message } : null}
                                    defaultValue={transfer?.currency?.id ?? 1}
                                    onChange={(newValue) => {
                                        setValue('currency_id', newValue ? newValue.id : null, {
                                            shouldDirty: true,
                                            shouldValidate: true
                                        });
                                        clearErrors('exchange_rate');
                                        setValue('exchange_rate', newValue?.exchangeRate ? newValue.exchangeRate : 1);
                                    }}
                                />
                            </Div>
                        </Grid>
                        {Number(watch('currency_id')) > 1 && (
                            <Grid size={{xs: 12, md: 4}}>
                                <Div sx={{mt: 1, mb: 1}}>
                                    <TextField
                                        label="Exchange Rate"
                                        fullWidth
                                        size='small'
                                        error={!!errors?.exchange_rate}
                                        helperText={errors?.exchange_rate?.message}
                                        InputProps={{
                                            inputComponent: CommaSeparatedField,
                                        }}
                                        value={watch('exchange_rate')}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setValue('exchange_rate', e.target.value ? sanitizedNumber(e.target.value) : 0, {
                                                shouldValidate: true,
                                                shouldDirty: true
                                            });
                                        }}
                                    />
                                </Div>
                            </Grid>
                        )}
                        <Grid size={{xs: 12, md: watch('currency_id') !== 1 ? 4 : 8}}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <CostCenterSelector
                                    label="Cost Centers"
                                    frontError={errors.cost_centers}
                                    defaultValue={
                                        transfer?.cost_centers || 
                                        (costCenters.length === 1 ? costCenters : [])
                                    }
                                    onChange={(newValue) => {
                                        const valueArray = Array.isArray(newValue)
                                            ? newValue
                                            : newValue
                                            ? [newValue]
                                            : [];

                                        setValue('cost_centers', valueArray, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>
                    </Grid>

                    <TransactionItemForm 
                        setClearFormKey={setClearFormKey} 
                        submitMainForm={handleSubmit((data) => saveTransfer.mutate(data))} 
                        submitItemForm={submitItemForm} 
                        setSubmitItemForm={setSubmitItemForm} 
                        key={clearFormKey} 
                        setIsDirty={setIsDirty} 
                        items={items} 
                        setItems={setItems}
                        isTransfer={true}
                    />

                    {errors?.items?.message && items.length < 1 && (
                        <Alert severity='error'>{errors.items.message}</Alert>
                    )}

                    {items.map((item, index) => (
                        <TransactionItemRow 
                            setClearFormKey={setClearFormKey} 
                            submitMainForm={handleSubmit((data) => saveTransfer.mutate(data))} 
                            submitItemForm={submitItemForm} 
                            setSubmitItemForm={setSubmitItemForm} 
                            setIsDirty={setIsDirty} 
                            key={index} 
                            index={index} 
                            item={item} 
                            items={items} 
                            setItems={setItems}
                            isTransfer={true}
                        />
                    ))}

                    <Divider />
                    <Grid container columnSpacing={1}>
                        <Grid size={11} sx={{ 
                            display: 'flex',
                            direction: 'row',
                            justifyContent: 'flex-end'
                        }}>
                            <Typography variant={"h5"}>
                                {totalAmount?.toLocaleString()}
                            </Typography>
                        </Grid>
                        <Grid size={12}>
                            <Div sx={{mt: 1, mb: 1}}>
                                <TextField
                                    label='Narration'
                                    multiline={true}
                                    rows={2}
                                    fullWidth
                                    error={!!errors?.narration}
                                    helperText={errors?.narration?.message}
                                    size='small'
                                    {...register('narration')}
                                />
                            </Div>
                        </Grid>
                    </Grid>
                </form>

                <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
                    <DialogTitle>            
                        <Grid container alignItems="center" justifyContent="space-between">
                            <Grid size={11}>
                                Unsaved Changes
                            </Grid>
                            <Grid size={1} textAlign="right">
                                <Tooltip title="Close">
                                    <IconButton
                                        size="small" 
                                        onClick={() => setShowWarning(false)}
                                    >
                                        <HighlightOff color="primary" />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </DialogTitle>
                    <DialogContent>
                        Last item was not added to the list
                    </DialogContent>
                    <DialogActions>
                        <Button size="small" onClick={() => {setSubmitItemForm(true); setShowWarning(false);}}>
                            Add and Submit
                        </Button>
                        <Button size="small" onClick={() => handleConfirmSubmitWithoutAdd(watch())} color="secondary">
                            Submit without add
                        </Button>
                    </DialogActions>
                </Dialog>
            </DialogContent>
            <DialogActions>
                <Button size='small' onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <LoadingButton
                    type='submit'
                    onClick={handleSubmit(onSubmit)}
                    loading={addTransfer.isPending || updateTransfer.isPending}
                    size="small"
                    variant='contained'
                >
                    Submit
                </LoadingButton>
            </DialogActions>
        </>
    );
}

export default TransferFormDialogContent;