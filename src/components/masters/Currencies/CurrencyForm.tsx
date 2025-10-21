'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Grid, TextField, Button, DialogContent, DialogActions, DialogTitle, Autocomplete } from '@mui/material';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import currencyServices from './currency-services';
import { useCurrencySelect } from './CurrencySelectProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { CURRENCIES } from '@/utilities/constants/currencies';
import { Div } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface CurrencyFormProps {
  setOpenDialog: (open: boolean) => void;
}

interface FormData {
  currency_code: string;
  exchange_rate: number;
}

interface CurrencyOption {
  code: string;
  name: string;
  name_plural: string;
  symbol: string;
}

interface ApiResponse {
  message: string;
}

const CurrencyForm: React.FC<CurrencyFormProps> = ({ setOpenDialog }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const currencyContext = useCurrencySelect();
  const dictionary = useDictionary()

  const { mutate: addCurrency, isPending } = useMutation<ApiResponse, Error, FormData>({
    mutationFn: (data: FormData) => currencyServices.add(data),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.currencies.form.messages.createSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
    onError: (error) => {
      enqueueSnackbar(dictionary.currencies.form.errors.messages.createResponse, {
        variant: 'error',
      });
    },
  });

  const validationSchema = yup.object({
    currency_code: yup.string().required(dictionary.currencies.form.errors.validation.currencyCode.required).typeError(dictionary.currencies.form.errors.validation.currencyCode.typeError),
    exchange_rate: yup.number()
      .min(0.000000000000000000001,dictionary.currencies.form.errors.validation.exchangeRate.min)
      .required(dictionary.currencies.form.errors.validation.exchangeRate.required)
      .typeError(dictionary.currencies.form.errors.validation.exchangeRate.typeError)
  });

 // Safely get currencies array
  const currencies = React.useMemo(() => {
    if (!currencyContext?.currencies) return [];
    return Array.isArray(currencyContext.currencies) ? currencyContext.currencies : [];
  }, [currencyContext]);

  // Memoize available currencies
  const availableCurrencies = React.useMemo(() => {
    return CURRENCIES
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(currency => !currencies.some(curr => curr?.code === currency.code));
  }, [currencies]);

  const { handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = handleSubmit((data) => {
    addCurrency(data);
  });

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={"center"}>
          {dictionary.currencies.form.title}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete="off" onSubmit={onSubmit}>
          <Grid container spacing={2}>
            <Grid size={{xs: 12, md: 7}}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Autocomplete<CurrencyOption>
                  id="checkboxes-currencies"
                  options={availableCurrencies}
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  getOptionLabel={(option) => `${option.name_plural} (${option.code})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={dictionary.currencies.form.labels.currencyName}
                      size="small"
                      fullWidth
                      error={!!errors.currency_code}
                      helperText={errors.currency_code?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    setValue('currency_code', newValue?.code ?? '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 5}}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label={dictionary.currencies.form.labels.exchangeRate}
                  fullWidth
                  size='small'
                  error={!!errors?.exchange_rate}
                  helperText={errors?.exchange_rate?.message}
                  InputProps={{
                    inputComponent: CommaSeparatedField as any,
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue('exchange_rate', e.target.value ? sanitizedNumber(e.target.value) : 0, {
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
              {dictionary.currencies.form.buttons.cancel}
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              size="small"
              sx={{ display: 'flex' }}
              loading={isPending}
            >
              {dictionary.currencies.form.buttons.add}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default CurrencyForm;