'use client'

import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { ASSET_AVATARS } from '@/utilities/constants/paths';
import { getAssetPath } from '@/utilities/helpers';
import { CloseOutlined, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Avatar, Checkbox, Collapse, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemIcon, ListItemSecondaryAction, ListItemText } from '@mui/material';
import React, { useState, useEffect } from 'react';

interface Role {
  id: number | string;
  name: string;
  [key: string]: any; 
}

interface Invitee {
  id: string | number;
  name: string;
  email: string;
  roles?: Role[];
  selectedRoles: (number | string)[];
  [key: string]: any;
}

interface InvitationQueueItemProps {
  invitee: Invitee;
  setInvitees: React.Dispatch<React.SetStateAction<Invitee[]>>;
  invitees: Invitee[];
}

export const InvitationQueueItem: React.FC<InvitationQueueItemProps> = ({ 
  invitee, 
  setInvitees, 
  invitees 
}) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<(number | string)[]>(invitee.selectedRoles);

  useEffect(() => {
    setInvitees(prevInvitees => 
      prevInvitees.map(item => 
        item.id === invitee.id ? { ...item, selectedRoles } : item
      )
    );
  }, [selectedRoles, invitee.id, setInvitees]);

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;
    const sanitizedValue = sanitizedNumber(value);
    
    setSelectedRoles(prevRoles => 
      checked 
        ? [...prevRoles, sanitizedValue] 
        : prevRoles.filter(role => role !== sanitizedValue)
    );
  };

  return (
    <React.Fragment>
      <ListItem>
        <ListItemAvatar>
          <Avatar 
            alt={invitee.name} 
            src={getAssetPath(`${ASSET_AVATARS}/#`)}
          />
        </ListItemAvatar>
        <ListItemText 
          primary={invitee.name} 
          secondary={invitee.email}
        />

        {invitee.name !== 'Not Registered' && (
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
        
        <ListItemSecondaryAction>
          <IconButton 
            onClick={() => 
              setInvitees(invitees.filter(item => item.email !== invitee.email))
            }
            edge="end"
            aria-label="remove invitee"
          >
            <CloseOutlined color="error" />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
      
      {invitee.name !== 'Not Registered' && invitee?.roles?.map((role) => (
        <Collapse key={role.id} in={expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <ListItemIcon>
                <Checkbox 
                  value={role.id} 
                  onChange={handleChecked}
                  checked={selectedRoles.includes(role.id)}
                />
              </ListItemIcon>
              <ListItemText primary={role.name} />
            </ListItem>
          </List>
        </Collapse>
      ))}
      
      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};