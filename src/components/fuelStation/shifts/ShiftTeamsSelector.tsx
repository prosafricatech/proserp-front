import React, { useContext } from 'react';
import { StationFormContext } from './SalesShifts';
import { useDebouncedCallback } from 'beautiful-react-hooks';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

function ShiftTeamsSelector({ onChange, value }) {
  const [shift_team_id, setShift_team_id] = React.useState(value);

  const handleChange = useDebouncedCallback((event) => {
    setShift_team_id(event.target.value);
  });

  React.useEffect(() => {
    onChange(shift_team_id);
  }, [shift_team_id]);

  React.useEffect(() => {
    return () => handleChange.cancel();
  });

  const { activeStation } = useContext(StationFormContext);
  const { shift_teams } = activeStation;

  //new array with the 'All' option and the existing shift teams
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
