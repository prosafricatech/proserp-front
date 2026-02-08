'use client'

import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Autocomplete, Box, Checkbox, Chip, LinearProgress, TextField } from '@mui/material';
import React, { useState } from 'react';
import costCenterservices from './cost-center-services';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { CostCenter } from './CostCenterType';

interface CostCenterSelectorProps {
  frontError?: { message?: string } | null;
  removedCostCenters?: number[];
  allowAllCostCenters?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  allowSameType?: boolean;
  label?: string;
  multiple?: boolean;
  withNotSpecified?: boolean;
  defaultValue?: CostCenter | CostCenter[] | null;
  onChange?: (value: CostCenter | CostCenter[] | null) => void;
}

function CostCenterSelector(props: CostCenterSelectorProps) {
  const { authOrganization } = useJumboAuth();
  const { 
    frontError = null, 
    removedCostCenters = [], 
    allowAllCostCenters = false, 
    disabled = false, 
    readOnly = false, 
    allowSameType = false, 
    label = 'Cost Center', 
    multiple = true, 
    withNotSpecified = false,
    onChange
  } = props;

  type SelectedType = CostCenter[] | CostCenter | null;
  const [selectedItems, setSelectedItems] = useState<SelectedType>(
    props.defaultValue ?? (multiple ? [] : null)
  );

  const { data: fetchedCostCenters, isLoading } = useQuery<CostCenter[]>({
    queryKey: ['allCostCenters'],
    queryFn: costCenterservices.getCostCenters,
    enabled: !!allowAllCostCenters
  });

  // Helper function to create a "Not Specified" option
  const createNotSpecifiedOption = (): CostCenter => ({
    id: -1,
    name: 'Not Specified',
    code: null,
    description: null,
    status: 'active',
    type: 'Unassigned',
  });

  const authOrganizationCostCenters = authOrganization?.costCenters
    ? withNotSpecified
      ? [createNotSpecifiedOption(), ...authOrganization.costCenters]
      : authOrganization.costCenters
    : withNotSpecified
    ? [createNotSpecifiedOption()]
    : [];

  const allCostCenters = fetchedCostCenters
    ? withNotSpecified
      ? [createNotSpecifiedOption(), ...fetchedCostCenters]
      : fetchedCostCenters
    : withNotSpecified
    ? [createNotSpecifiedOption()]
    : [];

  // Filter out removed cost centers
  const filteredCostCenters = (costCenters: CostCenter[]) =>
    costCenters.filter(
      (center) => !removedCostCenters.some((removed) => removed === center.id)
    );

  const finalCostCenters = allowAllCostCenters
    ? filteredCostCenters(allCostCenters)
    : filteredCostCenters(authOrganizationCostCenters);

  const handleOnChange = (
    event: React.SyntheticEvent, 
    newValue: CostCenter | CostCenter[] | null
  ) => {
    if (!allowSameType && multiple && Array.isArray(newValue)) {
      const uniqueTypes = Array.from(new Set(newValue.map(item => item.type)));
      if (uniqueTypes.length !== newValue.length) {
        newValue = newValue.filter(
          (item, index, arr) => arr.findIndex(i => i.type === item.type) === index
        );
      }
    }

    setSelectedItems(newValue);
    onChange?.(newValue);
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ minWidth: 150 }}>
      <Autocomplete
        multiple={multiple}
        options={finalCostCenters}
        disabled={disabled}
        readOnly={readOnly}
        getOptionLabel={(option: CostCenter) => option.name}
        isOptionEqualToValue={(option: CostCenter, value: CostCenter) => option.id === value.id}
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
        value={selectedItems}
        onChange={handleOnChange}
        renderTags={(tagValue: CostCenter[], getTagProps) => {
          return tagValue.map((option: CostCenter, index: number) => {
            const { key, ...restProps } = getTagProps({ index });
            return <Chip {...restProps} key={`${option.id}-${key}`} label={option.name} />;
          });
        }}
        {...(multiple && { 
          renderOption: (
            props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key }, // extend type to include key optionally
            option: CostCenter,
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
    </Box>
  );
}

export default CostCenterSelector;