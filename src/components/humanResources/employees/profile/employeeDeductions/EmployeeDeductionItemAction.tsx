'use client';

import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
} from '@mui/icons-material';
import { Dialog, LinearProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../../../humanResourcesServices';
import EmployeeDeductionForm from './EmployeeDeductionForm';
import { EmployeeDeductionType } from './EmployeeDeductionType';

const EditEmployeeDeduction = ({
  employeeDeduction,
  setOpenEditDialog,
}: {
  employeeDeduction: EmployeeDeductionType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: employeeDeductionData, isFetching } = useQuery({
    queryKey: ['showEmployeeDeduction', employeeDeduction.id],
    queryFn: () =>
      humanResourcesServices.showEmployeeDeduction(employeeDeduction.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <EmployeeDeductionForm
      employeeDeduction={employeeDeductionData || employeeDeduction}
      setOpenDialog={(v) => {
        setOpenEditDialog(v);
        if (!v) {
          queryClient.invalidateQueries({ queryKey: ['employeeDeductions'] });
        }
      }}
    />
  );
};

const EmployeeDeductionItemAction = ({
  employeeDeduction,
}: {
  employeeDeduction: EmployeeDeductionType;
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteEmployeeDeduction } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployeeDeduction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeDeductions'] });
      enqueueSnackbar('Employee Deduction Deleted Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      let message = 'Something went wrong';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response?.data?.message === 'string'
      ) {
        message = (error as any).response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit',
    },
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Employee Deduction?',
          onYes: () => {
            hideDialog();
            deleteEmployeeDeduction(employeeDeduction.id);
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
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        {openEditDialog && (
          <EditEmployeeDeduction
            employeeDeduction={employeeDeduction}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default EmployeeDeductionItemAction;
