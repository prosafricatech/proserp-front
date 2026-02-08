import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

type ApprovalStatus = 'all' | 'Active' | 'Inactive' | string;

interface ApprovalStatusSelectorProps {
  onChange: (status: ApprovalStatus) => void;
  value: ApprovalStatus;
}

const ApprovalStatusSelector: React.FC<ApprovalStatusSelectorProps> = ({ onChange, value }) => {
  const handleChange = (event: SelectChangeEvent<ApprovalStatus>) => {
    const newValue = event.target.value as ApprovalStatus;
    onChange(newValue);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size='small'>
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select
          labelId="status-filter-label"
          id="status-filter-select"
          value={value}
          label="Status"
          onChange={handleChange}
        >
          <MenuItem value='all'>All</MenuItem>
          <MenuItem value='Active'>Active</MenuItem>
          <MenuItem value='Inactive'>Inactive</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default ApprovalStatusSelector;