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
import { useDesignations } from './DesignationsProvider';
import { Designation } from './DesignationsType';

interface DesignationSelector {
  onChange: (value: Designation | Designation[] | null) => void;
  frontError?: { message?: string } | null;
  label?: string;
  defaultValue?: Designation | Designation[] | null;
  value?: Designation | Designation[] | null;
  addedDeignation?: Designation | null;
  multiple?: boolean;
  startAdornment?: React.ReactNode;
  renderOption?: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: Designation,
    state: { selected: boolean }
  ) => React.ReactNode;
}

const DesignationSelector = (props: DesignationSelector) => {
  const {
    onChange,
    frontError = null,
    label = 'Select Designation',
    defaultValue = null,
    value = null,
    addedDeignation = null,
    multiple = false,
    startAdornment,
  } = props;

  const { designations, isLoading } = useDesignations();
  const [options, setOptions] = React.useState<Designation[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<
    Designation | Designation[] | null
  >(defaultValue ? defaultValue : multiple ? [] : value);

  useEffect(() => {
    if (designations) setOptions(designations);
  }, [designations]);

  useEffect(() => {
    if (value) setSelectedValue(value);
  }, [value]);

  React.useEffect(() => {
    if (!addedDeignation) return;

    const value = multiple ? [addedDeignation] : addedDeignation;
    setSelectedValue(value);
    onChange?.(value);
  }, [addedDeignation]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option: Designation) => `${option.title}`}
      value={selectedValue}
      multiple={multiple}
      isOptionEqualToValue={(option: Designation, value: Designation) =>
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
          option: Designation,
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
              {`${option.title}`}
            </li>
          );
        },
      })}
      onChange={(
        event: React.SyntheticEvent,
        newValue: Designation | Designation[] | null
      ) => {
        onChange(newValue);
        setSelectedValue(newValue);
      }}
      renderTags={(tagValue: Designation[], getTagProps) => {
        return tagValue.map((option: Designation, index: number) => {
          const { key, ...restProps } = getTagProps({ index });
          return (
            <Chip
              {...restProps}
              key={`${option.id}-${key}`}
              label={`${option.title}`}
            />
          );
        });
      }}
    />
  );
};

export default DesignationSelector;
