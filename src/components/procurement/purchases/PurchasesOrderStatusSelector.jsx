import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

function PurchasesOrderStatusSelector({ onChange, value }) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="purchases-order-by-status">Status</InputLabel>
        <Select
          labelId="purchases-order-status-filter-label"
          id="purchases-order-status-filter-select"
          value={value}
          label="Status"
          onChange={handleChange}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Partially Received">Partially Received</MenuItem>
          <MenuItem value="Fully Received">Fully Received</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default PurchasesOrderStatusSelector;
