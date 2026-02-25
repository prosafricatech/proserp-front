import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StationFormContext } from './SalesShifts';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

function ShiftTeamsSelector({ onChange, value }) {
  const { activeStation } = useContext(StationFormContext);
  const { shifts = [] } = activeStation || {};
  
  const [sales_outlet_shift_id, setOutletShift] = useState(value || 'null');
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (value !== undefined && value !== sales_outlet_shift_id) {
      setOutletShift(value);
    }
  }, [value]);

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
    setOutletShift(newValue);
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

  const shiftTeamsWithAll = [{ id: 'null', name: 'All' }, ...shifts];

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl component="div" fullWidth size="small">
        <InputLabel id="shift-teams-filter-label">Shift Team</InputLabel>
        <Select
          labelId="shift-teams-filter-label"
          id="shift-teams-filter-select"
          value={sales_outlet_shift_id}
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