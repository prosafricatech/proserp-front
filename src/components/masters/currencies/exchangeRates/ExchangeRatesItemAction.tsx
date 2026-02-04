'use client';

import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useSnackbar } from 'notistack';
import currencyServices from '../currency-services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ExchangeRate {
  id: number;
  rate_datetime: string;
  rate: number;
  updated_by: {
    name: string;
  };
}

interface ExchangeRatesItemActionProps {
  openExchangeRateDeleteDialog: boolean;
  setOpenExchangeRateDeleteDialog: (open: boolean) => void;
  selectedExchangeRate: ExchangeRate | null;
  setSelectedExchangeRate: React.Dispatch<React.SetStateAction<ExchangeRate | null>>;
}

const ExchangeRatesItemAction: React.FC<ExchangeRatesItemActionProps> = ({
  openExchangeRateDeleteDialog,
  setOpenExchangeRateDeleteDialog,
  selectedExchangeRate,
  setSelectedExchangeRate
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const dictionary = useDictionary();

  const { mutate: deleteExchangeRate } = useMutation({
    mutationFn: currencyServices.deleteExchangeRate,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
      enqueueSnackbar(dictionary.currencies.form.messages.deleteSuccess, {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(dictionary.currencies.form.errors.messages.deleteResponse, { variant: 'error' });
    },
  });

  return (
    <Dialog open={openExchangeRateDeleteDialog} onClose={() => setOpenExchangeRateDeleteDialog(false)}>
      <DialogTitle>{dictionary.currencies.list.updateForm.dialog.showDialog.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{dictionary.currencies.list.updateForm.dialog.showDialog.content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setSelectedExchangeRate(null);
            setOpenExchangeRateDeleteDialog(false);
          }}
          color="primary"
        >
          {dictionary.currencies.list.updateForm.actionTittle.cancel}
        </Button>
        <Button
          onClick={() => {
            if (selectedExchangeRate) {
              deleteExchangeRate(selectedExchangeRate.id);
              setSelectedExchangeRate(null);
              setOpenExchangeRateDeleteDialog(false);
            }
          }}
          color="primary"
        >
          {dictionary.currencies.list.updateForm.actionTittle.yes}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExchangeRatesItemAction;
