
import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  IconButton,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import requisitionsServices from './requisitionsServices';

interface Role {
  id: number;
  name: string;
}

interface RequisitionsWaitingForSelectorProps {
  onChange: (value: number | null) => void;
  value: number | null;
}

function RequisitionsWaitingForSelector({ onChange, value }: RequisitionsWaitingForSelectorProps) {
  const { data: roles, isLoading: isFetchingRoles } = useQuery<Role[]>({
    queryKey: ['rolesOptions'],
    queryFn: () => requisitionsServices.getRolesOptions(),
  });

  const [nextApprovalRoleId, setNextApprovalRoleId] = React.useState<number | null>(value);

  const handleChange = (event: SelectChangeEvent<any>) => {
    const selectedValue = event.target.value === '' ? null : Number(event.target.value);
    setNextApprovalRoleId(selectedValue);
    onChange(selectedValue);
  };

  const handleClear = () => {
    setNextApprovalRoleId(null);
    onChange(null);
  };

  React.useEffect(() => {
    setNextApprovalRoleId(value);
  }, [value]);

  if (isFetchingRoles) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl component="div" fullWidth size="small">
        <InputLabel id="roles-filter-label">Waiting For</InputLabel>
        <Select
          labelId="roles-filter-label"
          id="roles-filter-select"
          value={nextApprovalRoleId ?? ''}
          label="Waiting For"
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
          endAdornment={
            nextApprovalRoleId !== null && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  edge="end"
                  sx={{ marginRight: 1 }}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }
        >
          <MenuItem value="" sx={{ justifyContent: 'flex-start' }}>All</MenuItem>
          {roles?.map((role) => (
            <MenuItem key={role.id} value={role.id} sx={{ justifyContent: 'flex-start' }}>
              {role.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default RequisitionsWaitingForSelector;