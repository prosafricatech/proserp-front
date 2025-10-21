"use client"

import React from 'react'
import ProductsList from './ProductsList';
import ProductsProvider from './ProductsProvider';
import { Typography } from '@mui/material';
import ProductsSelectProvider from './ProductsSelectProvider';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { MODULES } from '@/utilities/constants/modules';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const Products = () => {
    const [mounted, setMounted] = React.useState(false);
    const {organizationHasSubscribed,checkOrganizationPermission} = useJumboAuth();
    const dictionary = useDictionary();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if(!organizationHasSubscribed(MODULES.PROCUREMENT_AND_SUPPLY)){
      return <UnsubscribedAccess modules={'Procurement & Supply'}/>
    }

    if(!checkOrganizationPermission([PERMISSIONS.PRODUCTS_CREATE,PERMISSIONS.PRODUCTS_READ,PERMISSIONS.PRODUCTS_EDIT])){
        return <UnauthorizedAccess/>
    }
    return (
        <ProductsProvider>
            <ProductsSelectProvider>
                <Typography variant={'h4'} mb={2}>{dictionary.products.form.labels.listHeader}</Typography>
                <ProductsList/>
            </ProductsSelectProvider>
        </ProductsProvider>
    );
}

export default Products