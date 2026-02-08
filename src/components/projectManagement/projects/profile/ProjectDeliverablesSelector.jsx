import { Autocomplete, Checkbox, Chip, TextField } from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useProjectProfile } from "./ProjectProfileProvider";

const ProjectDeliverablesSelector = (props) => {
  const { onChange, multiple = false, label = 'Deliverable', defaultValue = null, frontError = null } = props;
  const { project, deliverablesLoading } = useProjectProfile();
  
  // Handle loading state or missing data gracefully
  const { deliverable_groups = [] } = project || {};
  const deliverables = deliverable_groups.map(deliverable_group => 
    deliverable_group.deliverables || []
  ).flat();
  
  const [selectedDeliverables, setSelectedDeliverables] = useState(() => {
    if (defaultValue !== null) {
      if (multiple && Array.isArray(defaultValue)) {
        return deliverables.filter(deliverable => 
          defaultValue.includes(deliverable.id)
        );
      } else if (!multiple && typeof defaultValue === 'number') {
        return deliverables.find(deliverable => deliverable.id === defaultValue) || null;
      }
    }
    return multiple ? [] : null;
  });

  // Update selected deliverables when deliverables data changes
  useEffect(() => {
    if (defaultValue !== null && deliverables.length > 0) {
      if (multiple && Array.isArray(defaultValue)) {
        const newSelection = deliverables.filter(deliverable => 
          defaultValue.includes(deliverable.id)
        );
        setSelectedDeliverables(newSelection);
      } else if (!multiple && typeof defaultValue === 'number') {
        const newSelection = deliverables.find(deliverable => 
          deliverable.id === defaultValue
        ) || null;
        setSelectedDeliverables(newSelection);
      }
    }
  }, [deliverables, defaultValue, multiple]);

  // Handle loading state
  if (deliverablesLoading) {
    return (
      <TextField
        fullWidth
        label={label}
        size="small"
        placeholder="Loading deliverables..."
        disabled
      />
    );
  }

  return (
    <Autocomplete
      multiple={multiple}
      size="small"
      isOptionEqualToValue={(option, value) => option.id === value.id}
      getOptionLabel={(option) => option.name || ''}
      options={deliverables}
      disableCloseOnSelect={multiple}
      value={selectedDeliverables}
      loading={deliverablesLoading}
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
              {option.name}
            </li>
          );
        }
      })}
      onChange={(e, newValue) => {
        onChange(newValue);
        setSelectedDeliverables(newValue);
      }}
    />
  );
};

export default ProjectDeliverablesSelector;