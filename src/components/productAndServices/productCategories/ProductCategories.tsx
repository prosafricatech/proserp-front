'use client';

import JumboListToolbar from '@jumbo/components/JumboList/components/JumboListToolbar';
import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import JumboSearch from '@jumbo/components/JumboSearch';
import { Card, LinearProgress, Stack, Typography } from '@mui/material';
import React, { createContext, useEffect, useRef, useState } from 'react';
import ProductCategoryActionTail from './ProductCategoryActionTail';
import ProductCategoryListItem from './ProductCategoryListItem';
import LedgerSelectProvider from '../../accounts/ledgers/forms/LedgerSelectProvider';
import { useParams } from 'next/navigation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import productCategoryServices from './productCategoryServices';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useQuery } from '@tanstack/react-query';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { ProductCategory } from './ProductCategoryType';

interface QueryOptions {
  queryKey: string;
  queryParams: {
    id?: string;
    keyword: string;
  };
  countKey: string;
  dataKey: string;
}

interface ProductCategoriesContextType {
  productCategories?: ProductCategory[]; // or whatever type your categories are
}

export const ProductCategoriesAppContext = createContext<ProductCategoriesContextType>({});

const ProductCategories = () => {
  const params = useParams<{ id?: string; category?: string }>();
  const listRef = useRef<any>(null);
  const { organizationHasSubscribed, checkOrganizationPermission } = useJumboAuth();
  const [mounted, setMounted] = useState(false);
  const dictionary = useDictionary();

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    queryKey: "productCategories",
    queryParams: { id: params.id as string, keyword: '' },
    countKey: "total",
    dataKey: "data",
  });

  const { data: productCategories, isLoading } = useQuery({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });

  React.useEffect(() => {
    setQueryOptions(state => ({
      ...state,
      queryParams: { ...state.queryParams, id: params.id as string }
    }));
  }, [params]);

  const renderProductCategory = React.useCallback((productCategory: ProductCategory) => {
    return <ProductCategoryListItem productCategory={productCategory} />;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)) {
    return <UnsubscribedAccess modules={'Procurement & Supply'} />;
  }

  if (!checkOrganizationPermission([
    PERMISSIONS.PRODUCT_CATEGORIES_CREATE,
    PERMISSIONS.PRODUCT_CATEGORIES_READ,
    PERMISSIONS.PRODUCT_CATEGORIES_EDIT
  ])) {
    return <UnauthorizedAccess />;
  }

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <ProductCategoriesAppContext.Provider value={{ productCategories }}>
      <LedgerSelectProvider>
        <Typography variant={'h4'} mb={2}>
          {dictionary.productCategories.list.labels.listHeader}
        </Typography>
        <JumboRqList
          ref={listRef}
          wrapperComponent={Card}
          service={productCategoryServices.getList}
          primaryKey={"id"}
          queryOptions={queryOptions}
          itemsPerPage={10}
          itemsPerPageOptions={[5, 8, 10, 15, 20]}
          renderItem={renderProductCategory}
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
                  <ProductCategoryActionTail />
                </Stack>
              }
            />
          }
        />
      </LedgerSelectProvider>
    </ProductCategoriesAppContext.Provider>
  );
};

export default ProductCategories;