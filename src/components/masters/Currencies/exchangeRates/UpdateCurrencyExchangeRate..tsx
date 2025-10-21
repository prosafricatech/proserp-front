'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Grid, TextField, Button, DialogContent, DialogActions, DialogTitle } from '@mui/material';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import currencyServices from '../currency-services';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface UpdateCurrencyExchangeRateProps {
  currency: {
    id: number;
    code: string;
  };
  setOpenDialog: (open: boolean) => void;
}

interface FormData {
  id: number;
  as_at: string;
  rate: number | null;
}

interface ApiResponse {
  message: string;
}

const UpdateCurrencyExchangeRate: React.FC<UpdateCurrencyExchangeRateProps> = ({ currency, setOpenDialog }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization } = useJumboAuth();
  const dictionary = useDictionary()

  const { mutate: updateCurrencyExchangeRate, isPending } = useMutation<ApiResponse, Error, FormData>({
    mutationFn: currencyServices.updateCurrencyExchangeRate,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.currencies.form.messages.updateSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(dictionary.currencies.form.errors.messages.updateResponse, {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    as_at: yup.string().required("Date is required").typeError('Date is required'),
    rate: yup.number()
      .min(0.000000000000000000001)
      .required('Exchange rate is required')
      .typeError('Exchange rate is required')
  });

  const { handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: currency.id,
      as_at: dayjs().toISOString(),
      rate: null
    }
  });

  const onSubmit = handleSubmit((data) => {
    if (data.rate !== null) {
      updateCurrencyExchangeRate({
        id: data.id,
        as_at: data.as_at,
        rate: data.rate
      });
    }
  });

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={"center"}>
          {dictionary.currencies.list.updateForm.title.replace ('{currencyName}',currency.code)}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete="off" onSubmit={onSubmit}>
          <Grid container columnSpacing={2}>
            <Grid size={{xs: 12, md: 7}}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <DateTimePicker
                  label={dictionary.currencies.list.updateForm.labels.asAt}
                  minDate={dayjs(authOrganization?.organization?.recording_start_date)}
                  defaultValue={dayjs()}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      error: !!errors.as_at,
                      helperText: errors.as_at?.message,
                      InputProps: {
                        readOnly: true,
                      },
                    }
                  }}
                  onChange={(newValue: Dayjs | null) => {
                    setValue('as_at', newValue ? newValue.toISOString() : dayjs().toISOString(), {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 5}}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.currencies.list.updateForm.labels.rate}
                  fullWidth
                  size='small'
                  error={!!errors?.rate}
                  helperText={errors?.rate?.message}
                  InputProps={{
                    inputComponent: CommaSeparatedField as any,
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue('rate', e.target.value ? sanitizedNumber(e.target.value) : null, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
          </Grid>
          <DialogActions>
            <Button size="small" onClick={() => setOpenDialog(false)}>
              {dictionary.currencies.list.updateForm.buttons.cancel}
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              size="small"
              sx={{ display: 'flex' }}
              loading={isPending}
            >
              {dictionary.currencies.list.updateForm.buttons.update}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default UpdateCurrencyExchangeRate;