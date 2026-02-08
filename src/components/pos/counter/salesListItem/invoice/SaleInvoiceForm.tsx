import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import React, { useState } from 'react';
import posServices from '../../../pos-services';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm, UseFormReturn, FieldValues, useFormContext } from 'react-hook-form';
import { 
  Button, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Grid 
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import SaleInvoiceTopInformation from './SaleInvoiceTopInformation';
import SaleInvoiceItems from './SaleInvoiceItems';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SalesOrder } from '../../SalesOrderType';

interface SaleInvoiceFormProps {
  toggleOpen: (open: boolean) => void;
  sale?: SalesOrder | null;
}

interface FormValues {
  id?: number;
  is_instant_sale: boolean;
  internal_reference: string;
  vat_percentage?: number;
  customer_reference: string;
  delivery_note_ids: string[];
  narration: string;
  is_tax_invoice: boolean;
  transaction_date: string;
}

// Create a context type that combines form methods and custom props
interface FormContextType extends UseFormReturn<FormValues> {
  sale: SalesOrder | null;
  isRetrieving: boolean;
  setIsRetrieving: (value: boolean) => void;
  sale_items: any[];
  setSale_items: (items: any[]) => void;
  transaction_date: dayjs.Dayjs;
  isTaxInvoice: boolean;
  setIsTaxInvoice: (value: boolean) => void;
}

const SaleInvoiceForm: React.FC<SaleInvoiceFormProps> = ({ toggleOpen, sale = null }) => {
    const [transaction_date] = useState(dayjs());
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient(); 
    const [isRetrieving, setIsRetrieving] = useState(false);
    const [sale_items, setSale_items] = useState(!sale?.is_instant_sale ? [] : sale?.sale_items || []);
    const [isTaxInvoice, setIsTaxInvoice] = useState(false);

    const addInvoiceSale = useMutation({
      mutationFn: posServices.invoiceSale,
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
      return addInvoiceSale.mutate;
    },[addInvoiceSale]);

    const validationSchema = yup.object({
      transaction_date: yup.string().required('Invoice Date is required').typeError('Invoice Date is required'),
    });

    const methods = useForm<FormValues>({
      resolver: yupResolver(validationSchema) as any,
      defaultValues: {
        id: sale?.id,
        is_instant_sale: sale?.is_instant_sale || false,
        internal_reference: sale?.saleNo || '',
        vat_percentage: sale?.vat_percentage,
        customer_reference: '',
        delivery_note_ids: [],
        narration: '',
        is_tax_invoice: isTaxInvoice,
        transaction_date: transaction_date.toISOString(),
      }
    });

    // Create the context value that combines form methods and our custom props
    const formContext: FormContextType = {
      ...methods,
      sale,
      isRetrieving,
      setIsRetrieving,
      sale_items,
      setSale_items,
      transaction_date,
      isTaxInvoice,
      setIsTaxInvoice
    };

    return (
      <FormProvider {...formContext}>
          <DialogTitle>
              <Grid container columnSpacing={2}>
                  <Grid size={12} mb={3} textAlign={'center'}>New Invoice</Grid>
                  <SaleInvoiceTopInformation/>
              </Grid>
          </DialogTitle>

          <DialogContent>
              <SaleInvoiceItems/>
          </DialogContent>

          <DialogActions>
              <Button size='small' onClick={() => toggleOpen(false)}>
                  Cancel
              </Button>
              <LoadingButton
                  loading={addInvoiceSale.isPending}
                  size='small'
                  type='submit'
                  disabled={!sale?.is_instant_sale && !(sale_items.length > 0)}
                  variant='contained'
                  onClick={methods.handleSubmit((data) => saveMutation(data))}
              >
                  Invoice
              </LoadingButton>
          </DialogActions>
      </FormProvider>
    );
};

// Create a custom hook to use our extended form context
export const useSaleInvoiceFormContext = () => {
  return useFormContext<FormValues>() as FormContextType;
};

export default SaleInvoiceForm;