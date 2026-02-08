import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import React, { useEffect } from 'react'

function InventoryTransferTypeSelector({onChange,value }) {
  const [type, setType] = React.useState(value);

  const handleChange = (event) => {
    const newValue = event.target.value
    setType(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    onChange(type);
  }, [type, onChange]);

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size='small' label="Type" align={'left'}>
        <InputLabel id="transfer-types-filter-select">Type</InputLabel>
        <Select
            labelId="transfer-types-filter-label"
            id="transfer-types-filter-select"
            label="Type"
            size='small'
            value={value || 'all'}
            onChange={handleChange}
        >
            <MenuItem value='external'>External</MenuItem>
            <MenuItem value='cost center change'>Cost Center Change</MenuItem>
            <MenuItem value='internal'>Internal</MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}

export default InventoryTransferTypeSelector