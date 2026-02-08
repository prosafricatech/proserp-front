import React from 'react';
import {
  Divider,
  Grid,
  Tooltip,
  Typography,
  Box,
  Stack,
  Avatar,
  Badge,
  Chip,
} from '@mui/material';
import UserManagementListItemActions from './UserManagementListItemAction';
import { User } from './UserManagementType';
import { Div } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

    type Props = {
      user: User;
      onUserUpdated?: () => void;
      actionTail?: React.ReactNode;
    };

    const UserManagementListItem = ({ user, onUserUpdated, actionTail }: Props) => {
    const dictionary = useDictionary();
    const isActive = user.status === 'active';

 return (
  <>
    <Divider />
    <Grid
      container
      columnSpacing={1}
      padding={1}
      sx={{
        cursor: 'pointer',
        borderTop: 1,
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        }
      }}
    >
      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Tooltip title={dictionary.userManagement.list.labels.name}>
            <Typography>{user.name}</Typography>
          </Tooltip>
        </Div>
      </Grid>

      <Grid size={{xs: 12, md: 3}}>
        <Div sx={{ mt: 1, mb: 1 }}>
          <Tooltip title={dictionary.userManagement.list.labels.email}>
            <Typography variant="body1">{user.email}</Typography>
          </Tooltip>
          <Tooltip title={'Phone'}>
            <Typography variant="body2" color="text.secondary">{user.phone}</Typography>
          </Tooltip>
        </Div>
      </Grid>

    <Grid size={{ xs: 12, md: 4 }} >
      <Div
        sx={{
          display: { xs: 'flex' },
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
        >
        {user?.organizations?.slice(0, 4).map((org, index) => (
          <Avatar
            key={org.id || index}
            alt={org.name}
            src={org.logo_path || ''}
            sx={{
              width: 45,
              height: 45,
              fontSize: 16,
              borderRadius: '50%',
            }}
          >
            {!org.logo_path && org.name?.charAt(0).toUpperCase()}
          </Avatar>
        ))}
        {user?.organizations && user?.organizations?.length > 4 && (
          <Avatar
            sx={{
              width: 35,
              height: 35,
              fontSize: 16,
              bgcolor: 'grey.400',
              color: 'white',
              borderRadius: '50%',
            }}
          >
            +{user.organizations?.length - 4}
          </Avatar>
        )}
      </Div>
    </Grid>

    <Grid size={{ xs: 4, md: 1 }} textAlign={"end"}>
      <Tooltip title={dictionary.userManagement.list.labels.status}>
          <Chip size='small' color={user.status === 'active' ? 'success' : 'error'} label={user.status} />
      </Tooltip>
    </Grid>

    <Grid size={{ xs: 12, md: 1 }} container justifyContent="flex-end">
      <UserManagementListItemActions
        user={user}
        onUserUpdated={onUserUpdated}
      />
      {actionTail}
    </Grid>
    </Grid>
  </>
);
}

export default UserManagementListItem;
