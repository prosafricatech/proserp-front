'use client';

import React, { createContext, useRef, useCallback, useState } from 'react';
import { Alert, Card, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import { AddOutlined } from '@mui/icons-material';
import { SxProps, Theme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import Link from 'next/link';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { OrganizationListItem } from './OrganizationListItem';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import { Organization, User } from '@/types/auth-types';
import organizationServices from '../organizationServices';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { Dictionary } from '@/dictionaries/type';
import { signOut } from 'next-auth/react';

interface QueryOptions<TQueryKey> {
  queryKey: string;
  queryParams: {
    id?: string;
    keyword: string;
    lang: string;
    router: any;
  };
  countKey: string;
  dataKey: string;
}

interface OrganizationListContextType {
  refetchOrganizations: () => void;
}

export const OrganizationListContext = createContext<OrganizationListContextType>({
  refetchOrganizations: () => {},
});

interface OrganizationsListProps {
  user: User;
  dictionary: Dictionary
}

const OrganizationsList: React.FC<OrganizationsListProps> = ({ user }) => {
  const dictionary = useDictionary();
  const lang = useLanguage();

  const router = useRouter();
  const listRef = useRef<{ refresh: () => Promise<void> }>(null);
  const { checkPermission, authUser, resetAuth } = useJumboAuth();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const canAddOrganization = checkPermission([PROS_CONTROL_PERMISSIONS.ORGANIZATIONS_MANAGE]);

  const [queryOptions, setQueryOptions] = useState<
    QueryOptions<[string, { id?: string; keyword: string }]>
  >({
    queryKey: 'organizations',
    queryParams: { id: user?.id, keyword: '', lang, router },
    countKey: 'total',
    dataKey: 'data',
  });

  React.useEffect(() => {
    setQueryOptions(prev => ({
      ...prev,
      queryKey: 'organizations',
      queryParams: { ...prev.queryParams, id: user?.id },
    }));
  }, [user]);

  const renderOrganization = useCallback((organization: Organization) => {
    return organization ? (
      <OrganizationListItem organization={organization} />
    ) : null;
  }, []);

  const handleOnChange = useCallback((keyword: string) => {
    setQueryOptions(prev => ({
      ...prev,
      queryKey: 'organizations',
      queryParams: {
        ...prev.queryParams,
        keyword,
      },
    }));
  }, []);

  const refetchOrganizations = useCallback(() => {
    listRef.current?.refresh();
  }, []);

  const wrapperSx: SxProps<Theme> = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  React.useEffect(() => {
    if (authUser?.user === null) {
      signOut({
        callbackUrl: `http://localhost:3000/${lang}/auth/signin`,
      });
      resetAuth();
    }
  }, [authUser?.user, signOut, router, lang]);

  if (!mounted) return null;

  return (
    <OrganizationListContext.Provider value={{ refetchOrganizations }}>
      <React.Fragment>
        <Typography variant={'h4'} mb={2}>{dictionary.organizations.list.labels.listHeader}</Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={organizationServices.getList}
          primaryKey={"id"}
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[8, 10, 15, 20]}
          renderItem={renderOrganization}
          componentElement={"div"}
          wrapperSx={wrapperSx}
          noDataPlaceholder={
            <Alert variant="outlined" severity="info">
              <span>{dictionary.organizations.list.messages.noOrganizations}</span>
              <span>
                {dictionary.organizations.list.messages.invitationText}
                <Link href={`/${lang}/invitations`}>
                  {dictionary.organizations.list.labels.invitationLink}
                </Link>
              </span>
            </Alert>
          }
          toolbar={
            <JumboListToolbar
              hideItemsPerPage={true}
              actionTail={
                <Stack direction={'row'}>
                  <JumboSearch
                    onChange={handleOnChange}
                    value={queryOptions.queryParams.keyword}
                  />
                  {canAddOrganization && (
                    <Tooltip title={dictionary.organizations.list.labels.newCreateLabel}>
                      <IconButton onClick={() => router.push(`/${lang}/organizations/create`)}>
                        <AddOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              }
            />
          }
        />
      </React.Fragment>
    </OrganizationListContext.Provider>
  );
};

export default OrganizationsList;