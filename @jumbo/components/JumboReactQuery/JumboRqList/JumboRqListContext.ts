import React from "react";

interface QueryOptions {
    queryKey: string | any[];
    queryParams?: Record<string, any>;
    countKey?: string;
    dataKey: string;
}

interface Pagination {
    page: number;
    limit: number;
}

interface JumboRqListContextType {
    queryOptions: QueryOptions;
    pagination: Pagination;
    data: any[];
    selectedItems: any[];
    selectedOnPage: any[];
    multiSelection: boolean;
    hasBulkActions: boolean;
    setSelectedItems?: (items: any[]) => void;
    setQueryOptions?: (options: QueryOptions) => void;
    setPagination?: (pagination: Pagination) => void;
}

const JumboRqListContext = React.createContext<JumboRqListContextType>({
    queryOptions: {
        queryKey: '',
        dataKey: ''
    },
    pagination: { page: 0, limit: -1 },
    data: [],
    selectedItems: [],
    selectedOnPage: [],
    multiSelection: false,
    hasBulkActions: false,
});

export default JumboRqListContext;