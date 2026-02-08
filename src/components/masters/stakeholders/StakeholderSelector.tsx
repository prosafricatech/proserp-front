import React, { useState } from 'react';
import { useStakeholderSelect } from './StakeholderSelectProvider';
import { Autocomplete, Checkbox, Chip, TextField } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Stakeholder, Stakeholders } from './StakeholderType';

interface StakeholderSelectorProps {
  onChange?: (value: Stakeholder | Stakeholder[] | null) => void;
  frontError?: { message: string } | null;
  multiple?: boolean;
  label?: string;
  initialOptions?: Stakeholders;
  addedStakeholder?: Stakeholder | null;
  startAdornment?: React.ReactNode;
  readOnly?: boolean;
  disabled?: boolean;
  defaultValue?: number | null;
}

function StakeholderSelector(props: StakeholderSelectorProps) {
  const {
    onChange,
    frontError = null,
    multiple = false,
    disabled = false,
    label = 'Stakeholder',
    initialOptions = [],
    addedStakeholder = null,
    startAdornment,
    readOnly = false,
    defaultValue = null,
  } = props;

  const { stakeholders = [] } = useStakeholderSelect();

  const options = [
    ...initialOptions,
    ...stakeholders.filter((stakeholder: Stakeholder) => stakeholder.id !== addedStakeholder?.id),
    ...(addedStakeholder?.id ? [addedStakeholder] : []),
  ];

  const comingStakeholderValue =
    (addedStakeholder && addedStakeholder) ||
    (defaultValue && options.find(stakeholder => stakeholder.id === defaultValue)) ||
    options.find(
      stakeholder =>
        stakeholder.name === 'Cash Purchase' ||
        stakeholder.name === 'Walk-in Customer' ||
        stakeholder.name === 'Internal use'
    );

  const [stakeholderValue, setStakeholderValue] = useState<Stakeholder | Stakeholder[] | null>(
    comingStakeholderValue ? comingStakeholderValue : multiple ? [] : null
  );

  const handleOnChange = (event: React.SyntheticEvent, newValue: Stakeholder | Stakeholder[] | null) => {
    onChange?.(newValue);
    setStakeholderValue(newValue);
  };

  return (
    <Autocomplete
      multiple={multiple}
      options={options}
      readOnly={readOnly}
      disabled={disabled}
      disableCloseOnSelect={multiple}
      getOptionLabel={(stakeholder) =>
        `${stakeholder.name}${stakeholder?.phone ? ' (' + stakeholder.phone + ')' : ''}`
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderInput={(params) => (
        <TextField
          {...params}
          error={!!frontError}
          helperText={frontError?.message}
          fullWidth
          label={label}
          size="small"
          placeholder={label}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {startAdornment && <div style={{ marginRight: 3 }}>{startAdornment}</div>}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
          value={
            multiple && Array.isArray(stakeholderValue)
              ? stakeholderValue.map((item) => `${item.name} - (${item.type})`).join(', ')
              : stakeholderValue
          }
        />
      )}
      value={stakeholderValue}
      onChange={handleOnChange}
      renderTags={(tagValue, getTagProps) => {
        return tagValue.map((option, index) => {
          const { key, ...restProps } = getTagProps({ index });
          return <Chip {...restProps} key={`${option.id}-${key}`} label={option.name} />;
        });
      }}
      {...(multiple && { 
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
          option: Stakeholder,
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
    />
  );
}

export default StakeholderSelector;