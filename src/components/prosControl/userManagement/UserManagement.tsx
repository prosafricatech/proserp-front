'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Stack, Typography } from '@mui/material';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import userManagementServices from './user-management-services';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';
import UserManagementListItem from './UserManagementListItem';
import UserManagementActionTail from './UserManagementActionTail';
import { User } from './UserManagementType';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const UserManagement = () => {
    const params = useParams<{ id?: string }>();
    const listRef = useRef<any>(null);
    const { checkPermission } = useJumboAuth();
    const [mounted, setMounted] = useState(false);
    const dictionary = useDictionary();

    const [queryOptions, setQueryOptions] = useState({
      queryKey: 'userManagement',
      queryParams: { id: params.id, keyword: '' },
      countKey: 'total',
      dataKey: 'data',
    });

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      setQueryOptions((prev) => ({
        ...prev,
        queryParams: { ...prev.queryParams, id: params.id },
      }));
    }, [params]);

    const renderUserManager = useCallback((user: User) => {
      return <UserManagementListItem user={user} />;
    }, []);

    const handleSearchChange = useCallback((keyword: string) => {
      setQueryOptions((prev) => ({
        ...prev,
        queryParams: {
          ...prev.queryParams,
          keyword: keyword,
        },
      }));
    }, []);

    if (!mounted) return null;

 if (!checkPermission([PROS_CONTROL_PERMISSIONS.USERS_READ])) {
   return <UnauthorizedAccess />;
 }

  return (
          <>
              <Typography variant="h4" mb={2}>
                {dictionary.userManagement.form.labels.listHeader}
              </Typography>

              <JumboRqList
                ref={listRef}
                wrapperComponent={Card}
                service={userManagementServices.getList}
                primaryKey="id"
                queryOptions={queryOptions}
                itemsPerPage={10}
                itemsPerPageOptions={[5, 10, 20]}
                renderItem={renderUserManager}
                componentElement="div"
                wrapperSx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                toolbar={
                <JumboListToolbar
          hideItemsPerPage
          actionTail={
            <Stack direction="row" spacing={2}>
              <JumboSearch
                onChange={handleSearchChange}
                value={queryOptions.queryParams.keyword}
              />
              <UserManagementActionTail />
            </Stack>
          }
        />
        }
      />
    </>
  );
};

export default UserManagement;
