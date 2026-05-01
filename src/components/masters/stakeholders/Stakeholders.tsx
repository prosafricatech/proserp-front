'use client'

import React, { useEffect, useRef, useState } from 'react'
import stakeholderServices from './stakeholder-services';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import { Card, Grid, Stack, Typography } from '@mui/material';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import StakeholderListItem from './StakeholderListItem';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import StakeholderActionTail from './StakeholderActionTail';
import StakeholdersTypeSelector from './StakeholdersTypeSelector';
import { Stakeholder } from './StakeholderType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useParams } from 'next/navigation';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function Stakeholders() {
    const params = useParams<{ category?: string; id?: string; keyword?: string }>();
    const listRef = useRef<any>(null);
    const [mounted, setMounted] = useState(false);
    const {checkOrganizationPermission} = useJumboAuth();
    const dictionary = useDictionary();

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: "stakeholders",
        queryParams: {
            id: params.id,
            type:'all', 
            keyword : ''
        },
        countKey: "total",
        dataKey: "data",
    });

    React.useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {...state.queryParams, id: params.id}
        }))
    }, [params]);

    const renderStakeholder = React.useCallback((stakeholder: Stakeholder) => {
        return (<StakeholderListItem stakeholder={stakeholder} />)
    },[]);

    const handleOnTypeChange = React.useCallback((type: string) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                type: type
            }
        }));
    }, [queryOptions.queryParams.type]);

    const handleOnChange = React.useCallback((keyword: string) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            }
        }))
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // ⛔ Prevent mismatch during hydration

    if(!checkOrganizationPermission([PERMISSIONS.STAKEHOLDERS_READ, PERMISSIONS.STAKEHOLDERS_CREATE])){
        return <UnauthorizedAccess/>;
    }

return (
    <React.Fragment>
        <Typography variant={'h4'} mb={2}>{dictionary.stakeholders.form.labels.listHeader}</Typography>
        <JumboRqList
            ref={listRef}
            wrapperComponent={Card}
            service={stakeholderServices.getList}
            primaryKey={"id"}
            queryOptions={queryOptions}
            itemsPerPage={10}
            itemsPerPageOptions={[5,8,10, 15, 20]}
            renderItem={renderStakeholder}
            componentElement={"div"}
            wrapperSx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
            }}
            toolbar={
                <JumboListToolbar
                    hideItemsPerPage={true}
                    actionTail={
                        <Grid container columnSpacing={1} rowSpacing={1}>
                            <Grid size={{xs: 12, lg: 4}} alignItems={'center'}>
                                <StakeholdersTypeSelector
                                    value={queryOptions.queryParams.type}
                                    onChange={handleOnTypeChange}
                                />
                            </Grid>
                            <Grid size={{xs: 12, lg: 8}}>
                                <Stack direction={'row'}>
                                    <JumboSearch
                                        onChange={handleOnChange}
                                        value={queryOptions.queryParams.keyword}
                                    />
                                    <StakeholderActionTail /> 
                                </Stack>
                            </Grid>
                        </Grid>
                    }
                >
                </JumboListToolbar>
            }
        />
    </React.Fragment>
);
}

export default Stakeholders