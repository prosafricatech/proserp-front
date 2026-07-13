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
  limit?: number; // Add limit prop for performance
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
    limit = 1000, // Default limit to prevent rendering too many items
  } = props;

  const { extractLedgers, isLoading: isLoadingLedgers } = useLedgerSelect();
  const [options, setOptions] = useState<Ledger[]>([]);
  const [selectedValue, setSelectedValue] = useState<Ledger | Ledger[] | null>(
    defaultValue ? defaultValue : multiple ? [] : value
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const toLedgerId = useCallback((entry: LedgerRef) => {
    return typeof entry === 'number' ? entry : entry.id;
  }, []);

  // Create Set for faster lookups
  const allowedLedgerIds = useMemo(() => {
    return new Set(allowedLedgers.map(toLedgerId));
  }, [allowedLedgers, toLedgerId]);

  const notAllowedLedgerIds = useMemo(() => {
    return new Set(notAllowedLedgers.map(toLedgerId));
  }, [notAllowedLedgers, toLedgerId]);

  // Use requestIdleCallback or setTimeout for async processing
  const processLedgers = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    const processData = () => {
      try {
        // Extract ledgers based on filters - now returns array directly
        const extractedOptions = extractLedgers(notAllowedGroups, allowedGroups);
        
        // Filter by allowed/not allowed ledgers
        let filtered = extractedOptions;
        
        if (notAllowedLedgerIds.size > 0) {
          filtered = filtered.filter(ledger => !notAllowedLedgerIds.has(ledger.id));
        }
        
        if (allowedLedgerIds.size > 0) {
          filtered = filtered.filter(ledger => allowedLedgerIds.has(ledger.id));
        }

        // Limit results to prevent rendering issues
        if (filtered.length > limit) {
          filtered = filtered.slice(0, limit);
        }

        // Update state
        setOptions(prev => {
          // Only update if the arrays are actually different
          if (prev.length === filtered.length && 
              prev.every((ledger, index) => ledger.id === filtered[index]?.id)) {
            return prev;
          }
          return filtered;
        });
      } catch (error) {
        console.error('Error processing ledgers:', error);
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    };

    // Use requestIdleCallback for better performance with large datasets
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(processData, { timeout: 2000 });
    } else {
      setTimeout(processData, 0);
    }
  }, [extractLedgers, notAllowedGroups, allowedGroups, notAllowedLedgerIds, allowedLedgerIds, limit]);

  // Process ledgers when dependencies change
  useEffect(() => {
    processLedgers();
  }, [processLedgers]);

  // Update selected value when prop changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setSelectedValue(value);
    }
  }, [value]);

  // Handle added ledger
  useEffect(() => {
    if (!addedLedger) return;

    const newValue = multiple ? [addedLedger] : addedLedger;
    setSelectedValue(newValue);
    onChange?.(newValue);
  }, [addedLedger, multiple, onChange]);

  // Memoize options for Autocomplete
  const memoizedOptions = useMemo(() => options, [options]);

  // If still loading, show loading state
  if (isLoadingLedgers || isProcessing) {
    return (
      <TextField
        size='small'
        fullWidth
        label={label}
        disabled
        InputProps={{
          endAdornment: <CircularProgress size={20} />
        }}
      />
    );
  }

  return (
    <Autocomplete
      options={memoizedOptions}
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
      // Performance optimizations
      disableListWrap={true}
      autoHighlight={false}
      blurOnSelect={true}
      {...(memoizedOptions.length > 100 && {
        ListboxProps: {
          style: { maxHeight: 300 },
          ...(typeof window !== 'undefined' && {
            // Virtual scroll for large lists
            onScroll: (e: React.UIEvent<HTMLUListElement>) => {
              // Could implement virtual scrolling here if needed
            }
          })
        }
      })}
    />
  );
}

export default LedgerSelect;