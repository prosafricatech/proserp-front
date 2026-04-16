import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  AddOutlined,
  CheckBox,
  CheckBoxOutlineBlank,
} from '@mui/icons-material';
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import measurementUnitServices from './measurement-unit-services';
import { MeasurementUnit } from './MeasurementUnitType';

interface MeasurementSelectorProps {
  onChange: (value: MeasurementUnit | MeasurementUnit[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: number | null;
  frontError?: { message: string } | null;
  showQuickAdd?: boolean;
  onQuickAddClick?: () => void;
  value?: MeasurementUnit | MeasurementUnit[] | null;
}

const MeasurementSelector: React.FC<MeasurementSelectorProps> = (props) => {
  const {
    onChange,
    multiple = false,
    label = 'Measurement Unit',
    defaultValue = null,
    frontError = null,
    showQuickAdd = false,
    onQuickAddClick = () => {},
  } = props;

  const { data: measurementUnits, isLoading } = useQuery<
    MeasurementUnit[],
    Error
  >({
    queryKey: ['measurementUnitsOptions'],
    queryFn: () => measurementUnitServices.getAllMeasurementUnits(),
  });

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // Initialize selectedMeasurementUnits based on defaultValue
  const [selectedMeasurementUnits, setSelectedMeasurementUnits] = useState<
    MeasurementUnit | MeasurementUnit[] | null
  >(() => {
    if (defaultValue !== null && measurementUnits) {
      return (
        measurementUnits.find(
          (measurementUnit: MeasurementUnit) =>
            measurementUnit.id === defaultValue
        ) || null
      );
    }
    return multiple ? [] : null;
  });

  useEffect(() => {
    // Update selectedMeasurementUnits if defaultValue changes
    if (defaultValue !== null && measurementUnits) {
      setSelectedMeasurementUnits(
        measurementUnits.find(
          (measurementUnit: MeasurementUnit) =>
            measurementUnit.id === defaultValue
        ) || null
      );
    }
  }, [defaultValue, measurementUnits]);

  useEffect(() => {
    if (props.value !== undefined) {
      setSelectedMeasurementUnits(props.value ?? (multiple ? [] : null));
    }
  }, [props.value]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      multiple={multiple}
      size='small'
      isOptionEqualToValue={(option, value) => option.id === value.id}
      options={measurementUnits || []}
      disableCloseOnSelect={multiple}
      value={props.value ?? selectedMeasurementUnits}
      getOptionLabel={(option: any) =>
        option.name !== option.symbol
          ? `${option.name} (${option.symbol})`
          : option.name
      }
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            startAdornment: showQuickAdd && (
              <Tooltip
                title={'Quick Add Measurement Unit'}
                onClick={onQuickAddClick}
              >
                <AddOutlined sx={{ cursor: 'pointer' }} />
              </Tooltip>
            ),
          }}
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
              label={
                option.name !== option.symbol
                  ? `${option.name} (${option.symbol})`
                  : option.name
              }
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
                icon={<CheckBoxOutlineBlank fontSize='small' />}
                checkedIcon={<CheckBox fontSize='small' />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
            )}
            {option.name !== option.symbol
              ? `${option.name} (${option.symbol})`
              : option.name}
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
