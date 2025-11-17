import React, { useEffect, useState, useCallback } from 'react';
import { Autocomplete, Checkbox, Chip, LinearProgress, TextField } from '@mui/material';
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBox from '@mui/icons-material/CheckBox';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import organizationServices from '../Organizations/organizationServices';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

interface ApiResponse {
  data: User[];
}

interface UsersSelectorProps {
  onChange: (value: User | User[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: User | User[] | null;
  frontError?: { message?: string } | null;

  /** NEW: list of users to exclude */
  excludeUsers?: User[];
}

const UsersSelector: React.FC<UsersSelectorProps> = ({
  onChange,
  multiple = false,
  label = 'Users',
  defaultValue = null,
  frontError = null,
  excludeUsers = [],
}) => {
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;

  /** fetch users */
  const { data: response = { data: [] }, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['users', organization?.id],
    queryFn: () =>
      organizationServices.getUsers({ organizationId: organization?.id }),
    enabled: !!organization?.id,
  });

  const rawUsers = response.data || [];

  /** NEW: automatic filtering */
  const excludedIds = new Set(excludeUsers.map((u) => u.id));
  const users = rawUsers.filter((u) => !excludedIds.has(u.id));

  const [selectedUsers, setSelectedUsers] = useState<User | User[] | null>(() => {
    if (!defaultValue) return multiple ? [] : null;

    return multiple
      ? Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue]
      : Array.isArray(defaultValue)
      ? defaultValue[0]
      : defaultValue;
  });

  /** update when defaults change */
  useEffect(() => {
    if (!defaultValue || users.length === 0) return;

    if (multiple) {
      const defIds = Array.isArray(defaultValue)
        ? defaultValue.map((u) => u.id)
        : [defaultValue.id];

      setSelectedUsers(users.filter((u) => defIds.includes(u.id)));
    } else {
      const id = Array.isArray(defaultValue) ? defaultValue[0]?.id : defaultValue?.id;
      setSelectedUsers(users.find((u) => u.id === id) || null);
    }
  }, [defaultValue, rawUsers, multiple]);

  const handleChange = useCallback((_: any, newValue: User | User[] | null) => {
    onChange(newValue);
    setSelectedUsers(newValue);
  }, [onChange]);

  if (isLoading) return <LinearProgress />;

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      isOptionEqualToValue={(option: User, value: User) => option.id === value.id}
      options={users}
      value={selectedUsers}
      disableCloseOnSelect={multiple}
      getOptionLabel={(option: User) => option.name}
      renderInput={(params) => (
        <TextField
          {...params}
          error={!!frontError || !!error}
          helperText={frontError?.message}
          fullWidth
          label={label}
          size="small"
          placeholder={label}
        />
      )}
      renderTags={(tagValue: User[], getTagProps) => 
        tagValue.map((option: User, index: number) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.name}
          />
        ))
      }
      {...(multiple && { 
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
          option: User,
          { selected }
        ) => {
          const { key, ...otherProps } = props;

          return (
            <li key={option.id} {...otherProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.name}
            </li>
          );
        }
      })}
      onChange={handleChange}
    />
  );
};

export default UsersSelector;
