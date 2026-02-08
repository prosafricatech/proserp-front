import { Autocomplete, Checkbox, Chip, TextField } from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useEffect, useState } from "react";

const ConsumptionableSelector = (props) => {
    const { onChange, multiple = false, label = 'Measurement Unit', defaultValue = null, frontError = null } = props;

    const consumptionableTypes = [
        { label: 'Production Batch', value: 'production_batch' }
    ] 
    
    const [selectedMeasurementUnits, setSelectedMeasurementUnits] = useState(() => {
        if (defaultValue !== null) {
            return consumptionableTypes?.find(measurementUnit => measurementUnit.value === defaultValue) || null;
        }
            return multiple ? [] : null;
    });

    useEffect(() => {
        if (defaultValue !== null) {
            setSelectedMeasurementUnits(consumptionableTypes?.find(measurementUnit => measurementUnit.value === defaultValue) || null);
        }
    }, [defaultValue]);

    return (
        <Autocomplete
            multiple={multiple}
            size="small"
            isOptionEqualToValue={(option, value) => option.id === value.id}
            options={consumptionableTypes}
            disableCloseOnSelect={multiple}
            value={selectedMeasurementUnits}
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
                return (
                    <Chip 
                        {...restProps} 
                        key={option.id + "-" + key} 
                        label={option.name !== option.symbol ? `${option.name} (${option.symbol})` : option.name} 
                    />
                );
                });
            }}

            // Conditionally render the renderOption property
            {...(multiple && {
                renderOption: (props, option, { selected }) => {
                const { key, ...restProps } = props;
                return (
                    <li {...restProps} key={option.id + "-" + key}>
                        <Checkbox
                            icon={<CheckBoxOutlineBlank fontSize="small" />}
                            checkedIcon={<CheckBox fontSize="small" />}
                            style={{ marginRight: 8 }}
                            checked={selected}
                        />
                        {option.name !== option.symbol ? `${option.name} (${option.symbol})` : option.name}
                    </li>
                );
                }
            })}
                
            onChange={(e, newValue) => {
                onChange(newValue);
                setSelectedMeasurementUnits(newValue);
            }}
        />
    );
};

export default ConsumptionableSelector;
