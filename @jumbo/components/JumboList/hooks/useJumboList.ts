import React from 'react';
import JumboListContext from "@jumbo/components/JumboList/JumboListContext";

export interface JumboListContextType {
    data: any[];
    selectedItems: any[];
    setBulkActions?: (actions: React.ReactNode[]) => void;
    bulkActions?: React.ReactNode[];
    activePage: number;
    itemsPerPage: number;
    totalCount: number;
    isLoading: boolean;
    setActivePage: (page: number) => void;
    setItemsPerPage: (count: number) => void;
    itemsPerPageOptions: number[];
}


const useJumboList = () => {
    return React.useContext(JumboListContext);
};

export default useJumboList;