import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, Chip, TextField } from '@mui/material';
import React, { useEffect } from 'react';
import { useLedgerSelect } from './LedgerSelectProvider';

const EMPTY_LEDGER_REFS: LedgerRef[] = [];
const EMPTY_GROUPS: string[] = [];

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

type LedgerRef = number | Ledger | { id: number };

interface LedgerSelectProps {
  onChange: (value: Ledger | Ledger[] | null) => void;
  frontError?: { message?: string } | null;
  label?: string;
  defaultValue?: Ledger | Ledger[] | null;
  allowedGroups?: string[];
  notAllowedGroups?: string[];
  allowedLedgers?: LedgerRef[];
  notAllowedLedgers?: LedgerRef[];
  value?: Ledger | Ledger[] | null;
  addedLedger?: Ledger | null;
  multiple?: boolean;
  startAdornment?: React.ReactNode;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: Ledger,
    state: { selected: boolean }
  ) => React.ReactNode;
}

function LedgerSelect(props: LedgerSelectProps) {
  const {
    onChange,
    frontError = null,
    label = 'Select Ledger',
    defaultValue = null,
    allowedGroups = EMPTY_GROUPS,
    notAllowedGroups = EMPTY_GROUPS,
    allowedLedgers = EMPTY_LEDGER_REFS,
    notAllowedLedgers = EMPTY_LEDGER_REFS,
    value = null,
    addedLedger = null,
    multiple = false,
    startAdornment,
  } = props;

  const { ledgerOptions, extractLedgers } = useLedgerSelect();
  const [options, setOptions] = React.useState<Ledger[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<
    Ledger | Ledger[] | null
  >(defaultValue ? defaultValue : multiple ? [] : value);

  useEffect(() => {
    if (value) setSelectedValue(value);
  }, [value]);

  const toLedgerId = React.useCallback((entry: LedgerRef) => {
    return typeof entry === 'number' ? entry : entry.id;
  }, []);

  React.useEffect(() => {
    const extractedOptions: Ledger[] = [];
    extractLedgers(
      ledgerOptions,
      notAllowedGroups,
      allowedGroups,
      (updater) => {
        if (typeof updater === 'function') {
          const next = updater(extractedOptions);
          extractedOptions.splice(0, extractedOptions.length, ...next);
        } else {
          extractedOptions.splice(0, extractedOptions.length, ...updater);
        }
      }
    );

    const allowedLedgerIds = new Set(allowedLedgers.map(toLedgerId));
    const notAllowedLedgerIds = new Set(notAllowedLedgers.map(toLedgerId));

    const filtered = extractedOptions.filter((ledger) => {
      if (notAllowedLedgerIds.has(ledger.id)) return false;
      if (allowedLedgerIds.size > 0 && !allowedLedgerIds.has(ledger.id))
        return false;
      return true;
    });

    setOptions((prev) => {
      if (
        prev.length === filtered.length &&
        prev.every((ledger, index) => ledger.id === filtered[index]?.id)
      ) {
        return prev;
      }

      return filtered;
    });
  }, [
    ledgerOptions,
    allowedGroups,
    notAllowedGroups,
    allowedLedgers,
    notAllowedLedgers,
    extractLedgers,
    toLedgerId,
  ]);

  React.useEffect(() => {
    if (!addedLedger) return;

    const value = multiple ? [addedLedger] : addedLedger;
    setSelectedValue(value);
    onChange?.(value);
  }, [addedLedger]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option: Ledger) => option.name}
      value={selectedValue}
      multiple={multiple}
      isOptionEqualToValue={(option: Ledger, value: Ledger) =>
        option.id === value.id
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size='small'
          fullWidth
          label={label}
          error={!!frontError}
          helperText={frontError?.message}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {startAdornment && <Box sx={{ mr: 0.5 }}>{startAdornment}</Box>}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
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
                icon={<CheckBoxOutlineBlank fontSize='small' />}
                checkedIcon={<CheckBox fontSize='small' />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name}
            </li>
          );
        },
      })}
      onChange={(
        event: React.SyntheticEvent,
        newValue: Ledger | Ledger[] | null
      ) => {
        onChange(newValue);
        setSelectedValue(newValue);
      }}
      renderTags={(tagValue: Ledger[], getTagProps) => {
        return tagValue.map((option: Ledger, index: number) => {
          const { key, ...restProps } = getTagProps({ index });
          return (
            <Chip
              {...restProps}
              key={`${option.id}-${key}`}
              label={option.name}
            />
          );
        });
      }}
    />
  );
}

export default LedgerSelect;
