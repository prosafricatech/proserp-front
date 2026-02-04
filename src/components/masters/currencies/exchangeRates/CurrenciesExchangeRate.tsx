'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Dialog,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddOutlined, DeleteOutlined } from '@mui/icons-material';
import currencyServices from '../currency-services';
import dayjs, { Dayjs } from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import ExchangeRatesItemAction from './ExchangeRatesItemAction';
import { deviceType } from '@/utilities/helpers/user-agent-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import UpdateCurrencyExchangeRate from './UpdateCurrencyExchangeRate.';
import { Currency } from '../CurrencyType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ExchangeRate {
  id: number;
  rate_datetime: string;
  rate: number;
  updated_by: {
    name: string;
  };
}

interface CurrenciesExchangeRateProps {
  expanded: boolean;
  currency: Currency;
}

const CurrenciesExchangeRate: React.FC<CurrenciesExchangeRateProps> = ({
  expanded,
  currency,
}) => {
  const { authOrganization } = useJumboAuth();
  const [openAddExchangeRate, setOpenAddExchangeRate] = useState(false);
  const [selectedExchangeRate, setSelectedExchangeRate] = useState<ExchangeRate | null>(null);
  const [openExchangeRateDeleteDialog, setOpenExchangeRateDeleteDialog] = useState(false);
  const [fromDate, setFromDate] = useState<Dayjs>(
    dayjs().subtract(1, 'month').startOf('day')
  );
  const [toDate, setToDate] = useState<Dayjs>(dayjs().endOf('day'));
  const isMobile = deviceType() === 'mobile';
  const dictionary = useDictionary()

  const { data: exchangeRates, isPending, refetch } = useQuery<ExchangeRate[]>({
    queryKey: ['exchangeRates', { id: currency.id, from: fromDate.toISOString(), to: toDate.toISOString() }],
    queryFn: () =>
      currencyServices.getExchangeRate({
        currencyId: currency.id,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      }),
    enabled: currency.id > 1 && !!expanded,
  });

  // Refetch exchange rates when fromDate or toDate changes
  useEffect(() => {
    if (expanded && currency.id > 1) {
      refetch();
    }
  }, [fromDate, toDate, expanded, refetch, currency.id]);

  return (
    <>
      <Grid container sx={{width: '100%'}}>
        {currency.id > 1 && (
          <Grid size={12} textAlign={'end'}>
            <Tooltip title={dictionary.currencies.list.labels.addExchangeRate}>
              <IconButton onClick={() => setOpenAddExchangeRate(true)}>
                <AddOutlined />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
        <Grid size={12}>
          {currency.id > 1 && isPending ? (
            <Grid size={12}>
              <LinearProgress />
            </Grid>
          ) : (
            currency.id > 1 && (
              <Grid container justifyContent={'center'} spacing={1} marginBottom={1}>
                <Grid size={{xs: 12, md: 3}}>
                  <DateTimePicker
                    label={dictionary.currencies.list.updateForm.dateTime.labels.start}
                    value={fromDate}
                    onChange={(date) => {
                      if (date) setFromDate(date);
                    }}
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <DateTimePicker
                    label={dictionary.currencies.list.updateForm.dateTime.labels.end}
                    value={toDate}
                    onChange={(date) => {
                      if (date) setToDate(date);
                    }}
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            )
          )}

          {exchangeRates && exchangeRates.length > 0 ? (
            exchangeRates.map((exchangeRate) => (
              <Grid
                key={exchangeRate.id}
                sx={{
                  cursor: 'pointer',
                  borderTop: 1,
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  paddingX: 1,
                }}
                columnSpacing={2}
                alignItems={'center'}
                mb={1}
                container
              >
                <Grid size={{xs: 6, md: 3}}>
                  <Tooltip title={dictionary.currencies.list.updateForm.exchangeRate.labels.date}>
                    <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
                      {readableDate(exchangeRate.rate_datetime, true)}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 3}}>
                  <Tooltip title={dictionary.currencies.list.updateForm.exchangeRate.labels.rate}>
                    <Typography textAlign={{ xs: 'end', md: 'start' }}>
                      {exchangeRate.rate}
                    </Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 4}}>
                  <Tooltip title={dictionary.currencies.list.updateForm.exchangeRate.labels.updateBy}>
                    <Typography>{exchangeRate.updated_by.name}</Typography>
                  </Tooltip>
                </Grid>
                <Grid size={{xs: 6, md: 2}}>
                  <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}>
                    <Tooltip title={dictionary.currencies.list.updateForm.actionTittle.delete}>
                      <IconButton
                        onClick={() => {
                          setSelectedExchangeRate(exchangeRate);
                          setOpenExchangeRateDeleteDialog(true);
                        }}
                      >
                        <DeleteOutlined color="error" fontSize={'small'} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            ))
          ) : (
            currency.id === 1 && (
              <Grid size={12}>
                <Alert variant="outlined" severity="info">
                  {dictionary.currencies.list.updateForm.exchangeRate.alert.info}
                </Alert>
              </Grid>
            )
          )}

          {/* ItemAction */}
          <ExchangeRatesItemAction
            openExchangeRateDeleteDialog={openExchangeRateDeleteDialog}
            setOpenExchangeRateDeleteDialog={setOpenExchangeRateDeleteDialog}
            selectedExchangeRate={selectedExchangeRate}
            setSelectedExchangeRate={setSelectedExchangeRate}
          />
        </Grid>
      </Grid>

      <Dialog
        open={openAddExchangeRate}
        maxWidth={'sm'}
        fullScreen={isMobile}
        scroll={isMobile ? 'body' : 'paper'}
        fullWidth
      >
        <UpdateCurrencyExchangeRate currency={currency} setOpenDialog={setOpenAddExchangeRate} />
      </Dialog>
    </>
  );
};

export default CurrenciesExchangeRate;
