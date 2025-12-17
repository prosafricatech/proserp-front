import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import React, { useState, useEffect, useCallback, useRef } from 'react'

function StationShiftsStatusSelector({ onChange, value }) {
  const [status, setStatus] = useState(value || 'All');
  const timeoutRef = useRef(null);

  // Update local state when value prop changes (for external updates)
  useEffect(() => {
    if (value !== undefined && value !== status) {
      setStatus(value);
    }
  }, [value]);

  // Debounce the onChange callback
  const debouncedOnChange = useCallback((newValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  const handleChange = useCallback((event) => {
    const newValue = event.target.value;
    setStatus(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

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