import { useQuery } from "@tanstack/react-query";
import { Autocomplete, Checkbox, Chip, LinearProgress, TextField } from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useEffect, useState } from "react";
import measurementUnitServices from "./measurement-unit-services";
import { MeasurementUnit } from "./MeasurementUnitType";

interface MeasurementSelectorProps {
  onChange: (value: MeasurementUnit | MeasurementUnit[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: number | null;
  frontError?: { message: string } | null;
}

const MeasurementSelector: React.FC<MeasurementSelectorProps> = (props) => {
  const { 
    onChange, 
    multiple = false, 
    label = 'Measurement Unit', 
    defaultValue = null, 
    frontError = null 
  } = props;

  const { data: measurementUnits, isLoading } = useQuery<MeasurementUnit[], Error>({
    queryKey: ['measurementUnitsOptions'],
    queryFn: () => measurementUnitServices.getAllMeasurementUnits()
  });

  // Initialize selectedMeasurementUnits based on defaultValue
  const [selectedMeasurementUnits, setSelectedMeasurementUnits] = useState<
    MeasurementUnit | MeasurementUnit[] | null
  >(() => {
    if (defaultValue !== null && measurementUnits) {
      return measurementUnits.find((measurementUnit: MeasurementUnit) => measurementUnit.id === defaultValue) || null;
    }
    return multiple ? [] : null;
  });

  useEffect(() => {
    // Update selectedMeasurementUnits if defaultValue changes
    if (defaultValue !== null && measurementUnits) {
      setSelectedMeasurementUnits(
        measurementUnits.find((measurementUnit: MeasurementUnit) => measurementUnit.id === defaultValue) || null
      );
    }
  }, [defaultValue, measurementUnits]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      isOptionEqualToValue={(option, value) => option.id === value.id}
      options={measurementUnits || []}
      disableCloseOnSelect={multiple}
      value={selectedMeasurementUnits}
      
      getOptionLabel={(option: any) => 
        option.name !== option.symbol ? `${option.name} (${option.symbol})` : option.name
      }
      
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
              key={`${option.id}-${key}`} 
              label={option.name !== option.symbol ? `${option.name} (${option.symbol})` : option.name} 
            />
          );
        });
      }}

      renderOption={(props, option, { selected }) => {
        const { key, ...restProps } = props;
        return (
          <li {...restProps} key={`${option.id}-${key}`}>
            {multiple && (
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
            )}
            {option.name !== option.symbol ? `${option.name} (${option.symbol})` : option.name}
          </li>
        );
      }}
        
      onChange={(e, newValue) => {
        onChange(newValue);
        setSelectedMeasurementUnits(newValue);
      }}
    />
  );
};

export default MeasurementSelector;