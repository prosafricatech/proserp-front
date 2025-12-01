import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StationFormContext } from './SalesShifts';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

// Custom debounce hook to replace beautiful-react-hooks' useDebouncedCallback
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

function ShiftTeamsSelector({ onChange, value }) {
  const [shift_team_id, setShift_team_id] = useState(value || 'null');

  const handleChange = useDebouncedCallback((event) => {
    const newValue = event.target.value;
    setShift_team_id(newValue);
  }, 300);

  // Update parent when shift_team_id changes
  useEffect(() => {
    if (shift_team_id !== undefined && shift_team_id !== value) {
      onChange(shift_team_id);
    }
  }, [shift_team_id, onChange, value]);

  // Cancel debounced calls on unmount
  useEffect(() => {
    return () => handleChange.cancel();
  }, [handleChange]);

  const { activeStation } = useContext(StationFormContext);
  const { shift_teams = [] } = activeStation || {};

  // New array with the 'All' option and the existing shift teams
  const shiftTeamsWithAll = [{ id: 'null', name: 'All' }, ...shift_teams];

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl component="div" fullWidth size="small">
        <InputLabel id="shift-teams-filter-label">Shift Team</InputLabel>
        <Select
          labelId="shift-teams-filter-label"
          id="shift-teams-filter-select"
          value={shift_team_id}
          label="Shift Team"
          onChange={handleChange}
        >
          {shiftTeamsWithAll.map((team) => (
            <MenuItem key={team.id} value={team.id}>
              {team.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default ShiftTeamsSelector;