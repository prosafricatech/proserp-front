import { Divider, Grid, Tooltip, Typography } from '@mui/material'
import React from 'react'
import ProductCategoryItemAction from './ProductCategoryItemAction'
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext'
import { ProductCategory } from './ProductCategoryType';

interface ProductCategoryListItemProps {
  productCategory: ProductCategory;
}

const ProductCategoryListItem: React.FC<ProductCategoryListItemProps> = ({ productCategory }) => {
  const dictionary = useDictionary();
  
  return (
    <React.Fragment>
      <Divider/>      
      <Grid
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}  
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{xs: 6, md: 4}}>
          <Tooltip title={dictionary.productCategories.list.labels.categoryName}>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {productCategory.name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 4}}>
          <Tooltip title={dictionary.productCategories.form.labels.parentCategory}>
            <Typography>{productCategory.parent?.name}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 3}}>
          <Tooltip title={dictionary.productCategories.form.labels.description}>
            <Typography>{productCategory.description}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{xs: 6, md: 1}} textAlign={"end"}>
          <ProductCategoryItemAction productCategory={productCategory} />
        </Grid> 
      </Grid>
    </React.Fragment>
  );
};

export default ProductCategoryListItem;