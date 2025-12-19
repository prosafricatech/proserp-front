'use client'

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Card, Grid } from '@mui/material';
import React, { useState, useMemo } from 'react';
import JumboSearch from '@jumbo/components/JumboSearch';
import { useOrganizationProfile } from '../OrganizationProfileProvider';
import { UserListItem } from './UserListItem';
import { ActionTail } from './ActionTail';
import { useParams } from 'next/navigation';
import { User } from '@/types/auth-types';
import organizationServices from '../../organizationServices';

interface QueryOptions {
  queryKey: string;
  queryParams: {
    id?: string;
    organizationId?: string;
    keyword?: string;
  };
  countKey: string;
  dataKey: string;
}

export const UsersList: React.FC = () => {
    const params = useParams();
    const { organization } = useOrganizationProfile();
    const [view, setView] = useState<"list" | "grid">("list");
    const [keyword, setKeyword] = useState<string>("");

    const queryOptions = useMemo<QueryOptions>(() => ({
        queryKey: "organizationUsers_" + organization?.id,
        queryParams: { 
            id: params?.id as string, 
            organizationId: organization?.id,
            keyword
        },
        countKey: "total",
        dataKey: "data",
    }), [organization?.id, params?.id, keyword]);

    const handleOnChange = (newKeyword: string) => {
        setKeyword(newKeyword);
    };

    const renderUser = (user: User) => {
        return <UserListItem user={user} view={view} />;
    };

    return (
        <JumboRqList
            wrapperComponent={Card}
            service={organizationServices.getUsers}
            primaryKey={"id"}
            queryOptions={queryOptions}
            itemsPerPage={10}
            itemsPerPageOptions={[5, 8, 15, 20]}
            renderItem={renderUser}
            componentElement={"div"}
            wrapperSx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
            }}
            toolbar={
                <JumboListToolbar
                    hideItemsPerPage={true}
                    actionTail={
                        <Grid container spacing={1}>
                            <Grid size={{xs: 12, md: 8, lg: 8}}>
                                <JumboSearch
                                    onChange={handleOnChange}
                                    value={keyword}
                                />
                            </Grid>
                            <Grid size={{xs: 12, md: 4, lg: 4}} textAlign={'end'}>
                                <ActionTail view={view} setView={setView} />
                            </Grid>
                        </Grid>
                    }
                />
            }
            view={view}
        />
    );
};