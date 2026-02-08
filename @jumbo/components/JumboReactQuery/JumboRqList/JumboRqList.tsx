import React from 'react';
import JumboList from "@jumbo/components/JumboList";
import { SxProps, Theme } from "@mui/material/styles";
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { getArrayElementFromKey } from '@jumbo/utilities/systemHelpers';
import { JumboListProps } from '@jumbo/types/JumboListProps';

interface QueryOptions<TQueryKey extends QueryKey> {
    queryKey: string;
    queryParams?: Record<string, any>;
    countKey?: string;
    dataKey: string;
}

interface MultiSelectOption {
    label: React.ReactNode;
    selectionLogic: (items: any[]) => any[];
}

interface JumboRqListProps<TData = any> {
    queryOptions: QueryOptions<QueryKey>;
    itemsPerPage?: number;
    service: (params: any) => Promise<TData>;
    primaryKey: string;
    refetchOnWindowFocus?: boolean;
    itemsPerPageOptions?: number[];
    toolbar?: React.ReactNode;
    multiSelectOptions?: MultiSelectOption[];
    onSelectionChange?: (selectedItems: any[]) => void;
    renderItem: (item: any, view?: 'list' | 'grid') => React.ReactNode;
    noDataPlaceholder?: React.ReactNode;
    wrapperComponent?: React.ElementType;
    wrapperSx?: SxProps<Theme>;
    component?: JumboListProps['component'];
    sx?: SxProps<Theme>;
    componentElement?: string | React.ElementType;
    itemSx?: SxProps<Theme>;
    transition?: boolean;
    view?: 'list' | 'grid';
    onRefresh?: () => void;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    disableTransition?: boolean;
}

interface QueryData {
    data: any[];
    totalCount: number;
}

const JumboRqList = React.forwardRef<{ refresh: () => Promise<void> }, JumboRqListProps>(
    (props, ref) => {
        const {
            queryOptions,
            itemsPerPage = 10,
            service,
            primaryKey,
            itemsPerPageOptions,
            toolbar,
            refetchOnWindowFocus,
            multiSelectOptions,
            onSelectionChange,
            renderItem,
            noDataPlaceholder,
            wrapperComponent,
            wrapperSx,
            component,
            sx,
            componentElement,
            itemSx,
            view,
            onRefresh = () => {},
        } = props;

        const listRef = React.useRef<any>(null);
        const queryClient = useQueryClient();

        const [page, setPage] = React.useState(1);
        const [limit, setLimit] = React.useState(itemsPerPage);

        const queryKey = React.useMemo(() => [
            queryOptions.queryKey,
            { ...queryOptions.queryParams, page, limit }
          ], [queryOptions.queryKey, queryOptions.queryParams, page, limit]);

        const queryFn = React.useCallback(() => {
            return service({
                ...queryOptions.queryParams,
                page,
                limit
            });
        }, [service, queryOptions.queryParams, page, limit]);

        const listQuery = useQuery({
            queryKey,
            queryFn,
            refetchOnWindowFocus,
        });

        React.useImperativeHandle(ref, () => ({
            async refresh() {
                listRef.current?.resetSelection?.();
                await queryClient.invalidateQueries({ queryKey });
                await listQuery.refetch();
                onRefresh();
            },
        }));

        const handlePageChange = React.useCallback((pageNumber: number) => {
            setPage(pageNumber + 1);
        }, []);

        const handleItemsPerPageChange = React.useCallback((newValue: number) => {
            setLimit(newValue);
            setPage(1);
        }, []);

        const queryData: QueryData = React.useMemo(() => {
            const dataArray = getArrayElementFromKey(listQuery?.data, queryOptions?.dataKey);
            return {
                data: Array.isArray(dataArray) ? dataArray : [],
                totalCount: getArrayElementFromKey(listQuery?.data, queryOptions.countKey) || 0,
            };
        }, [listQuery.data, queryOptions.dataKey, queryOptions.countKey]);

        return (
            <JumboList
                ref={listRef}
                data={queryData.data}
                primaryKey={primaryKey}
                renderItem={renderItem}
                itemsPerPage={limit}
                totalCount={queryData.totalCount}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={itemsPerPageOptions}
                toolbar={toolbar}
                onSelectionChange={onSelectionChange}
                multiSelectOptions={multiSelectOptions}
                noDataPlaceholder={noDataPlaceholder}
                isLoading={listQuery.isLoading}
                wrapperComponent={wrapperComponent}
                wrapperSx={wrapperSx}
                componentElement={componentElement}
                itemSx={itemSx}
                component={component}
                sx={sx}
                view={view}
            />
        );
    }
);

export default JumboRqList;
