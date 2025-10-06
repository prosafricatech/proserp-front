import { FormControlLabel, Switch } from '@mui/material';

function MaterialUsedSelector({ aggregated, onChange }) {
  const handleToggle = (event) => {
    onChange(event.target.checked);
  };

  return (
    <FormControlLabel
      control={
        <Switch
          checked={aggregated}
          onChange={handleToggle}
          color="primary"
        />
      }
      label={"Aggregated"}
    />
  );
}

export default MaterialUsedSelector;
