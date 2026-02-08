// src/components/AppIcon.tsx
'use client';

import React from 'react';
import { Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconName, ICONS } from '@/utilities/constants/icons';

const SIZE = 20;

export default function AppIcon({ name }: { name: IconName }) {
  const icon = ICONS[name];

  // FontAwesome
  if (typeof icon === 'object' && 'icon' in icon) {
    return (
      <Box sx={{ width: SIZE, height: SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesomeIcon icon={icon} style={{ width: SIZE - 2, height: SIZE - 2 }} />
      </Box>
    );
  }

  // MUI Icon
  const IconComponent = icon as React.ElementType;
  return <IconComponent sx={{ fontSize: SIZE }} />;
}