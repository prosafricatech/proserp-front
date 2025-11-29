import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useDebouncedCallback } from 'beautiful-react-hooks';
import React from 'react'

function StationShiftsStatusSelector({onChange,value}) {
    const [status, setStatus] = React.useState(value);

    const handleChange = useDebouncedCallback((event) => {
        setStatus(event.target.value);
    }); 

    React.useEffect(() => {
        onChange(status);
    }, [status]);

    React.useEffect(() => {
        return () => handleChange.cancel();
    });

  return (
    <Box sx={{ minWidth: 120 }}>
        <FormControl fullWidth size='small' label="Status">
          <InputLabel id="station-shifts-filtered-by-status">Status</InputLabel>
            <Select
                labelId="station-shifts-status-filter-label"
                id="station-shifts-status-filter-select"
                value={value}
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

export default StationShiftsStatusSelector