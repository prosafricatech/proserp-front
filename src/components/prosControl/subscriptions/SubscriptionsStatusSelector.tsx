"use client";

import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";

// ---- Types ----
interface SubscriptionsStatusSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const SubscriptionsStatusSelector: React.FC<SubscriptionsStatusSelectorProps> = ({ value, onChange }) => {
  const [status, setStatus] = useState<string>(value);

  const handleChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value);
  };

  // Notify parent when status changes
  useEffect(() => {
    onChange(status);
  }, [status, onChange]);

  // Sync internal state if parent value changes
  useEffect(() => {
    setStatus(value);
  }, [value]);

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="subscription-status-filter-label">Status</InputLabel>
        <Select
          labelId="subscription-status-filter-label"
          id="subscription-status-filter-select"
          value={status}
          label="Status"
          onChange={handleChange}
        >
          <MenuItem value="null">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="scheduled">Scheduled</MenuItem>
          <MenuItem value="expired">Expired</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default SubscriptionsStatusSelector;
