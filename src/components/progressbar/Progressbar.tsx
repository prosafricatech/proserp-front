import { LinearProgress, LinearProgressProps, Typography } from '@mui/material';
import React from 'react';

type ProgressbarProps = LinearProgressProps & {
  label?: React.ReactNode;
  subLabel?: React.ReactNode;
};

function Progressbar({
  value = 0,
  label,
  subLabel,
  sx,
  ...rest
}: ProgressbarProps) {
  return (
    <>
      {label && (
        <Typography variant={'h6'} color={'text.primary'}>
          {label}
          {subLabel && (
            <Typography
              sx={{ borderLeft: 1, ml: 1, pl: 1 }}
              component={'span'}
              color={'text.secondary'}
            >
              {subLabel}
            </Typography>
          )}
        </Typography>
      )}
      <LinearProgress
        variant={'determinate'}
        color={'success'}
        value={value}
        sx={{
          borderRadius: 4,
          height: 5,
          mb: 2,
          backgroundColor: '#E9EEEF',
          ...sx,
          width: `${value}%`,
        }}
        {...rest}
      />
    </>
  );
}

export { Progressbar };
