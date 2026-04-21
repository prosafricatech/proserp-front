'use client';

import React, { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useCurrencySelect } from './CurrencySelectProvider';
import { Currency } from './CurrencyType';

interface CurrencySelectorProps {
    onChange?: (newValue: Currency | null) => void;
    frontError?: { message: string } | null;
    label?: string;
    defaultValue?: number;
    disabled?: boolean;
    readOnly?: boolean;
}

function CurrencySelector({
    onChange,
    frontError = null,
    label = 'Currency',
    defaultValue = 1,
    disabled = false,
    readOnly = false
}: CurrencySelectorProps) {
    const { currencies } = useCurrencySelect();

    const currencyList = Array.isArray(currencies) ? currencies : [];

    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
        () => currencyList.find(currency => currency.id === defaultValue) || null
    );

    return (
        <Autocomplete<Currency>
            size="small"
            isOptionEqualToValue={(option, value) => option.id === value.id}
            options={currencyList}
            readOnly={readOnly}
            disabled={disabled}
            getOptionLabel={(currency) => `${currency.name_plural} (${currency.symbol})`}
            value={selectedCurrency || null}
            renderInput={(params) => (
                <TextField
                    {...params}
                    required
                    error={!!frontError}
                    helperText={frontError?.message}
                    label={label}
                />
            )}
            onChange={(event, newValue) => {
                onChange?.(newValue);
                setSelectedCurrency(newValue || null);
            }}
        />
    );
}

export default CurrencySelector;