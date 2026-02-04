import {
  Divider,
  ListItem,
  ListItemIcon,
  ListItemProps,
  ListItemText,
} from '@mui/material';
import React from 'react';

type IconLabelListItemProps = ListItemProps & {
  icon: React.ReactNode;
  text: string;
  divider?: boolean;
};

function IconLabelListItem({
  icon,
  text,
  divider = true,
  ...restProps
}: IconLabelListItemProps) {
  return (
    <React.Fragment>
      <ListItem sx={{ p: (theme) => theme.spacing(1.5, 3) }} {...restProps}>
        <ListItemIcon sx={{ minWidth: 36, color: 'text.primary' }}>
          {icon}
        </ListItemIcon>
        <ListItemText primary={text} />
      </ListItem>
      {divider && <Divider component='li' />}
    </React.Fragment>
  );
}

export { IconLabelListItem };
