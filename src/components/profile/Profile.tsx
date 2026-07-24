'use client';

import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import JumboChipsGroup from '@jumbo/components/JumboChipsGroup';
import JumboGridItem from '@jumbo/components/JumboList/components/JumboGridItem';
import { Div } from '@jumbo/shared';
import {
  AccessibilityNewOutlined,
  AlternateEmail,
  Person3Outlined,
  PhoneOutlined,
  VerifiedUser,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useMemo, useState } from 'react';
import MyHr from '../humanResources/myHr/MyHr';
import organizationServices from '../organizations/organizationServices';

function TabPanel({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div role='tabpanel' hidden={value !== index}>
      {value === index && <Box p={2}>{children}</Box>}
    </div>
  );
}
const Profile = () => {
  const dictionary = useDictionary();
  const lang = useLanguage();
  const { authUser, authOrganization, organizationHasSubscribed } =
    useJumboAuth();
  const organization = authOrganization?.organization;
  const [value, setValue] = useState(0);
  const [statusColor, setStatusColor] = useState<
    'success' | 'primary' | 'error'
  >('success');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', organization?.id],
    queryFn: () =>
      organizationServices.getOrganizationUsers({
        organizationId: organization?.id,
      }),
    enabled: !!organization?.id,
  });

  const currentUser = useMemo(() => {
    if (users) {
      return users.find((user: any) => user.id === authUser?.user.id);
    } else {
      return authUser;
    }
  }, [users, organization?.id]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Card>
      <CardContent>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor='primary'
          textColor='primary'
          variant='scrollable'
          scrollButtons='auto'
        >
          <Tab
            icon={<Person3Outlined />}
            iconPosition='start'
            label={'Profile'}
            aria-controls={`tabpanel-profile`}
          />
          {organizationHasSubscribed(MODULES.HUMAN_RESOURCES) && (
            <Tab
              icon={<AccessibilityNewOutlined />}
              iconPosition='start'
              label={'My Hr'}
              aria-controls={`tabpanel-my-hr`}
            />
          )}
        </Tabs>

        <TabPanel value={value} index={0}>
          <JumboGridItem size={{ xs: 12, lg: 4 }}>
            {isLoading ? (
              <Card variant='outlined' sx={{ p: 2 }}>
                <Stack direction={'row'} gap={2} alignItems={'center'}>
                  {currentUser && (
                    <Avatar
                      sx={{ width: 48, height: 48 }}
                      alt={currentUser?.name}
                      src={currentUser?.profile_pic}
                    />
                  )}
                  <Skeleton sx={{ width: '100%', height: 58 }} />
                </Stack>
                {[1, 2, 3, 4].map((itm, idx) => (
                  <Skeleton key={idx} sx={{ width: '100%', height: 58 }} />
                ))}
              </Card>
            ) : (
              <>
                <Card variant='outlined' elevation={0}>
                  <CardHeader
                    avatar={
                      <Avatar
                        sx={{ width: 48, height: 48 }}
                        alt={currentUser?.name}
                        src={currentUser?.profile_pic}
                      />
                    }
                    title={
                      <Typography
                        variant={'h6'}
                        color={'text.primary'}
                        mb={0.25}
                      >
                        {currentUser?.name}
                      </Typography>
                    }
                    subheader={
                      <Typography variant={'body1'} color={'text.secondary'}>
                        {/* Subheader content */}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    <List disablePadding>
                      <ListItem sx={{ px: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 50 }}>
                          <AlternateEmail />
                        </ListItemIcon>
                        <ListItemText primary={currentUser?.email} />
                      </ListItem>
                      <ListItem sx={{ px: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 50 }}>
                          <PhoneOutlined />
                        </ListItemIcon>
                        <ListItemText primary={currentUser?.phone} />
                      </ListItem>
                      <Tooltip
                        title={
                          dictionary.organizations.profile.usersTab.listItem
                            .tooltip.status
                        }
                      >
                        <ListItem sx={{ px: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 50 }}>
                            <VerifiedUser color={statusColor} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Chip
                                size='small'
                                label={currentUser?.status}
                                color={statusColor}
                              />
                            }
                          />
                        </ListItem>
                      </Tooltip>
                    </List>
                    <Divider sx={{ my: 2 }} />
                    <Tooltip
                      title={
                        dictionary.organizations.profile.usersTab.listItem
                          .tooltip.roles
                      }
                    >
                      <Div
                        sx={{
                          display: 'flex',
                          minWidth: 0,
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        {currentUser?.organization_roles?.length! > 0 && (
                          <JumboChipsGroup
                            chips={currentUser?.organization_roles}
                            mapKeys={{ label: 'name' }}
                            spacing={1}
                            size='small'
                            max={3}
                          />
                        )}
                      </Div>
                    </Tooltip>
                  </CardContent>
                </Card>
              </>
            )}
          </JumboGridItem>
        </TabPanel>

        <TabPanel value={value} index={1}>
          {<MyHr />}
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default Profile;
