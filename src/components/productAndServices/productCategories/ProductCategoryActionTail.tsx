'use client'
import { AddOutlined } from '@mui/icons-material'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import React, { useContext, useState } from 'react'
import ProductCategoryFormDialogContent from './ProductCategoryFormDialogContent';
import { ProductCategoriesAppContext } from './ProductCategories';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

interface ProductCategoryActionTailProps {
  // Add any props if needed
}

const ProductCategoryActionTail: React.FC<ProductCategoryActionTailProps> = () => {
  const { productCategories } = useContext(ProductCategoriesAppContext);
  const [newProductCategoryFormOpen, setNewProductCategoryFormOpen] = useState(false);
  const dictionary = useDictionary();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
    
  return (
    <React.Fragment>
      <Tooltip title={dictionary.productCategories.list.labels.newCreateLabel}>
        <IconButton size='small' onClick={() => setNewProductCategoryFormOpen(true)}>
          <AddOutlined/>
        </IconButton>
      </Tooltip>
      <Dialog
        open={newProductCategoryFormOpen}
        scroll={'paper'}
        fullWidth
        fullScreen={belowLargeScreen} 
        maxWidth='md' // Added maxWidth to match the stakeholder example
      >
        <ProductCategoryFormDialogContent
          onClose={() => setNewProductCategoryFormOpen(false)}
          productCategories={productCategories || []} // Simplified and type-safe
        />
      </Dialog>
    </React.Fragment>
  )
}

export default ProductCategoryActionTail;