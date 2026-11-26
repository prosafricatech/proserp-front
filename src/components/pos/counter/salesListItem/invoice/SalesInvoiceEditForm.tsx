import { 
  Autocomplete, 
  Button, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Divider, 
  Grid, 
  LinearProgress, 
  ListItemText, 
  Skeleton, 
  TextField, 
  Tooltip, 
  Typography 
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import posServices from '../../../pos-services';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Div } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface InvoiceItem {
  id: number;
  product: {
    name: string;
    vat_exempted?: number;
  };
  description: string;
  measurement_unit: {
    symbol: string;
  };
  quantity: number;
  rate: number;
  vat_amount: number;
}

interface InvoiceData {
  id?: number;
  invoiceNo: string;
  transaction_date: string;
  due_date: string | null;
  internal_reference: string;
  customer_reference: string;
  narration: string;
  terms_and_instructions: string;
  currency: {
    code: string;
  };
  items: InvoiceItem[];
}

interface SalesInvoiceEditFormProps {
  invoiceData: InvoiceData;
  toggleOpen: (open: boolean) => void;
}

const SalesInvoiceEditForm: React.FC<SalesInvoiceEditFormProps> = ({ invoiceData, toggleOpen }) => {
    const dictionary = useDictionary();
    const [transaction_date] = useState<Dayjs>(invoiceData ? dayjs(invoiceData.transaction_date) : dayjs());
    const [due_date] = useState<Dayjs>(invoiceData.due_date !== null ? dayjs(invoiceData.due_date) : dayjs());
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient(); 
    const { authOrganization } = useJumboAuth();
    const organization = authOrganization?.organization;
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [vatableAmount, setVatableAmount] = useState<number>(0);
    const [sale_items, setSale_items] = useState<InvoiceItem[]>(invoiceData ? invoiceData.items : []);
    const currencyCode = invoiceData.currency.code;

    const updateInvoice = useMutation({
        mutationFn: posServices.updateInvoice,
        onSuccess: (data) => {
            toggleOpen(false);
            enqueueSnackbar(data.message, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['SaleInvoices'] });
            queryClient.invalidateQueries({ queryKey: ['counterSales'] });
        },
        onError: (error: any) => {
            error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
        }
    });

    const saveMutation = React.useMemo(() => {
        return updateInvoice.mutate;
    }, [updateInvoice]);

    const validationSchema = yup.object({
        transaction_date: yup.string().required(dictionary.forms.counter.invoice.validation.invoiceDateRequired).typeError(dictionary.forms.counter.invoice.validation.invoiceDateRequired),
    });

    const { 
        setValue, 
        register, 
        handleSubmit, 
        watch, 
        formState: { errors } 
    } = useForm({
        resolver: yupResolver(validationSchema) as any,
        defaultValues: {
            id: invoiceData?.id,
            internal_reference: invoiceData.internal_reference,
            customer_reference: invoiceData.customer_reference,
            narration: invoiceData.narration,
            terms_and_instructions: invoiceData.terms_and_instructions,
            transaction_date: transaction_date.toISOString(),
            due_date: due_date.toISOString()
        }
    });

    const vat_registered = !!organization?.settings?.vat_registered;

    useEffect(() => {
        let total = 0;
        let vatable = 0;

        sale_items.forEach((item) => {
            total += item.rate * item.quantity;
            if (item.product?.vat_exempted !== 1) {
                vatable += item.vat_amount;
            }
        });
        setTotalAmount(total);
        setVatableAmount(vatable);
    }, [sale_items]);

    const { data: suggestions, isLoading: isFetching } = useQuery({
        queryKey: ['terms-and-instructions'],
        queryFn: posServices.getTermsandInstructions,
    });
  
    if (isFetching) {
            return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
      </div>
    );
    }

    return (
        <>
            <DialogTitle>
                <Grid container columnSpacing={2}>
                    <Grid textAlign={'center'} size={12} mb={3}>{dictionary.forms.counter.invoice.editTitle.replace('{invoiceNo}', invoiceData.invoiceNo)}</Grid>
                    <Grid size={{xs: 12, md: 9}} mb={2}>
                        <form autoComplete='off'>
                            <Grid container columnSpacing={1} rowSpacing={2}>
                                <Grid size={{xs: 12, md: 4}}>
                                    <Div sx={{mt: 0.3}}>
                                        <DateTimePicker
                                            label={dictionary.forms.counter.invoice.labels.invoiceDate}
                                            minDate={dayjs(organization?.recording_start_date)}
                                            value={watch('transaction_date') ? dayjs(watch('transaction_date')) : null}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                    InputProps: {
                                                        readOnly: true
                                                    },
                                                    error: !!errors?.transaction_date,
                                                    helperText: errors?.transaction_date?.message
                                                }
                                            }}
                                            onChange={(newValue: Dayjs | null) => {
                                                setValue('transaction_date', newValue ? newValue.toISOString() : '', {
                                                    shouldValidate: true,
                                                    shouldDirty: true
                                                });
                                            }}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 4}}>
                                    <Div sx={{mt: 0.3}}>
                                        <TextField
                                            size='small'
                                            label={dictionary.forms.counter.invoice.labels.internalReference}
                                            fullWidth
                                            {...register('internal_reference')}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 4}}>
                                    <Div sx={{mt: 0.3}}>
                                        <TextField
                                            size='small'
                                            label={dictionary.forms.counter.invoice.labels.customerReference}
                                            fullWidth
                                            {...register('customer_reference')}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 4}}>
                                    <Div sx={{mt: 0.3}}>
                                        <DateTimePicker
                                            label={dictionary.forms.counter.invoice.labels.dueDate}
                                            minDate={dayjs(watch('transaction_date'))}
                                            value={watch('due_date') ? dayjs(watch('due_date')) : null}
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    fullWidth: true,
                                                    InputProps: {
                                                        readOnly: true
                                                    },
                                                    error: !!errors?.due_date,
                                                    helperText: errors?.due_date?.message
                                                }
                                            }}
                                            onChange={(newValue: Dayjs | null) => {
                                                setValue('due_date', newValue ? newValue.toISOString() : '', {
                                                    shouldValidate: true,
                                                    shouldDirty: true
                                                });
                                            }}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 4}}>
                                    <Div sx={{ mt: 0.3}}>
                                        <Autocomplete
                                            freeSolo
                                            options={suggestions || []}
                                            isOptionEqualToValue={(option, value) => option === value}
                                            getOptionLabel={(option) => option}
                                            defaultValue={invoiceData.terms_and_instructions}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    label={dictionary.forms.counter.invoice.labels.termsAndInstructions} 
                                                    size="small" 
                                                    fullWidth 
                                                    multiline
                                                    rows={2}
                                                    error={!!errors.terms_and_instructions}
                                                    helperText={errors.terms_and_instructions?.message}
                                                />
                                            )}
                                            onChange={(_, newValue: string | null) => {
                                                setValue('terms_and_instructions', newValue || '', {
                                                    shouldValidate: true,
                                                    shouldDirty: true,
                                                });
                                            }}
                                        />
                                    </Div>
                                </Grid>
                                <Grid size={{xs: 12, md: 4}}>
                                    <Div sx={{mt: 0.3}}>
                                        <TextField
                                            size='small'
                                            label={dictionary.forms.counter.invoice.labels.narration}
                                            fullWidth
                                            multiline
                                            minRows={2}
                                            {...register('narration')}
                                        />
                                    </Div>
                                </Grid>
                            </Grid>
                        </form>
                    </Grid>
                    <Grid size={{xs: 12, md: 3}}>
                        <Grid container columnSpacing={1}>
                            <Grid size={12}>
                                <Typography align='center' variant='h3'>{dictionary.forms.counter.invoice.labels.summary}</Typography>
                                <Divider/>
                            </Grid>
                            <Grid size={6}>
                                <Typography align='left' variant='body2'>{dictionary.forms.counter.invoice.labels.total}:</Typography>
                            </Grid>
                            <Grid size={6}>
                                <Typography align='right' variant='h5'>
                                    {totalAmount?.toLocaleString("en-US", {style:"currency", currency:currencyCode})}
                                </Typography>
                            </Grid>
                            {vat_registered && (
                                <>
                                    <Grid size={6}>
                                        <Typography align='left' variant='body2'>{dictionary.forms.counter.invoice.labels.vatAmount}:</Typography>
                                    </Grid>
                                    <Grid size={6}>
                                        <Typography align='right' variant='h5'>
                                            {vatableAmount?.toLocaleString("en-US", {style:"currency", currency:currencyCode}) || '0'}
                                        </Typography>
                                    </Grid>
                                    <Grid size={6}>
                                        <Typography align='left' variant='body2'>{dictionary.forms.counter.invoice.labels.grandTotal}:</Typography>
                                    </Grid>
                                    <Grid size={6}>
                                        <Typography align='right' variant='h5'>
                                            {(totalAmount + vatableAmount).toLocaleString("en-US", {style:"currency", currency:currencyCode})}
                                        </Typography>
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </DialogTitle>

            <DialogContent>
                {sale_items?.map((item, index) => (
                    <Grid
                        container
                        spacing={1}
                        key={`${item.product}-${index}`}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'action.hover',
                            },
                        }}
                    >
                        <Grid size={12}>
                            <Divider />
                        </Grid>
                        <Grid size={0.5}>
                            <Div sx={{ mt: 1.7, mb: 1.7 }}>{index + 1}.</Div>
                        </Grid>
                        <Grid size={{xs: 11.5, md: 8, lg: 5}}>
                            <Div sx={{ mt: 1.7, mb: 1.7 }}>
                                <ListItemText
                                    primary={
                                        <Tooltip title={dictionary.tooltips.product}>
                                            <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                                                {item.product.name}
                                            </Typography>
                                        </Tooltip>
                                    }
                                    secondary={
                                        <Tooltip title={dictionary.tooltips.description}>
                                            <Typography component="span" variant="body2" fontSize={14} lineHeight={1.25} mb={0}>
                                                {item.description}
                                            </Typography>
                                        </Tooltip>
                                    }
                                />
                            </Div>
                        </Grid>
                        <Grid size={{xs: 2, md: 3.5, lg: 1.5}} sx={{ textAlign: 'center' }}>
                            <Div sx={{ mt: 1.7, mb: 1.7 }}>
                                <Tooltip title={dictionary.tooltips.quantity}>
                                    <Typography>{`${item.measurement_unit?.symbol || ''} ${item.quantity}`}</Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                        <Grid size={{xs: 4, md: 4, lg: 2.5}} sx={{ textAlign: 'center' }}>
                            <Div sx={{ mt: 1.7, mb: 1.7 }}>
                                <Tooltip title={dictionary.tooltips.rate}>
                                    <Typography>{item.rate?.toLocaleString("en-US", {style:"currency", currency:currencyCode})}</Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                        <Grid size={{xs: 4, md: 4, lg: 2.5}} sx={{ textAlign: 'center' }}>
                            <Div sx={{ mt: 1.7, mb: 1.7 }}>
                                <Tooltip title={dictionary.tooltips.amount}>
                                    <Typography>{(item.rate * item.quantity).toLocaleString("en-US", {style:"currency", currency:currencyCode})}</Typography>
                                </Tooltip>
                            </Div>
                        </Grid>
                    </Grid>
                ))}
            </DialogContent>

            <DialogActions>
                <Button size='small' onClick={() => toggleOpen(false)}>
                    {dictionary.forms.counter.invoice.buttons.cancel}
                </Button>
                <LoadingButton
                    loading={updateInvoice.isPending}
                    size='small'
                    type='submit'
                    variant='contained'
                    onClick={handleSubmit((data) => saveMutation(data))}
                >
                    {dictionary.forms.counter.invoice.buttons.save}
                </LoadingButton>
            </DialogActions>
        </>
    );
};

export default SalesInvoiceEditForm;