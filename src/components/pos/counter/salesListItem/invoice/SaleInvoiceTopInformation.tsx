import { 
  Autocomplete, 
  Checkbox, 
  Chip, 
  Divider, 
  Grid, 
  LinearProgress, 
  TextField, 
  Typography 
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState, useCallback } from 'react';
import posServices from '../../../pos-services';
import { useFormContext } from 'react-hook-form';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { SalesOrder } from '../../SalesOrderType';

interface FormValues {
  delivery_note_ids: number[];
  transaction_date: string;
  internal_reference: string;
  customer_reference: string;
  due_date?: string;
  terms_and_instructions?: string;
  narration?: string;
  is_tax_invoice: boolean;
  vat_percentage?: number;
}

interface FormContextType extends FormValues {
  sale: SalesOrder;
  setIsRetrieving: (value: boolean) => void;
  setSale_items: (items: SalesOrder['sale_items']) => void;
  sale_items: SalesOrder['sale_items'];
  transaction_date: string;
  setIsTaxInvoice: (value: boolean) => void;
  isTaxInvoice: boolean;
}

interface DeliveryNote {
  id: number;
  deliveryNo: string;
  is_invoiced: boolean;
}

const SaleInvoiceTopInformation: React.FC = () => {
    const { authOrganization } = useJumboAuth();
    const organization = authOrganization?.organization;
    const [totalAmount, settotalAmount] = useState<number>(0);
    const [vatableAmount, setvatableAmount] = useState<number>(0);
    
    // Use type assertion for the form context
    const formContext = useFormContext<FormValues>();
    const {
        setValue,
        register,
        watch,
        formState: { errors },
    } = formContext;

    // Cast the extended context properties
    const extendedContext = formContext as unknown as FormContextType;
    const {
        sale,
        setIsRetrieving,
        setSale_items,
        sale_items,
        transaction_date,
        setIsTaxInvoice,
        isTaxInvoice
    } = extendedContext;
    
    const currencyCode = sale.currency?.code || 'USD';

    // Fetch delivery notes
    const { data: saleDeliveryNotes, isLoading: isDeliveryNotesLoading } = useQuery<DeliveryNote[]>({
        queryKey: ['saleDeliveryNotes', { saleId: sale.id }],
        queryFn: () => posServices.saleDeliveryNotes(sale.id),
        enabled: !sale.is_instant_sale
    });

    // Mutation for fetching delivery note items
    const { mutateAsync: fetchDeliveryNotesItems } = useMutation({
        mutationFn: posServices.deliveryNotesSalesItems,
    });

    // Calculate amounts
    const calculateAmounts = useCallback(() => {
        if (!sale_items) return;

        const { total, vatable } = sale_items.reduce((acc: { total: number; vatable: number }, item) => {
            const itemTotal = item.rate * item.quantity;
            acc.total += itemTotal;
            if (Number(item.product?.vat_exempted) !== 1) {
                acc.vatable += itemTotal;
            }
            return acc;
        }, { total: 0, vatable: 0 });

        settotalAmount(total);
        setvatableAmount(vatable);
    }, [sale_items]);

    // Retrieve items from selected delivery notes
    const retrieveDeliveryNotesSalesItems = useCallback(async () => {
        const delivery_note_ids = watch('delivery_note_ids');
        
        if (!sale.is_instant_sale && delivery_note_ids?.length > 0) {
            setIsRetrieving(true);
            try {
                const deliveryNotesSalesItems = await fetchDeliveryNotesItems({
                    delivery_note_ids: delivery_note_ids,
                });
                const fetchedItems = deliveryNotesSalesItems.flatMap((item: any) => item.items);
                setSale_items(fetchedItems);
            } catch (error) {
                console.error('Error fetching delivery note items:', error);
            } finally {
                setIsRetrieving(false);
            }
        } else if (!sale.is_instant_sale) {
            setSale_items([]);
        }
    }, [sale.is_instant_sale, watch, setIsRetrieving, fetchDeliveryNotesItems, setSale_items]);

    // VAT calculations
    const vat_registered = !!organization?.settings?.vat_registered;
    const vat_percentage = parseFloat(String(watch('vat_percentage'))) || 0;
    const vatAmount = vatableAmount * vat_percentage / 100;
    const grandTotal = totalAmount + vatAmount;

    // Recalculate when sale items change
    useEffect(() => {
        calculateAmounts();
    }, [calculateAmounts]);

    // Fetch terms and instructions
    const { data: suggestions, isLoading: isSuggestionsLoading } = useQuery<string[]>({ 
        queryKey: ['terms-and-instructions'],
        queryFn: posServices.getTermsandInstructions,
    });

    if (isSuggestionsLoading) {
        return <LinearProgress />;
    }

    if (isDeliveryNotesLoading && !sale.is_instant_sale) {
        return <LinearProgress />;
    }

    return (
        <Grid container spacing={2}>
            <Grid size={{xs: 12, md: 9}}>
                <form autoComplete='off'>
                    <Grid container spacing={2}>
                        {/* Invoice Date */}
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{ mt: 0.3 }}>
                                <DateTimePicker
                                    label='Invoice Date'
                                    minDate={dayjs(organization?.recording_start_date)}
                                    value={dayjs(transaction_date)}
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
                                    onChange={(newValue) => {
                                        setValue('transaction_date', newValue?.toISOString() || '', {
                                            shouldValidate: true,
                                            shouldDirty: true
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>

                        {/* Internal Reference */}
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{ mt: 0.3 }}>
                                <TextField
                                    size='small'
                                    label='Internal Reference'
                                    fullWidth
                                    {...register('internal_reference')}
                                />
                            </Div>
                        </Grid>

                        {/* Customer Reference */}
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{ mt: 0.3 }}>
                                <TextField
                                    size='small'
                                    label='Customer Reference'
                                    fullWidth
                                    {...register('customer_reference')}
                                />
                            </Div>
                        </Grid>

                        {/* Delivery Notes (for non-instant sales) */}
                        {!sale.is_instant_sale && (
                            <Grid size={{xs: 12, md: 8}}>
                                <Div sx={{ mt: 0.3 }}>
                                    <Autocomplete
                                        size="small"
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        options={saleDeliveryNotes?.filter(item => !item.is_invoiced) || []}
                                        multiple
                                        disableCloseOnSelect
                                        getOptionLabel={(option) => option.deliveryNo}
                                        renderInput={(params) => (
                                            <TextField 
                                                {...params} 
                                                label="Delivery Note"
                                                error={!!errors?.delivery_note_ids}
                                                helperText={errors?.delivery_note_ids?.message}
                                            />
                                        )}
                                        renderTags={(tagValue, getTagProps) => 
                                            tagValue.map((option, index) => (
                                                <Chip 
                                                    {...getTagProps({ index })} 
                                                    key={option.id} 
                                                    label={option.deliveryNo} 
                                                />
                                            ))
                                        }
                                        onChange={(_, newValue) => {
                                            setValue(
                                                'delivery_note_ids', 
                                                newValue?.map(value => value.id) || [],
                                                { shouldDirty: true, shouldValidate: true }
                                            );
                                            retrieveDeliveryNotesSalesItems();
                                        }}
                                    />
                                </Div>
                            </Grid>
                        )}

                        {/* Due Date */}
                        <Grid size={{xs: 12, md: 4}}>
                            <Div sx={{ mt: 0.3 }}>
                                <DateTimePicker
                                    label='Due Date'
                                    minDate={dayjs(watch('transaction_date'))}
                                    slotProps={{
                                        textField: {
                                            size: 'small',
                                            fullWidth: true,
                                            error: !!errors?.due_date,
                                            helperText: errors?.due_date?.message
                                        }
                                    }}
                                    onChange={(newValue) => {
                                        setValue('due_date', newValue?.toISOString() || '', {
                                            shouldValidate: true,
                                            shouldDirty: true
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>

                        {/* Terms and Instructions */}
                        <Grid size={{xs: 12, md: !sale.is_instant_sale ? 6 : 4}}>
                            <Div sx={{ mt: 0.3 }}>
                                <Autocomplete
                                    freeSolo
                                    options={suggestions || []}
                                    getOptionLabel={(option) => option}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            label="Terms and Instructions" 
                                            size="small" 
                                            fullWidth 
                                            multiline
                                            rows={2}
                                            error={!!errors.terms_and_instructions}
                                            helperText={errors.terms_and_instructions?.message}
                                        />
                                    )}
                                    onChange={(_, newValue) => {
                                        setValue('terms_and_instructions', newValue || '', {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                    }}
                                />
                            </Div>
                        </Grid>

                        {/* Narration */}
                        <Grid size={{xs: 12, md: !sale.is_instant_sale ? 6 : 4}}>
                            <Div sx={{ mt: 0.3 }}>
                                <TextField
                                    size='small'
                                    label='Narration'
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    {...register('narration')}
                                />
                            </Div>
                        </Grid>

                        {/* Tax Invoice Checkbox */}
                        {organization?.is_tra_connected && (!organization?.is_vat_registered || sale.vat_amount > 0) && (
                            <Grid size={12}>
                                <Div sx={{ mt: 0.3, display: 'flex', alignItems: 'center' }}>
                                    <Checkbox
                                        checked={isTaxInvoice}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setIsTaxInvoice(isChecked);
                                            setValue('is_tax_invoice', isChecked, {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            });
                                        }}
                                    />
                                    <Typography variant="body1">Post VFD</Typography>
                                </Div>
                            </Grid>
                        )}
                    </Grid>
                </form>
            </Grid>

            {/* Summary Section */}
            <Grid size={{xs: 12, md: 3}}>
                <Grid container spacing={1}>
                    <Grid size={12}>
                        <Typography align='center' variant='h5'>Summary</Typography>
                        <Divider />
                    </Grid>

                    <Grid size={6}>
                        <Typography variant='body2'>Total:</Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography align='right'>
                            {totalAmount?.toLocaleString("en-US", { 
                                style: "currency", 
                                currency: currencyCode 
                            })}
                        </Typography>
                    </Grid>

                    {vat_registered && (
                        <>
                            <Grid size={6}>
                                <Typography variant='body2'>VAT Amount:</Typography>
                            </Grid>
                            <Grid size={6}>
                                <Typography align='right'>
                                    {vatAmount?.toLocaleString("en-US", { 
                                        style: "currency", 
                                        currency: currencyCode 
                                    })}
                                </Typography>
                            </Grid>

                            <Grid size={6}>
                                <Typography variant='body2'>Grand Total:</Typography>
                            </Grid>
                            <Grid size={6}>
                                <Typography align='right'>
                                    {grandTotal.toLocaleString("en-US", { 
                                        style: "currency", 
                                        currency: currencyCode 
                                    })}
                                </Typography>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default SaleInvoiceTopInformation;