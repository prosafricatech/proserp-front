'use client'

import React from 'react';
import { Autocomplete, Chip, TextField, Typography } from '@mui/material';
import { BioOption } from './BioSelect';

interface BioMultiSelectProps {
  label: string;
  options: BioOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  loading?: boolean;
  disabled?: boolean;
  helperText?: React.ReactNode;
}

/** The searchable choice of BioSelect, for picking any number of options (shown as chips). */
const BioMultiSelect = ({ label, options, value, onChange, loading, disabled, helperText }: BioMultiSelectProps) => (
  <Autocomplete
    multiple
    size='small'
    fullWidth
    disableCloseOnSelect
    disabled={disabled}
    loading={loading}
    options={options}
    value={options.filter((option) => value.includes(option.value))}
    getOptionLabel={(option) => option.label}
    isOptionEqualToValue={(option, selected) => option.value === selected.value}
    onChange={(_, selected) => onChange(selected.map((option) => option.value))}
    renderTags={(selected, getTagProps) => selected.map((option, index) => {
      const { key, ...rest } = getTagProps({ index });

      return <Chip key={key} size='small' label={option.label} {...rest} />;
    })}
    renderOption={(props, option) => {
      const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };

      return (
        <li key={key} {...rest}>
          <div>
            <div>{option.label}</div>
            {option.hint && <Typography variant='caption' color='text.secondary'>{option.hint}</Typography>}
          </div>
        </li>
      );
    }}
    renderInput={(params) => <TextField {...params} label={label} helperText={helperText} />}
  />
);

export default BioMultiSelect;
