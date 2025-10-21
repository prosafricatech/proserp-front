import { LoadingButton } from '@mui/lab'
import { Button, DialogActions, Grid, Input } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers';
import React from 'react'
import { useForm } from 'react-hook-form'
import LedgerSelect from '../../accounts/ledgers/forms/LedgerSelect';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import * as yup  from "yup";
import {yupResolver} from '@hookform/resolvers/yup'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import productServices from './productServices';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function ProductsExcelImport({setOpenDialog}) {
      //Validation schema
    const validationSchema = yup.object({
        stock_as_at: yup
            .string()
            .required('Stock Date is required').typeError('Stock Date is required'),
        stock_complement_ledger_id: yup
                .number().positive('Complement Ledger is required')
                .required('Complement Ledger is required').typeError('Complement Ledger is required'),
    });

    const {register, handleSubmit, setValue, formState: {errors}} = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            stock_as_at: dayjs().toISOString()
        }
    });
    const queryClient = useQueryClient();
    const {enqueueSnackbar} = useSnackbar();
    const {authOrganization} = useJumboAuth();
    const dictionary = useDictionary();

    const uploadExcel = useMutation({
        mutationFn: productServices.importProductsExcel,
        onSuccess: (data) => {
            if (data?.message) {
                enqueueSnackbar(data.message, { variant: 'success' });
            }
            setOpenDialog(false);
            queryClient.invalidateQueries({ queryKey: ['productParams'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message;
            if (message) {
                enqueueSnackbar(message, { variant: 'error' });
            }
        },
    });

  return (
    <form autoComplete='off' onSubmit={handleSubmit(uploadExcel.mutate)}>
        <Grid container mt={3} py={1} spacing={2}>

            <Grid size={12}>
                <Input
                    label={'Products Excel'}
                    type="file"
                    required
                    id="excel-import"
                    {...register("products_excel")}
                />
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
                <DateTimePicker
                    label={dictionary.products.excelForm.labels.stockAsAt}
                    fullWidth
                    defaultValue={dayjs()}
                    minDate={dayjs(authOrganization.organization.recording_start_date)}
                    slotProps={{
                        textField : {
                            size: 'small',
                            fullWidth: true,
                            readOnly: true,
                            error: !!errors?.stock_as_at,
                            helperText: errors?.stock_as_at?.message
                        }
                    }}
                    onChange={(newValue) => {
                        setValue('stock_as_at', newValue ? newValue.toISOString() : null,{
                            shouldValidate: true,
                            shouldDirty: true
                        });
                    }}
                />
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
                <LedgerSelect
                    label={dictionary.products.excelForm.labels.stockComplementtLedger}
                    allowedGroups={['Capital','Expenses','Accounts Payable']}
                    frontError={errors.stock_complement_ledger_id}
                    onChange={(newValue) => setValue('stock_complement_ledger_id', !!newValue ? newValue.id : null,{
                        shouldValidate: true,
                        shouldDirty: true
                    })}
                />
            </Grid>
        </Grid>
        <DialogActions>
            <Button
                size='small'
                onClick={() => setOpenDialog(false)}
            >
            {dictionary.products.excelForm.buttons.cancel}
            </Button>
            <LoadingButton
                size='small'
                loading={uploadExcel.isPending}
                type='submit'
                variant='contained'
                color='success'
            >
                {dictionary.products.excelForm.buttons.upload}
            </LoadingButton>
        </DialogActions>
    </form>
  )
}

export default ProductsExcelImport