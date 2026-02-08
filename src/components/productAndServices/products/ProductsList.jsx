
import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, Grid } from '@mui/material';
import React, { lazy } from 'react'
import { useProductApp } from './ProductsProvider';
import ProductListItem from './productsListItem/ProductListItem';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import productServices from './productServices';

const ProductActionTail = lazy(() => import('./ProductActionTail'));

const ProductList = () => {
    const params = useParams();
    const listRef = React.useRef();
    const {setSelectedProducts,setProductsListRefresh,refreshProductsList} = useProductApp();
    const {checkOrganizationPermission} = useJumboAuth();

    const [queryOptions, setQueryOptions] = React.useState({
        queryKey: "products",
        queryParams: {id: params.id, keyword : ''},
        countKey: "total",
        dataKey: "data",
    });

    React.useEffect(() => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {...state.queryParams, id: params.id}
        }))
    }, [params]);

    React.useEffect(() => {
        if (refreshProductsList) {
            listRef.current.refresh();
            setProductsListRefresh(false);
        }
    }, [setProductsListRefresh]);

    const handleOnChange = React.useCallback((keyword) => {
        setQueryOptions(state => ({
            ...state,
            queryParams: {
                ...state.queryParams,
                keyword: keyword,
            }
        }))
    }, []);

    const renderProduct = React.useCallback((product) => {
        return (<ProductListItem product={product}/>)
    });

    const canCreate = checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE]);

    return (
        <JumboRqList
            ref={listRef}
            dense={true}
            wrapperComponent={Card}
            service={productServices.getList}
            primaryKey={"id"}
            queryOptions={queryOptions}
            itemsPerPage={10}
            itemsPerPageOptions={[10, 15, 20,50,100]}
            renderItem={renderProduct}
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
                    <Grid container columnSpacing={1} direction={'row'}>
                        <Grid size={canCreate ? 9.5 : 12}>
                            <JumboSearch
                                onChange={handleOnChange}
                                value={queryOptions.queryParams.keyword}
                            /> 
                        </Grid>
                        {
                            canCreate &&
                            <Grid size={2.5}>
                                <ProductActionTail/>
                            </Grid>
                        }
                    </Grid>
                }
                >
                </JumboListToolbar>
            }
            onSelectionChange={setSelectedProducts}
        />
    );
}

export default ProductList