import React from 'react';
import { Grid } from '@mui/material';
import { ReactNode } from 'react';

interface ToolbarActionProps {
  action?: ReactNode;
  actionTail?: ReactNode;
}

const ToolbarAction: React.FC<ToolbarActionProps> = ({ action, actionTail }) => {
  return (
    <Grid container spacing={1} justifyContent="flex-end" sx={{ width: '100%' }}>
      {action && (
        <Grid size={{xs: 12, md: 12}} sx={{ padding: 1 }}>
          {action}
        </Grid>
      )}
      {actionTail && (
        <Grid size={{xs: 12, md: 6}} sx={{ padding: 1 }}>
          {actionTail}
        </Grid>
      )}
    </Grid>
  );
};

export default ToolbarAction;
