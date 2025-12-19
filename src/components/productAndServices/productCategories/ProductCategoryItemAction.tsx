'use client'
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material'
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react'
import ProductCategoryFormDialogContent from './ProductCategoryFormDialogContent';
import { ProductCategoriesAppContext } from './ProductCategories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import productCategoryServices from './productCategoryServices';
import { JumboDdMenu } from '@jumbo/components';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { ProductCategory } from './ProductCategoryType';

interface ProductCategoryItemActionProps {
  productCategory: ProductCategory;
}

interface MenuItem {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  slug?: React.ReactNode;
  action?: React.ReactNode;
}

const ProductCategoryItemAction: React.FC<ProductCategoryItemActionProps> = ({ productCategory }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const { productCategories } = useContext(ProductCategoriesAppContext);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const queryClient = useQueryClient();
  const dictionary = useDictionary();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const deleteProductCategory = useMutation({
    mutationFn: productCategoryServices.delete,
    onSuccess: (data) => {
      enqueueSnackbar(dictionary.productCategories.form.messages.deleteSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(dictionary.productCategories.form.errors.messages.deleteResponse, { variant: 'error' });
    },
  });

  const menuItems: MenuItem[] = [
    { icon: <EditOutlined/>, title: dictionary.productCategories.list.actionsTitle.labels.edit, action: 'edit' },
    { icon: <DeleteOutlined color='error'/>, title: dictionary.productCategories.list.actionsTitle.labels.delete, action: 'delete' }
  ];

  const handleItemAction = (menuItem: MenuItem) => {
    switch (menuItem.action) {
      case 'delete':
        showDialog({
          title: dictionary.productCategories.list.dialog.showDialog.title,
          content: dictionary.productCategories.list.dialog.showDialog.content,
          onYes: () => {
            hideDialog();
            deleteProductCategory.mutate(productCategory);
          },
          onNo: () => hideDialog(),
          variant: 'confirm'
        });
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      <Dialog
        open={openEditDialog}
        scroll={'paper'}
        fullWidth
        fullScreen={belowLargeScreen}   
      >
        <ProductCategoryFormDialogContent 
          productCategories={productCategories || []} 
          productCategory={productCategory} 
          title={`Edit Category`} 
          onClose={() => setOpenEditDialog(false)} 
        />
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title={dictionary.productCategories.list.labels.actions}>
            <MoreHorizOutlined/>
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </React.Fragment>
  );
};

export default ProductCategoryItemAction;