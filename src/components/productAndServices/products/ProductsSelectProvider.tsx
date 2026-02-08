import { LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, ReactNode } from 'react';
import productServices from './productServices';
import { Product } from '@/components/productAndServices/products/ProductType';

// Define the context shape
interface ProductSelectContextType {
  productOptions: Product[];
}

// Create context with typed interface
const ProductSelectContext = createContext<ProductSelectContextType>({
  productOptions: [],
});

// Hook to use the context
export const useProductsSelect = () => useContext(ProductSelectContext);

interface ProductsSelectProviderProps {
  children: ReactNode;
}

function ProductsSelectProvider({ children }: ProductsSelectProviderProps) {
  const { data: productOptions = [], isLoading } = useQuery<Product[]>({
    queryKey: ['product_select_options'],
    queryFn: productServices.getProductSelectOptions,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <ProductSelectContext.Provider value={{ productOptions }}>
      {children}
    </ProductSelectContext.Provider>
  );
}

export default ProductsSelectProvider;