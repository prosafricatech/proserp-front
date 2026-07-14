import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, Chip, TextField, CircularProgress } from '@mui/material';
import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
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

  const { extractLedgers, isLoaded } = useLedgerSelect();
  const [options, setOptions] = useState<Ledger[]>([]);
  const [selectedValue, setSelectedValue] = useState<Ledger | Ledger[] | null>(
    defaultValue ? defaultValue : multiple ? [] : value
  );
  const [isLoading, setIsLoading] = useState(true);
  const processingRef = useRef(false);
  const lastFilterKeyRef = useRef<string>('');

  const toLedgerId = useCallback((entry: LedgerRef): number => {
    return typeof entry === 'number' ? entry : entry.id;
  }, []);

  // Memoize filter sets to avoid recreation
  const filterSets = useMemo(() => {
    const allowedLedgerIds = new Set(allowedLedgers.map(toLedgerId));
    const notAllowedLedgerIds = new Set(notAllowedLedgers.map(toLedgerId));
    return { allowedLedgerIds, notAllowedLedgerIds };
  }, [allowedLedgers, notAllowedLedgers, toLedgerId]);

  // Generate a unique key for the current filter combination
  const getFilterKey = useCallback(() => {
    const notAllowedKey = [...notAllowedGroups].sort().join('|');
    const allowedKey = [...allowedGroups].sort().join('|');
    const allowedIdsKey = [...allowedLedgers].map(toLedgerId).sort().join('|');
    const notAllowedIdsKey = [...notAllowedLedgers].map(toLedgerId).sort().join('|');
    return `${notAllowedKey}|${allowedKey}|${allowedIdsKey}|${notAllowedIdsKey}`;
  }, [notAllowedGroups, allowedGroups, allowedLedgers, notAllowedLedgers, toLedgerId]);

  // Optimized option generation
  const generateOptions = useCallback(() => {
    if (!isLoaded || processingRef.current) return;

    const filterKey = getFilterKey();
    if (filterKey === lastFilterKeyRef.current) {
      // Skip if filters haven't changed
      return;
    }

    processingRef.current = true;
    setIsLoading(true);

    // Use setTimeout to avoid blocking the main thread
    setTimeout(() => {
      try {
        const { allowedLedgerIds, notAllowedLedgerIds } = filterSets;
        
        const result = extractLedgers(
          notAllowedGroups,
          allowedGroups,
          allowedLedgerIds,
          notAllowedLedgerIds
        );

        // Update state with the new options
        setOptions((prev) => {
          // Only update if the result is different
          if (prev.length === result.length && 
              prev.every((item, index) => item.id === result[index]?.id)) {
            return prev;
          }
          return result;
        });
        
        lastFilterKeyRef.current = filterKey;
      } catch (error) {
        console.error('Error generating ledger options:', error);
      } finally {
        processingRef.current = false;
        setIsLoading(false);
      }
    }, 10);
  }, [isLoaded, extractLedgers, notAllowedGroups, allowedGroups, filterSets, getFilterKey]);

  // Generate options when dependencies change
  useEffect(() => {
    generateOptions();
  }, [
    isLoaded,
    notAllowedGroups,
    allowedGroups,
    allowedLedgers,
    notAllowedLedgers,
    generateOptions
  ]);

  useEffect(() => {
    if (value) setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    if (!addedLedger) return;

    const newValue = multiple ? [addedLedger] : addedLedger;
    setSelectedValue(newValue);
    onChange?.(newValue);
  }, [addedLedger, multiple, onChange]);

  // Memoize option equality check
  const isOptionEqualToValue = useCallback((option: Ledger, val: Ledger) => {
    return option.id === val.id;
  }, []);

  // Memoize getOptionLabel
  const getOptionLabel = useCallback((option: Ledger) => {
    return option.name;
  }, []);

  // Memoize renderInput
  const renderInput = useCallback((params: any) => (
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
  ), [label, frontError, startAdornment]);

  // Memoize renderTags
  const renderTags = useCallback((tagValue: Ledger[], getTagProps: any) => {
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
  }, []);

  // Show loading state
  if (!isLoaded) {
    return (
      <TextField
        size='small'
        fullWidth
        label={label}
        disabled
        InputProps={{
          startAdornment: startAdornment,
          endAdornment: <CircularProgress size={20} />
        }}
      />
    );
  }

  return (
    <Autocomplete
      options={options}
      getOptionLabel={getOptionLabel}
      value={selectedValue}
      multiple={multiple}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={isLoading}
      loadingText="Loading ledgers..."
      renderInput={renderInput}
      {...(multiple && {
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
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
      renderTags={renderTags}
    />
  );
}

export default LedgerSelect;