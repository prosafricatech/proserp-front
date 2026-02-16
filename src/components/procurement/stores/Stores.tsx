'use client'

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Stack, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react'
import storeServices from './store-services';
import StoreActionTail from './StoreActionTail';
import StoreListItem from './StoreListItem';
import { useParams } from 'next/navigation';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { Store } from './storeTypes';

interface QueryOptions {
  queryKey: string;
  queryParams: {
    id?: string | string[];
    keyword: string;
  };
  countKey: string;
  dataKey: string;
}

const Stores: React.FC = () => {
    const params = useParams<{ id?: string; category?: string }>();
    const listRef = useRef<any>(null);
    const [mounted, setMounted] = useState(false);
    const dictionary = useDictionary();

    const [queryOptions, setQueryOptions] = useState<QueryOptions>({
        queryKey: "stores",
        queryParams: { id: params.id as string, keyword: '' },
        countKey: "total",
        dataKey: "data",
    });

    React.useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {...state.queryParams, id: params.id as string}
        }));
    }, [params]);

    const renderStore = React.useCallback((store: Store) => {
        return <StoreListItem store={store} />;
    }, []);

    const handleOnChange = React.useCallback((keyword: string) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            }
        }));
    }, []);

    const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();

    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) return null;

    if (!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
        return <UnsubscribedAccess modules={'Procurement & Supply'}/>;
    }

    if (!checkOrganizationPermission([PERMISSIONS.STORES_READ, PERMISSIONS.INVENTORY_TRANSFERS_READ, PERMISSIONS.INVENTORY_TRANSFERS_CREATE,])) {
        return <UnauthorizedAccess/>;
    }
    
    return (
        <React.Fragment>
            <Typography variant={'h4'} mb={2}>{dictionary.stores.form.labels.listHeader}</Typography>
            <JumboRqList
                ref={listRef}
                wrapperComponent={Card}
                service={storeServices.getList}
                primaryKey={"id"}
                queryOptions={queryOptions}
                itemsPerPage={8}
                itemsPerPageOptions={[8, 10, 15, 20]}
                renderItem={renderStore}
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
                            <Stack direction={'row'}>
                                <JumboSearch
                                    onChange={handleOnChange}
                                    value={queryOptions.queryParams.keyword}
                                />
                                <StoreActionTail /> 
                            </Stack>
                        }
                    />
                }
            />
        </React.Fragment>
    );
}

export default Stores;