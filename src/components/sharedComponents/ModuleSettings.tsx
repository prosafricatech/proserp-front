import React, { useState } from 'react';
import { TextField, Switch, Grid, Typography, Tooltip, IconButton, Divider } from '@mui/material';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import moduleSettingsServices from './moduleSettingsServices';
import { useForm } from 'react-hook-form';
import { InfoOutlined } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';

interface ModuleSetting {
  id: number;
  name: string;
  description: string;
  data_type: 'boolean' | 'text' | 'integer' | 'string' | 'double';
  value: any;
}

interface Module {
  id: number;
  name: string;
  settings?: ModuleSetting[];
}

interface ModuleSettingsProps {
  module: Module[];
}

interface UpdatedSetting {
  module_setting_id: number;
  value: any;
}

const ModuleSettings: React.FC<ModuleSettingsProps> = ({ module }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [updatedSettings, setUpdatedSettings] = useState<UpdatedSetting[]>([]);

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: moduleSettingsServices.updateSettings,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      window.location.reload();
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'An error occurred', {
        variant: 'error',
      });
    },
  });

  const { handleSubmit } = useForm();

  const saveMutation = () => {
    if (updatedSettings.length === 0) {
      enqueueSnackbar('No changes to save', { variant: 'info' });
      return;
    }
    updateSettings({ settings: updatedSettings });
  };

  const handleSettingsChange = (id: number, value: any) => {
    setUpdatedSettings((prevSettings) => {
      const existingSettingIndex = prevSettings.findIndex(
        (item) => item.module_setting_id === id
      );
      if (existingSettingIndex > -1) {
        // Update the existing Setting Value
        const updatedValues = [...prevSettings];
        updatedValues[existingSettingIndex] = { module_setting_id: id, value };
        return updatedValues;
      } else {
        // Add a new Setting in updatedSettings array
        return [...prevSettings, { module_setting_id: id, value }];
      }
    });
  };

  if (!module || module.length === 0) {
    return <Typography>No module settings found</Typography>;
  }

  const settings = module[0].settings;

  return (
    <form onSubmit={handleSubmit(saveMutation)}>
      <Grid container spacing={1} padding={2}>
        {settings?.map((setting) => (
          <Grid size={12} key={setting.id}>
            <Grid container alignItems="center" spacing={1} paddingBottom={1}>
              <Grid size={{xs: 10, md: 5}}>
                <Typography variant="subtitle1">{setting.name}</Typography>
              </Grid>
              <Grid size={{xs: 2, md: 0.5}}>
                <Tooltip title={setting.description}>
                  <IconButton size="small" aria-label={`info-about-${setting.name}`}>
                    <InfoOutlined />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid size={{xs: 12, md: 6.5}}>
                {setting.data_type === 'boolean' ? (
                  <Switch
                    size="small"
                    defaultChecked={Boolean(setting.value)}
                    onChange={(e) => handleSettingsChange(setting.id, e.target.checked)}
                  />
                ) : setting.data_type === 'text' ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    variant="outlined"
                    defaultValue={setting.value}
                    onChange={(e) => handleSettingsChange(setting.id, e.target.value)}
                  />
                ) : setting.data_type === 'integer' ? (
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    variant="outlined"
                    defaultValue={Number(setting.value)}
                    onChange={(e) => handleSettingsChange(setting.id, parseInt(e.target.value))}
                  />
                ) : setting.data_type === 'string' ? (
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    defaultValue={String(setting.value)}
                    onChange={(e) => handleSettingsChange(setting.id, e.target.value)}
                  />
                ) : setting.data_type === 'double' ? (
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    variant="outlined"
                    defaultValue={Number(setting.value)}
                    onChange={(e) => handleSettingsChange(setting.id, parseFloat(e.target.value))}
                  />
                ) : null}
              </Grid>
            </Grid>
            <Divider />
          </Grid>
        ))}
        <Grid size={12} textAlign={'right'} padding={1}>
          <LoadingButton
            loading={isPending}
            type="submit"
            size="small"
            variant="contained"
            color="primary"
            disabled={updatedSettings.length === 0}
          >
            Save
          </LoadingButton>
        </Grid>
      </Grid>
    </form>
  );
};

export default ModuleSettings;