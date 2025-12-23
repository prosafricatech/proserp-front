import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import React, { useState, useEffect, useCallback, useRef } from 'react'

type ShiftStatus = 'All' | 'Pending' | 'Closed';

interface StationShiftsStatusSelectorProps {
  /** Current value from parent (controlled component) */
  value?: ShiftStatus;
  /** Callback when user selects a status */
  onChange: (value: ShiftStatus) => void;
}

  const StationShiftsStatusSelector: React.FC<StationShiftsStatusSelectorProps> = ({
    value = 'All',
    onChange,
  }) =>{
  const [status, setStatus] = useState(value || 'All');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localValue, setLocalValue] = useState<ShiftStatus>(value);

  // Update local state when value prop changes (for external updates)
  useEffect(() => {
    if (value !== undefined && value !== status) {
      setStatus(value);
    }
  }, [value]);

  // Debounce the onChange callback
  const debouncedOnChange = useCallback((newValue: ShiftStatus)=> {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  const handleChange = (event: SelectChangeEvent<ShiftStatus>) => {
    const newValue = event.target.value as ShiftStatus;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size='small'>
        <InputLabel id="station-shifts-filtered-by-status">Status</InputLabel>
        <Select
          labelId="station-shifts-status-filter-label"
          id="station-shifts-status-filter-select"
          value={status}
          label="Status"
          onChange={handleChange}
        >
          <MenuItem value='All'>All</MenuItem>
          <MenuItem value='Pending'>Pending</MenuItem>
          <MenuItem value='Closed'>Closed</MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}

export default StationShiftsStatusSelector;