'use client';

import { Box, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import smsServices from './smsServices';
import { useSnackbar } from 'notistack';

export default function BalanceForm() {
    const { enqueueSnackbar } = useSnackbar();
    const [currentBalance, setCurrentBalance] = useState(null);

    const mutation = useMutation({
        mutationFn: smsServices.checkBalance,
        onSuccess: (data) => {
            enqueueSnackbar(`Current SMS Balance: ${data.sms_balance} sms`, { variant: 'success' });
            setCurrentBalance(data.sms_balance);
        },
        onError: (err) => {
            enqueueSnackbar('Error checking balance', { variant: 'error' });
        }
    });

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentBalance ? (
                <Typography variant="h6">Current SMS Balance: {currentBalance} sms</Typography>
            ) : (
                <Typography variant="h6">Check SMS Balance</Typography>
            )}

            <LoadingButton
                onClick={() => mutation.mutate()}
                variant="contained"
                loading={mutation.isPending}
            >
                Check Balance
            </LoadingButton>
        </Box>
    );
}