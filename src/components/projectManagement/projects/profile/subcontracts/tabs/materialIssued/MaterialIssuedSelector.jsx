import { FormControlLabel, Switch } from '@mui/material';

function MaterialIssuedSelector({ aggregated, onChange }) {
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

export default MaterialIssuedSelector;
