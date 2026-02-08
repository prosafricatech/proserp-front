import { Div } from '@jumbo/shared';
import { CircularProgress, Stack, Typography } from '@mui/material';
import React from 'react';

interface CenteredSpinnerProps {
  message?: string | React.ReactNode;
  size?: number;
  color?: 'primary' | 'secondary' | 'inherit';
  sx?: React.ComponentProps<typeof Typography>['sx'];
}

export const CenteredSpinner: React.FC<CenteredSpinnerProps> = ({
  message,
  size = 40,
  color = 'primary',
  sx = {}
}) => {
  return (
    <Stack sx={{ width: '100%' }} spacing={2}>
      <Typography
        component="div"
        sx={{
          textAlign: 'center',
          flexGrow: 1,
          ...sx
        }}
      >
        <CircularProgress color={color} size={size} />
        {message && (
          <Div sx={{ p: 2 }}>
            {typeof message === 'string' ? (
              message
            ) : (
              message
            )}
          </Div>
        )}
      </Typography>
    </Stack>
  );
};