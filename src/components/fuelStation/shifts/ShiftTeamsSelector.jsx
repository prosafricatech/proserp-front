import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StationFormContext } from './SalesShifts';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

function ShiftTeamsSelector({ onChange, value }) {
  const { activeStation } = useContext(StationFormContext);
  const { shift_teams = [] } = activeStation || {};
  
  const [shift_team_id, setShift_team_id] = useState(value || 'null');
  const timeoutRef = useRef(null);

  // Update local state when value prop changes (for external updates)
  useEffect(() => {
    if (value !== undefined && value !== shift_team_id) {
      setShift_team_id(value);
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
    setShift_team_id(newValue);
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