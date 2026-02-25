import React from 'react';
import TransitionGroup from "react-transition-group/TransitionGroup";
import Collapse from "@mui/material/Collapse";
import List, { ListProps } from "@mui/material/List";
import Grid, { GridProps } from "@mui/material/Grid";
import { Skeleton, SxProps, Theme } from "@mui/material";
import { Div } from '@jumbo/shared';
import JumboListContext from "./JumboListContext";
import JumboListWrapper from "./components/JumboListWrapper";
import JumboListNoDataPlaceholder from "./components/JumboListNoDataPlaceHolder";
import {
    CHANGE_ACTIVE_PAGE,
    SET_BULK_ACTIONS,
    SET_DATA,
    SET_ITEMS_PER_PAGE,
    SET_SELECTED_ITEMS
} from "./utils/constants";
import { getUpdatedSelectedItems } from "./utils/listHelpers";
import JumboListPagination from './components/JumboListPagination';
import { Stack } from '@mui/system';

interface MultiSelectOption {
    label: React.ReactNode;
    selectionLogic: (items: any[]) => any[];
}

interface JumboListProps {
    header?: React.ReactNode;
    toolbar?: React.ReactNode;
    footer?: React.ReactNode;
    data: any[];
    primaryKey: string;
    renderItem: (item: any, view?: 'list' | 'grid') => React.ReactNode;
    totalCount?: number;
    itemsPerPage?: number;
    itemsPerPageOptions?: number[];
    onPageChange?: (page: number) => void;
    onSelectionChange?: (selectedItems: any[]) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    multiSelectOptions?: MultiSelectOption[];
    noDataPlaceholder?: React.ReactNode;
    wrapperComponent?: React.ElementType;
    wrapperSx?: SxProps<Theme>;
    component?: React.ElementType<ListProps>;
    componentElement?: string | React.ElementType;
    sx?: SxProps<Theme> | GridProps['sx'];
    itemSx?: SxProps<Theme>;
    isLoading?: boolean;
    disableTransition?: boolean;
    view?: 'list' | 'grid';
    page?: number;
}

interface JumboListState {
    primaryKey: string;
    data: any[];
    selectedItems: any[];
    bulkActions: any[] | null;
    activePage: number;
    totalCount?: number;
    itemsPerPage?: number;
    itemsPerPageOptions?: number[];
    isLoading?: boolean;
    multiSelectOptions?: MultiSelectOption[];
}

type JumboListAction =
    | { type: typeof SET_SELECTED_ITEMS; payload: any }
    | { type: typeof SET_DATA; payload: { data: any[]; totalCount?: number } }
    | { type: typeof CHANGE_ACTIVE_PAGE; payload: number }
    | { type: typeof SET_ITEMS_PER_PAGE; payload: number }
    | { type: typeof SET_BULK_ACTIONS; payload: any[] | null };

const init = (initArgs: Omit<JumboListState, 'selectedItems' | 'bulkActions'> & { page?: number }): JumboListState => ({
    selectedItems: [],
    bulkActions: null,
    ...initArgs,
    activePage: initArgs.page ?? 0,
});

const jumboListReducer = (state: JumboListState, action: JumboListAction): JumboListState => {
    switch (action.type) {
        case SET_SELECTED_ITEMS:
            return {
                ...state,
                selectedItems: getUpdatedSelectedItems(
                    state.selectedItems,
                    action.payload,
                    state.primaryKey
                )
            };

        case SET_DATA:
            return {
                ...state,
                data: action.payload.data,
                totalCount: action.payload.totalCount,
            };

        case CHANGE_ACTIVE_PAGE:
            return {
                ...state,
                activePage: action.payload,
            };

        case SET_ITEMS_PER_PAGE:
            return {
                ...state,
                itemsPerPage: action.payload,
                activePage: 0,
            };

        case SET_BULK_ACTIONS:
            return {
                ...state,
                bulkActions: action.payload,
            };

        default:
            return state;
    }
};

const JumboList = React.forwardRef<{ resetSelection: () => void }, JumboListProps>((props, ref) => {

    const {
        header,
        toolbar,
        footer,
        data,
        primaryKey,
        renderItem,
        totalCount,
        itemsPerPage,
        onPageChange = () => { },
        itemsPerPageOptions,
        onSelectionChange = () => { },
        multiSelectOptions,
        noDataPlaceholder,
        wrapperComponent,
        wrapperSx,
        component,
        componentElement,
        sx,
        onItemsPerPageChange = () => { },
        isLoading,
        page = 0,
        disableTransition,
        view = 'list'
    } = props;

    const [jumboList, setJumboList] = React.useReducer(jumboListReducer, {
        primaryKey,
        data,
        totalCount,
        itemsPerPage,
        itemsPerPageOptions,
        activePage: page,
        isLoading,
        multiSelectOptions,
    }, init);

    const setActivePage = React.useCallback((pageNumber: number) => {
        setJumboList({ type: CHANGE_ACTIVE_PAGE, payload: pageNumber });
    }, []);

    if (data.length === 0 && totalCount && totalCount > 0 && jumboList.activePage > 0) {
        setActivePage(jumboList.activePage - 1);
    }

    const setItemsPerPage = React.useCallback((value: number) => {
        setJumboList({ type: SET_ITEMS_PER_PAGE, payload: value });
    }, []);

    const setSelectedItems = React.useCallback((itemsData: any) => {
        setJumboList({ type: SET_SELECTED_ITEMS, payload: itemsData });
    }, []);

    const setBulkActions = React.useCallback((bulkActions: any[] | null) => {
        setJumboList({ type: SET_BULK_ACTIONS, payload: bulkActions ?? [] });
    }, []);

    React.useEffect(() => {
        setJumboList({ type: SET_DATA, payload: { data, totalCount } });
    }, [data, totalCount]);

    const jumboListContextValue = React.useMemo(() => ({
        ...jumboList,
        setActivePage,
        setSelectedItems,
        setBulkActions,
        setItemsPerPage
    }), [jumboList, setActivePage, setBulkActions, setItemsPerPage, setSelectedItems]);

    React.useEffect(() => {
        onSelectionChange(jumboList.selectedItems);
    }, [jumboList.selectedItems, onSelectionChange]);

    React.useEffect(() => {
        onPageChange(jumboList.activePage);
    }, [jumboList.activePage, onPageChange]);

    React.useEffect(() => {
        onItemsPerPageChange(jumboList.itemsPerPage || 0);
    }, [jumboList.itemsPerPage, onItemsPerPageChange]);

    React.useImperativeHandle(ref, () => ({
        resetSelection() {
            setSelectedItems([]);
        },
    }), [setSelectedItems]);

    if (isLoading) {
        return (
            <JumboListContext.Provider value={jumboListContextValue}>
                <JumboListWrapper component={wrapperComponent} sx={wrapperSx}>
                    <Div sx={{ width: '100%', p: 2 }}>
                        <Stack spacing={2} sx={{ width: '100%' }}>
                            <Skeleton variant="text" width="50%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
                        </Stack>
                    </Div>
                </JumboListWrapper>
            </JumboListContext.Provider>
        );
    }

    const componentProps = componentElement ? { 
        component: componentElement as React.ElementType<any> 
    } : {};
    
    const ListComponent = component || List;

    return (
        <JumboListContext.Provider value={jumboListContextValue}>
            <JumboListWrapper component={wrapperComponent} sx={wrapperSx}>
                {header}
                {toolbar}
                {data?.length <= 0 && !isLoading && (
                    <JumboListNoDataPlaceholder>
                        {noDataPlaceholder}
                    </JumboListNoDataPlaceholder>
                )}
                {data.length > 0 && view === "list" && (
                    <ListComponent 
                        {...componentProps} 
                        disablePadding 
                        sx={sx as SxProps<Theme>}
                    >
                        {disableTransition ? (
                            data.map(row => (
                                <React.Fragment key={row[primaryKey]}>
                                    {renderItem(row, view)}
                                </React.Fragment>
                            ))
                        ) : (
                            <TransitionGroup>
                                {data.map((row) => (
                                    <Collapse key={`${row[primaryKey]}`}>
                                        {renderItem(row)}
                                    </Collapse>
                                ))}
                            </TransitionGroup>
                        )}
                    </ListComponent>
                )}
                {data.length > 0 && view === "grid" && (
                    <Grid container spacing={3} sx={sx as SxProps<Theme>}>
                        {data.map(row => (
                            <React.Fragment key={row[primaryKey]}>
                                {renderItem(row)}
                            </React.Fragment>
                        ))}
                    </Grid>
                )}
                <JumboListPagination />
                {footer}
            </JumboListWrapper>
        </JumboListContext.Provider>
    );
});

export default React.memo(JumboList);