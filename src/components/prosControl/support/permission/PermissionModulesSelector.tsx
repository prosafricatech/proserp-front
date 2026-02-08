"use client";
import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
} from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import supportServices from "../support-services";
import { useQuery } from "@tanstack/react-query";

export interface PermissionModule {
  id: string | number;
  name: string;
}

interface PermissionModulesSelectorProps {
  onChange: (selected: PermissionModule[] | PermissionModule | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: (PermissionModule | number | string)[] | PermissionModule | null;
  frontError?: { message: string } | null;
}

const PermissionModulesSelector: React.FC<PermissionModulesSelectorProps> = ({
  onChange,
  multiple = false,
  label = "Module",
  defaultValue = null,
  frontError = null,
}) => {
  const { data: permissionModules = [], isLoading } = useQuery<PermissionModule[]>({
    queryKey: ["modules"],
    queryFn: supportServices.getModules,
  });

  const [selectedModule, setSelectedModule] = useState<
    PermissionModule[] | PermissionModule | null
  >(multiple ? [] : null);

  useEffect(() => {
    if (permissionModules.length > 0 && defaultValue) {
      if (multiple) {
        const ids = (defaultValue as any[]).map((v) =>
          typeof v === "object" ? v.id : v
        );
        setSelectedModule(
          permissionModules.filter((module) => ids.includes(module.id))
        );
      } else {
        const defaultId =
          typeof defaultValue === "object"
            ? (defaultValue as PermissionModule).id
            : defaultValue;
        setSelectedModule(
          permissionModules.find((module) => module.id === defaultId) || null
        );
      }
    }
  }, [permissionModules, defaultValue, multiple]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete<PermissionModule, boolean, boolean, boolean>
      multiple={multiple}
      size="small"
      options={permissionModules}
      disableCloseOnSelect={multiple}
      value={selectedModule as any}
      getOptionLabel={(option: any) => option.name}
      // THIS IS THE KEY FIX
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
        />
      )}
      renderTags={(tagValue, getTagProps) =>
        (tagValue as PermissionModule[]).map((option, index) => {
          const { key, ...restProps } = getTagProps({ index });
          return (
            <Chip
              {...restProps}
              key={option.id + "-" + key}
              label={option.name}
            />
          );
        })
      }
      {...(multiple && {
        renderOption: (props, option, { selected }) => (
          <li {...props} key={option.id}>
            <Checkbox
              icon={<CheckBoxOutlineBlank fontSize="small" />}
              checkedIcon={<CheckBox fontSize="small" />}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.name}
          </li>
        ),
      })}
      onChange={(event, newValue) => {
        setSelectedModule(newValue as PermissionModule[] | PermissionModule | null);
        onChange(newValue as PermissionModule[] | PermissionModule | null);
      }}
    />
  );
};

export default PermissionModulesSelector;