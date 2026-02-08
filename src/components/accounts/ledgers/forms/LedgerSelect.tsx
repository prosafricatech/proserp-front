import { Autocomplete, Checkbox, Chip, TextField } from '@mui/material';
import React from 'react';
import { useLedgerSelect } from './LedgerSelectProvider';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number; 
}

interface LedgerSelectProps {
  onChange: (value: Ledger | Ledger[] | null) => void;
  frontError?: { message?: string } | null;
  label?: string;
  defaultValue?: Ledger | Ledger[] | null;
  allowedGroups?: string[];
  notAllowedGroups?: string[];
  value?: Ledger | Ledger[] | null;
  multiple?: boolean;
  renderOption?: (props: React.HTMLAttributes<HTMLLIElement>, option: Ledger, state: { selected: boolean }) => React.ReactNode;
}

function LedgerSelect(props: LedgerSelectProps) {
  const {
    onChange,
    frontError = null,
    label = 'Select Ledger',
    defaultValue = null,
    allowedGroups = [],
    notAllowedGroups = [],
    value = null,
    multiple = false,
  } = props;

  const { ledgerOptions, extractLedgers } = useLedgerSelect();
  const [options, setOptions] = React.useState<Ledger[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<Ledger | Ledger[] | null>(
    defaultValue ? defaultValue : multiple ? [] : value
  );

  React.useEffect(() => {
    setOptions([]);
    extractLedgers(ledgerOptions, notAllowedGroups, allowedGroups, setOptions);
  }, [ledgerOptions]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option: Ledger) => option.name}
      value={selectedValue}
      multiple={multiple}
      isOptionEqualToValue={(option: Ledger, value: Ledger) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          fullWidth
          label={label}
          error={!!frontError}
          helperText={frontError?.message}
        />
      )}
      {...(multiple && { 
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }, // extend type to include key optionally
          option: Ledger,
          { selected }
        ) => {
          const { key, ...otherProps } = props;

          return (
            <li key={option.id} {...otherProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name}
            </li>
          );
        }
      })}
      onChange={(event: React.SyntheticEvent, newValue: Ledger | Ledger[] | null) => {
        onChange(newValue);
        setSelectedValue(newValue);
      }}
        renderTags={(tagValue: Ledger[], getTagProps) => {
          return tagValue.map((option: Ledger, index: number) => {
            const { key, ...restProps } = getTagProps({ index });
            return <Chip {...restProps} key={`${option.id}-${key}`} label={option.name} />;
          });
        }}
    />
  );
}

export default LedgerSelect;
