import {
  Autocomplete,
  Checkbox,
  Chip,
  LinearProgress,
  TextField,
  AutocompleteRenderOptionState,
} from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Organization } from "@/types/auth-types";
import organizationServices from "../organizationServices";

type OrganizationsSelectorProps = {
  onChange: (value: Organization | Organization[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: number | null;
  frontError?: { message?: string } | null;
};

const OrganizationsSelector = ({
  onChange,
  multiple = false,
  label = "Organization",
  defaultValue = null,
  frontError = null,
}: OrganizationsSelectorProps) => {
  
  const { data: allOrganizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ['organizationsOptions'],
    queryFn: organizationServices.getOptions,
  });

  const [selectedOrganizations, setSelectedOrganizations] = useState<Organization | Organization[] | null>(
    multiple ? [] : null
  );

  useEffect(() => {
    if (defaultValue !== null) {
      const defaultOrg = allOrganizations.find((org) => 
        typeof defaultValue === 'number' 
          ? Number(org.id) === defaultValue 
          : org.id === defaultValue
      ) || null;
      setSelectedOrganizations(multiple ? (defaultOrg ? [defaultOrg] : []) : defaultOrg);
    }
  }, [defaultValue, allOrganizations, multiple]);

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      isOptionEqualToValue={(option, value) => option.id === value.id}
      options={allOrganizations}
      disableCloseOnSelect={multiple}
      value={selectedOrganizations || (multiple ? [] : null)}
      getOptionLabel={(option) => option.name}
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
        tagValue.map((option: Organization, index: number) => (
          <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
        ))
      }
      {...(multiple && {
        renderOption: (
          props: React.HTMLAttributes<HTMLLIElement>,
          option: Organization,
          { selected }: AutocompleteRenderOptionState
        ) => (
          <li {...props}>
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
      onChange={(_, newValue) => {
        onChange(newValue);
        setSelectedOrganizations(newValue);
      }}
    />
  );
};

export default OrganizationsSelector;
