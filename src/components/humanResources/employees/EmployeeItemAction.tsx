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
import { DepartmentsProvider } from '../departments/DepartmentsProvider';
import humanResourcesServices from '../humanResourcesServices';
import EmployeeForm from './EmployeeForm';
import { Employee } from './EmployeesType';

const EditEmployee = ({
  employee,
  setOpenEditDialog,
}: {
  employee: Employee;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: employeeData, isFetching } = useQuery({
    queryKey: ['showEmployee', employee.id],
    queryFn: () => humanResourcesServices.showEmployee(employee.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <DepartmentsProvider>
      <EmployeeForm
        employee={employeeData || employee}
        setOpenDialog={(v) => {
          setOpenEditDialog(v);
          if (!v) {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }
        }}
      />
    </DepartmentsProvider>
  );
};

const EmployeeItemAction = ({ employee }: { employee: Employee }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteEmployee } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      enqueueSnackbar('Employee Deleted Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar('Error Deleting Employee', {
        variant: 'error',
      });
      console.log('error deleting employee: ', error);
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
          content: 'Are you sure you want to delete this Employee?',
          onYes: () => {
            hideDialog();
            deleteEmployee(employee.id);
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
          <EditEmployee
            employee={employee}
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

export default EmployeeItemAction;
