import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
} from '@mui/material';
import React, { useEffect } from 'react';
import { useDepartments } from './DepartmentsProvider';
import { Department } from './DepartmentsType';

interface DepartmentSelector {
  onChange: (value: Department | Department[] | null) => void;
  frontError?: { message?: string } | null;
  label?: string;
  defaultValue?: Department | Department[] | null;
  value?: Department | Department[] | null;
  addedDepartment?: Department | null;
  multiple?: boolean;
  startAdornment?: React.ReactNode;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: Department,
    state: { selected: boolean }
  ) => React.ReactNode;
}

const DepartmentSelector = (props: DepartmentSelector) => {
  const {
    onChange,
    frontError = null,
    label = 'Select Departments',
    defaultValue = null,
    value = null,
    addedDepartment = null,
    multiple = false,
    startAdornment,
  } = props;

  const { departments, isLoading } = useDepartments();
  const [options, setOptions] = React.useState<Department[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<
    Department | Department[] | null
  >(defaultValue ? defaultValue : multiple ? [] : value);

  useEffect(() => {
    if (departments && Array.isArray(departments)) {
      setOptions(departments);
    } else {
      if (departments) setOptions(departments.data);
    }
  }, [departments]);

  useEffect(() => {
    if (value) setSelectedValue(value);
  }, [value]);

  React.useEffect(() => {
    if (!addedDepartment) return;

    const value = multiple ? [addedDepartment] : addedDepartment;
    setSelectedValue(value);
    onChange?.(value);
  }, [addedDepartment]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option: Department) => `${option.name}`}
      value={selectedValue}
      multiple={multiple}
      isOptionEqualToValue={(option: Department, value: Department) =>
        option.id === value.id
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size='small'
          fullWidth
          label={label}
          error={!!frontError}
          helperText={frontError?.message}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {startAdornment && <Box sx={{ mr: 0.5 }}>{startAdornment}</Box>}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      {...(multiple && {
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }, // extend type to include key optionally
          option: Department,
          { selected }
        ) => {
          const { key, ...otherProps } = props;

          return (
            <li key={option.id} {...otherProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize='small' />}
                checkedIcon={<CheckBox fontSize='small' />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {`${option.name}`}
            </li>
          );
        },
      })}
      onChange={(
        event: React.SyntheticEvent,
        newValue: Department | Department[] | null
      ) => {
        onChange(newValue);
        setSelectedValue(newValue);
      }}
      renderTags={(tagValue: Department[], getTagProps) => {
        return tagValue.map((option: Department, index: number) => {
          const { key, ...restProps } = getTagProps({ index });
          return (
            <Chip
              {...restProps}
              key={`${option.id}-${key}`}
              label={`${option.name}`}
            />
          );
        });
      }}
    />
  );
};

export default DepartmentSelector;
