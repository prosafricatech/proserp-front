import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import React, { useState, useEffect, useCallback, useRef } from 'react'

// Custom debounce hook to replace beautiful-react-hooks
function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  
  // Update callback ref if callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
  
  // Add cancel method to match beautiful-react-hooks API
  debouncedCallback.cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
}

function StationShiftsStatusSelector({onChange,value}) {
    const [status, setStatus] = useState(value || 'All');

    const handleChange = useDebouncedCallback((event) => {
        const newValue = event.target.value;
        setStatus(newValue);
    }); 

    // Update parent when status changes
    useEffect(() => {
        if (status !== undefined) {
            onChange(status);
        }
    }, [status, onChange]);

    // Cancel debounced calls on unmount
    useEffect(() => {
        return () => handleChange.cancel();
    }, [handleChange]);

  return (
    <Box sx={{ minWidth: 120 }}>
        <FormControl fullWidth size='small' label="Status">
          <InputLabel id="station-shifts-filtered-by-status">Status</InputLabel>
            <Select
                labelId="station-shifts-status-filter-label"
                id="station-shifts-status-filter-select"
                value={status} // Use local state value, not prop
                label={'Status'}
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