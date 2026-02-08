import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import React, { useEffect } from 'react'

function InventoryTransferDirectionSelector({onChange,value}) {
  const [direction, setDirection] = React.useState(value);

  const handleChange = (event) => {
    const newValue = event.target.value
    setDirection(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    onChange(direction);
  }, [direction, onChange]);

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size='small' label="Direction" align={'left'}>
        <InputLabel id="transfer-directions-filter-select">Direction</InputLabel>
        <Select
            labelId="transfer-directions-filter-label"
            id="transfer-directions-filter-select"
            value={value || 'all'}
            size='small'
            label='Direction'
            onChange={handleChange}
        >
            <MenuItem value='all'>All</MenuItem>
            <MenuItem value='in'>In</MenuItem>
            <MenuItem value='out'>Out</MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}

export default InventoryTransferDirectionSelector