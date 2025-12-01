import { Autocomplete, Chip, TextField } from "@mui/material";
import { useEffect, useState } from "react";

const OperationSelector = (props) => {
  const { onChange, multiple = false, label = 'Operator', defaultValue = null, frontError = null } = props;

  const operations = [
    { label: 'Add (+)', value: '+' },
    { label: 'Deduct (-)', value: '-' },
  ];

  // Initsalize selectedOperator based on defaultValue
  const [selectedOperator, setSelectedOperator] = useState(() => {
    if (defaultValue !== null) {
      return operations?.find(operator => operator.value === defaultValue) || null;
    }
    return multiple ? [] : null;
  });

  useEffect(() => {
    // Update SelectedOperator if defaultValue changes
    if (defaultValue !== null) {
      setSelectedOperator(operations?.find(operator => operator.value === defaultValue) || null);
    }
  }, [defaultValue]);

  return (
    <Autocomplete
        multiple={multiple}
        size="small"
        isOptionEqualToValue={(option, value) => option.label === value.label}
        options={operations}
        disableCloseOnSelect={multiple}
        value={selectedOperator}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            error={!!frontError}
            helperText={frontError?.message}
            fullWidth
            label={label}
            size='small'
            placeholder={label}
          />
        )}

        renderTags={(tagValue, getTagProps) => {
            return tagValue.map((option, index) => {
                const { key, ...restProps } = getTagProps({ index });
                return <Chip {...restProps} key={option.id + "-" + key} label={option.name} />;
            });
        }}
        onChange={(e, newValue) => {
            onChange(newValue);
            setSelectedOperator(newValue);
        }}
    />
  );
};

export default OperationSelector;
