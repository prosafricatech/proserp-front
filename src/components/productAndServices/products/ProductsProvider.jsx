import React from 'react';
import { createContext, useContext } from "react";
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import storeServices from '../../procurement/stores/store-services';
import measurementUnitServices from '../../masters/measurementUnits/measurement-unit-services';
import { LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import productCategoryServices from '../productCategories/productCategoryServices';
import productServices from './productServices';

export const ProductsAppContext = createContext({});

export const useProductApp = () => {
    return useContext(ProductsAppContext);
}

const PRODUCT_ACTIONS = {
    SET_SELECTED_ITEMS: "set-selected-items",
    SET_PRODUCT_LIST_REFRESH: "set-products-list-refresh",
};

const init = (appState) => appState;

const ProductReducer = (state, action) => {
    switch (action.type) {
        case PRODUCT_ACTIONS.SET_SELECTED_ITEMS:
            return {
                ...state,
                selectedProducts: action?.payload
            };
        case PRODUCT_ACTIONS.SET_PRODUCT_LIST_REFRESH:
            return {
                ...state,
                refreshProductsList: action.payload,
            };
        default:
            return state;
    }

};

export default function ProductsProvider({children}){
    const [productsApp, setProductsApp] = React.useReducer(ProductReducer, {
        selectedProducts: [],
        refreshProductsList: false
    }, init);

    const setSelectedProducts = React.useCallback((products) => {
        setProductsApp({type: PRODUCT_ACTIONS.SET_SELECTED_ITEMS, payload: products});
    }, [setProductsApp]);

    const setProductsListRefresh = React.useCallback((refresh) => {
        setProductsApp({type: PRODUCT_ACTIONS.SET_PRODUCT_LIST_REFRESH, payload: refresh})
    }, [setProductsApp]);

    const { data: productCategories, isLoading: isLoadingProductCategories } = useQuery({
        queryKey: ['productCategoryOptions'],
        queryFn: productCategoryServices.getCategoryOptions
    });

    const { data: measurementUnits, isLoading: isLoadingMeasurementUnits } = useQuery({
        queryKey: ['allMeasurementUnits'],
        queryFn: measurementUnitServices.getAllMeasurementUnits
    });

    const { data: productParams, isLoading: isLoadingProductParams } = useQuery({
        queryKey: ['productParams'],
        queryFn: productServices.getProductParams
    });

    const { data: storeOptions, isLoading: isLoadingStores } = useQuery({
        queryKey: ['storeOptions', { mainOnly: true }],
        queryFn: () => storeServices.getStoreOptions({ mainOnly: true }) // ensure correct params
    });

    if(isLoadingMeasurementUnits || isLoadingProductParams || isLoadingProductCategories || isLoadingStores){
        return <LinearProgress/>
    }
    
    const contextValue = {
        ...productsApp,
        setSelectedProducts: setSelectedProducts,
        setProductsListRefresh: setProductsListRefresh,
        productCategories,
        brands : productParams.brands,
        item_names: productParams.item_names,
        models: productParams.models,
        measurementUnits,
        specifications: productParams.specifications,
        storeOptions
    }

    return (
        <ProductsAppContext.Provider value={contextValue}>
            <LedgerSelectProvider>{children}</LedgerSelectProvider>
        </ProductsAppContext.Provider>
    )
    
}