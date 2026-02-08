import {
  Box,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import productCategoryServices from '../productCategories/productCategoryServices';

function ProductsCategorySelector({ onChange, value }) {
  const [category, setCategory] = React.useState(value);

  const { data: productCategories, isLoading } = useQuery({
    queryKey: ['productCategoryOptions'],
    queryFn: productCategoryServices.getCategoryOptions,
  });

  const handleChange = (event) => {
    const selectedValue = event.target.value;
    setCategory(selectedValue);
    onChange(selectedValue);
  };

  React.useEffect(() => {
    onChange(category);
  }, [category]);

  if (isLoading) {
    return <LinearProgress />;
  }

  const categoriesWithAll = [{ id: 'null', name: 'All' }, ...(productCategories || [])];

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="products-category-label">Category</InputLabel>
        <Select
          labelId="products-category-label"
          id="products-category"
          value={value}
          label="Category"
          onChange={handleChange}
        >
          {categoriesWithAll.map((cat) => (
            <MenuItem key={cat.id ?? 'all'} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default ProductsCategorySelector;
