'use client'
import { DeleteOutlined, EditOutlined, MoreHorizOutlined } from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItemProps } from '@jumbo/types';
import { JumboDdMenu } from '@jumbo/components';
import ProjectCategoryFormDialog from './ProjectCategoryFormDialog';
import projectCategoryServices from './project-category-services';
import { Category } from './ProjectCategoriesType';

const ProjectCategoryListItemAction = ({ projectCategory }: { projectCategory: Category }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteProjectCategory } = useMutation({
    mutationFn: (params: { id: number }) => projectCategoryServices.delete(params),
    onSuccess: (data: { message: string }) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectCategories'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete project category',
        { variant: 'error' }
      );
    },
  });

  const menuItems: MenuItemProps[] = [
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    { icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete' },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Project Category Deletion',
          content: 'Are you sure you want to delete this project category?',
          onYes: () => {
            hideDialog();
          deleteProjectCategory({ id: projectCategory.id ? projectCategory.id : 0 });
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

return (
<>
  <Dialog
    open={openEditDialog}
    fullWidth
    maxWidth="sm"
    fullScreen={belowLargeScreen}
  >
    <ProjectCategoryFormDialog
      category={projectCategory}
      setOpenDialog={setOpenEditDialog}
    />
  </Dialog>
  <JumboDdMenu
    icon={
      <Tooltip title="Actions">
        <MoreHorizOutlined fontSize="small" />
      </Tooltip>
    }
    menuItems={menuItems}
    onClickCallback={handleItemAction}
  />
</>
);
};

export default ProjectCategoryListItemAction;
