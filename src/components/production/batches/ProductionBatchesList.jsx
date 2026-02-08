'use client'

import React, { createContext } from 'react';
import { Alert, Box, Stack } from '@mui/material';
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch/JumboSearch';
import productionBatchesServices from './productionBatchesServices';
import ProductionBatchesActionTail from './ProductionBatchesActionTail';
import ProductionBatchesListItem from './ProductionBatchesListItem';
import { useParams } from 'next/navigation';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import CurrencySelectProvider from '@/components/masters/Currencies/CurrencySelectProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';

export const ProductionBatchesContext = createContext({});

const ProductionBatchesList = ({activeWorkCenter}) => {
    const params = useParams();
    const listRef = React.useRef();

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: 'productionBatches',
        queryParams: { id: params.id, keyword: '', work_center_id: activeWorkCenter && activeWorkCenter?.id},
        countKey: 'total',
        dataKey: 'data',
    });

    React.useEffect(() => {
        setQueryOptions((state) => ({
            ...state,
            queryKey: 'productionBatches',
            queryParams: { ...state.queryParams, work_center_id: activeWorkCenter?.id && activeWorkCenter.id },
        }));
    }, [activeWorkCenter]);

    const salesShifts  = React.useCallback((batch) => {
        return <ProductionBatchesListItem batch={batch}/>;
    }, []);

    const handleOnChange = React.useCallback(
        (keyword) => {
            setQueryOptions((state) => ({
                ...state,
                queryParams: {
                    ...state.queryParams,
                    keyword: keyword,
                },
            }));
        },
        []
    );

    return (
        <CurrencySelectProvider>
            <LedgerSelectProvider>
                <ProductsSelectProvider>
                    <ProductionBatchesContext.Provider value={{activeWorkCenter}}>
                        {
                            activeWorkCenter ? 
                                <JumboRqList
                                    ref={listRef}
                                    wrapperComponent={Box}
                                    service={productionBatchesServices.getProductionBatches}
                                    primaryKey="id"
                                    queryOptions={queryOptions}
                                    itemsPerPage={10}
                                    itemsPerPageOptions={[5, 8, 10, 15, 20]}
                                    renderItem={salesShifts}
                                    componentElement="div"
                                    bulkActions={null}
                                    wrapperSx={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                    toolbar={
                                        <JumboListToolbar hideItemsPerPage={true} actionTail={
                                        <Stack direction="row">
                                            <JumboSearch
                                                onChange={handleOnChange}
                                                value={queryOptions.queryParams.keyword}
                                            />
                                            <ProductionBatchesActionTail/>
                                        </Stack>
                                    }/>
                                    }
                                />
                                :
                            <Alert variant='outlined' severity='info'>Please select a Work Center</Alert>
                        } 
                    </ProductionBatchesContext.Provider>
                </ProductsSelectProvider>
            </LedgerSelectProvider>
        </CurrencySelectProvider>

    );
};

export default ProductionBatchesList;