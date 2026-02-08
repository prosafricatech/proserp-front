'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { ListOutlined, ViewComfy } from '@mui/icons-material';
import { Button, ButtonGroup, Card, Stack, Tooltip, Alert, Link as MuiLink } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import InvitationListItem from './InvitationListItem';
import { useParams } from 'next/navigation';
import invitationsServices from './invitationsServices';
import { Organization } from '@/types/auth-types';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import Link from 'next/link';

interface QueryOptions {
    queryKey: string;
    queryParams: {
        id: string;
        keyword: string;
    };
    countKey: string;
    dataKey: string;
}

function OrganizationInvitations() {
    const params = useParams<{ id: string }>();
    const listRef = useRef<any>(null);
    const [view, setView] = useState<'list' | 'grid'>('list');
    const [mounted, setMounted] = useState(false);
    const lang = useLanguage();

    const [queryOptions, setQueryOptions] = useState<QueryOptions>({
        queryKey: 'invitations',
        queryParams: { id: params?.id || '', keyword: "" },
        countKey: 'invitations.total',
        dataKey: 'invitations.data',  
    });

    const renderInvitations = useCallback(
        (organization: Organization) => {
            return <InvitationListItem organization={organization} view={view} />;
        },
        [view]
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (params?.id) {
            setQueryOptions((state) => ({
                ...state,
                queryParams: { ...state.queryParams, id: params.id },
            }));
        }
    }, [params]);

    const handleOnChange = useCallback((keyword: string) => {
        setQueryOptions((state) => ({
            ...state,
            queryParams: { ...state.queryParams, keyword },
        }));
    }, []);

    if (!mounted) return null; // Prevent mismatch during hydration

    return (
        <JumboRqList
            ref={listRef}
            wrapperComponent={Card}
            service={invitationsServices.getList}
            primaryKey={'id'}
            queryOptions={queryOptions}
            itemsPerPage={10}
            itemsPerPageOptions={[5, 8, 15, 20, 30, 50]}
            renderItem={renderInvitations}
            componentElement={'div'}
            wrapperSx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                p: 1,
            }}
            noDataPlaceholder={
                <Alert
                    variant="outlined"
                    severity="info"
                >
                    <span>No invitations available yet. Please wait for invitations to appear!</span>
                    <span>
                        {""} You can manage organizations{' '}
                        <MuiLink
                            component={Link}
                            href={`/${lang}/organizations`}
                            underline="hover"
                        >
                            here
                        </MuiLink>
                        .
                    </span>
                </Alert>
            }
            toolbar={
                <JumboListToolbar
                    hideItemsPerPage={false}
                    actionTail={
                        <Stack direction={'row'} spacing={1}>
                            <JumboSearch
                                onChange={handleOnChange}
                                value={queryOptions.queryParams.keyword}
                            />
                            <ButtonGroup
                                variant="outlined"
                                size="small"
                                disableElevation
                                sx={{ '& .MuiButton-root': { px: 1 } }}
                            >
                                <Tooltip title={'List View'}>
                                    <Button
                                        variant={view === 'list' ? 'contained' : 'outlined'}
                                        onClick={() => setView('list')}
                                    >
                                        <ListOutlined />
                                    </Button>
                                </Tooltip>
                                <Tooltip title={'Grid View'}>
                                    <Button
                                        variant={view === 'grid' ? 'contained' : 'outlined'}
                                        onClick={() => setView('grid')}
                                    >
                                        <ViewComfy />
                                    </Button>
                                </Tooltip>
                            </ButtonGroup>
                        </Stack>
                    }
                />
            }
            view={view}
        />
    );
}

export default OrganizationInvitations;
