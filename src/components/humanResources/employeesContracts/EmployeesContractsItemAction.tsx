import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  InsertPageBreak,
  MoreHorizOutlined,
} from '@mui/icons-material';
import { Dialog, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { DesignationsProvider } from '../designations/DesignationsProvider';
import { EmployeesProvider } from '../employees/EmployeesProvider';
import humanResourcesServices from '../humanResourcesServices';
import { ContractType } from './ContractType';
import EmployeesContractsForm from './EmployeesContractsForm';

const EmployeesContractsItemAction = ({
  contract,
}: {
  contract: ContractType;
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteEmployeeContract } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
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

  const { mutate: terminateEmployeeContract } = useMutation({
    mutationFn: async (data: ContractType) => {
      return humanResourcesServices.terminateEmployeeContract(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
      enqueueSnackbar('Employee Contract Terminated Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar('Error Terminating Employee Contract', {
        variant: 'error',
      });
      console.log('error terminating employee contract: ', error);
    },
  });

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit',
    },
    {
      icon: <InsertPageBreak />,
      title: 'Terminate',
      action: 'terminate',
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
      case 'terminate':
        showDialog({
          title: 'Confirm Termination',
          content: 'Are you sure you want to terminate this Contract?',
          onYes: () => {
            hideDialog();
            terminateEmployeeContract(contract);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'delete':
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Contract?',
          onYes: () => {
            hideDialog();
            deleteEmployeeContract(contract.id);
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
        <EmployeesProvider>
          <DesignationsProvider>
            <EmployeesContractsForm
              setOpenDialog={setOpenEditDialog}
              contract={contract}
            />
          </DesignationsProvider>
        </EmployeesProvider>
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

export default EmployeesContractsItemAction;
