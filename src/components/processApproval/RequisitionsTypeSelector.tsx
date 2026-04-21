import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';

interface RequisitionsTypeSelectorProps {
  onChange: (value: string) => void;
  value?: string;
}

function RequisitionsTypeSelector({ onChange, value = 'all' }: RequisitionsTypeSelectorProps) {
  const [type, setType] = React.useState(value);
  const { organizationHasSubscribed } = useJumboAuth();
  const canViewLeaveRequest = organizationHasSubscribed(MODULES.HUMAN_RESOURCES);

  React.useEffect(() => {
    if (!canViewLeaveRequest && type === 'leave_request') {
      setType('all');
      onChange('all');
    }
  }, [canViewLeaveRequest, type, onChange]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;
    setType(newValue);
    onChange(newValue);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="process-types-filter-label">Type</InputLabel>
        <Select
          labelId="process-types-filter-label"
          id="process-types-filter-select"
          label="Type"
          value={type}
          onChange={handleChange}
          sx={{ textAlign: 'left' }}
          MenuProps={{
            PaperProps: {
              sx: {
                '& .MuiMenuItem-root': {
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                },
              },
            },
          }}
        >
          <MenuItem value="all" sx={{ justifyContent: 'flex-start' }}>All</MenuItem>
          <MenuItem value="purchase" sx={{ justifyContent: 'flex-start' }}>PURCHASE</MenuItem>
          <MenuItem value="payment" sx={{ justifyContent: 'flex-start' }}>PAYMENT</MenuItem>
          {canViewLeaveRequest && (
            <MenuItem value="leave_request" sx={{ justifyContent: 'flex-start' }}>LEAVE REQUEST</MenuItem>
          )}
        </Select>
      </FormControl>
    </Box>
  );
}

export default RequisitionsTypeSelector;
