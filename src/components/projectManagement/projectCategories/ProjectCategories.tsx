'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import ProjectCategoryListItem from './ProjectCategoryListItem';
import ProjectCategoryActionTail from './ProjectCategoryActionTail';
import projectCategoryServices from './project-category-services';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const ProjectCategories = () => {
    const params = useParams();
    const listRef = useRef<any>(null);
    const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
    const [mounted, setMounted] = useState(false);
    const dictionary = useDictionary();

    const [queryOptions, setQueryOptions] = useState({
        queryKey: 'projectCategories',
        queryParams: { id: params.id, keyword: '' },
        countKey: 'total',
        dataKey: 'data',
    });

    React.useEffect(() => {
        setQueryOptions((state) => ({
            ...state,
            queryParams: { ...state.queryParams, id: params.id },
        }));
    }, [params]);

    const renderProjectCategory = useCallback((projectCategory: { id: number; name: string; description?: string; }) => (
        <ProjectCategoryListItem projectCategory={projectCategory} />
    ), []);

    const handleOnChange = useCallback((keyword: any) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            },
        }));
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!organizationHasSubscribed(MODULES.PROJECT_MANAGEMENT)) {
        return <UnsubscribedAccess modules={'Project Management'} />;
    }

    if (!checkOrganizationPermission([
        PERMISSIONS.PROJECT_CATEGORIES_CREATE,
        PERMISSIONS.PROJECT_CATEGORIES_READ,
        PERMISSIONS.PROJECT_CATEGORIES_EDIT,
    ])) {
        return <UnauthorizedAccess />;
    }

    return (
        <React.Fragment>
            <LedgerSelectProvider>
                <Typography variant={'h4'} mb={2}>Project Categories</Typography>
                <JumboRqList
                    ref={listRef}
                    wrapperComponent={Card}
                    service={projectCategoryServices.getList}
                    primaryKey={"id"}
                    queryOptions={queryOptions}
                    itemsPerPage={10}
                    itemsPerPageOptions={[5, 8, 10, 15, 20]}
                    renderItem={renderProjectCategory}
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
                                <Stack direction={'row'}>
                                    <JumboSearch
                                        onChange={handleOnChange}
                                        value={queryOptions.queryParams.keyword}
                                    />
                                    <ProjectCategoryActionTail />
                                </Stack>
                            }
                        />
                    }
                />
            </LedgerSelectProvider>
        </React.Fragment>
    );
};

export default ProjectCategories;
