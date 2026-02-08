import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import { Avatar, Grid, ListItemAvatar, Tooltip, Typography } from '@mui/material'
import React from 'react'
import ProsAfricansListItemAction from './ProsAfricansListItemAction';
import { Div } from '@jumbo/shared';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  profile_pic: any
  phone: string
  roles: Role[];
}

interface ProsAfricansListItemProps {
  user: User;
}

function ProsAfricansListItem({ user }: ProsAfricansListItemProps) {
  return (
    <React.Fragment>
        <Grid 
            container 
            columnSpacing={1}
            padding={1}  
            sx={{
                cursor: 'pointer',
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'action.hover',
                }
            }}
        >
            <Grid size={{ md: 1, lg: 0.5 }} paddingTop={0.5}>
                <ListItemAvatar sx={{ display: { 'xs' : 'none', md:'block'} }}>
                    <Avatar alt={user.name} src={user?.profile_pic ? user.profile_pic : '#'}/>
                </ListItemAvatar>
            </Grid>
            <Grid size={{ xs: 4, md: 2, lg: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <Tooltip title={'Name'}>
                        <Typography>{user.name}</Typography>
                    </Tooltip>
                </Div>
            </Grid>
            <Grid size={{ xs: 6, md: 4, lg: 3.5 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <Tooltip title={'Email'}>
                        <Typography>{user.email}</Typography>
                    </Tooltip>
                </Div>
            </Grid>
            <Grid size={{ xs: 5, md: 2, lg: 2 }}>
                <Div sx={{ mt: 1, mb: 1, paddingLeft: 1 }}>
                    <Tooltip title={'Phone'}>
                        <Typography>{user.phone || 'N/A'}</Typography>
                    </Tooltip>
                </Div>
            </Grid>
            <Grid size={{ xs: 5, md: 2, lg: 2 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                    <JumboChipsGroup
                        chips={user.roles}
                        mapKeys={{label: "name"}}
                        spacing={1}
                        size={"small"}
                        max={1}
                    />
                </Div>
            </Grid>
            <Grid size={{ xs: 2, md: 1, lg: 1 }} textAlign={"end"}>
                <ProsAfricansListItemAction user={user} />  
            </Grid>
        </Grid>
    </React.Fragment>
  )
}

export default ProsAfricansListItem