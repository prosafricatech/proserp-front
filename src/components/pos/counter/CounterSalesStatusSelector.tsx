import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import React from 'react';

type SalesStatus =
  | 'All'
  | 'Pending'
  | 'Ordered'
  | 'Partially Fulfilled'
  | 'Complete'
  | 'Fulfilled'
  | string;

interface CounterSalesStatusSelectorProps {
  value: SalesStatus;
  onChange: (status: SalesStatus) => void;
}

const CounterSalesStatusSelector: React.FC<CounterSalesStatusSelectorProps> = ({
  value,
  onChange,
}) => {
  const handleChange = (event: SelectChangeEvent<SalesStatus>) => {
    onChange(event.target.value as SalesStatus);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size='small'>
        <InputLabel id='sales-status-filter-label'>Status</InputLabel>
        <Select
          labelId='sales-status-filter-label'
          id='sales-status-filter'
          value={value}
          label='Status'
          onChange={handleChange}
        >
          <MenuItem value='All'>All</MenuItem>
          <MenuItem value='Pending'>Pending</MenuItem>
          <MenuItem value='Ordered'>Ordered</MenuItem>
          <MenuItem value='Partially Fulfilled'>Partially Fulfilled</MenuItem>
          <MenuItem value='Complete'>Complete</MenuItem>
          <MenuItem value='Fulfilled'>Fulfilled</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default React.memo(CounterSalesStatusSelector);
