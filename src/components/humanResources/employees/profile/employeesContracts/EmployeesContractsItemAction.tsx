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
import { Dialog, LinearProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { DesignationsProvider } from '../../../designations/DesignationsProvider';
import humanResourcesServices from '../../../humanResourcesServices';
import { EmployeesProvider } from '../../EmployeesProvider';
import { ContractType } from './ContractType';
import EmployeesContractsForm from './EmployeesContractsForm';
import EmployeesContractsTerminateForm from './EmployeesContractsTerminateForm';

const EditEmployeesContract = ({
  contract,
  setOpenEditDialog,
}: {
  contract: ContractType;
  setOpenEditDialog: (open: boolean) => void;
}) => {
  const { data: contractData, isFetching } = useQuery({
    queryKey: ['showEmployeeContract', contract.id],
    queryFn: () => humanResourcesServices.showEmployeeContract(contract.id),
  });
  const queryClient = useQueryClient();

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <EmployeesProvider>
      <DesignationsProvider>
        <EmployeesContractsForm
          contract={contractData || contract}
          setOpenDialog={(v) => {
            setOpenEditDialog(v);
            if (!v) {
              queryClient.invalidateQueries({
                queryKey: ['employeesContracts'],
              });
            }
          }}
        />
      </DesignationsProvider>
    </EmployeesProvider>
  );
};

const EmployeesContractsItemAction = ({
  contract,
}: {
  contract: ContractType;
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openTerminateDialog, setOpenTerminateDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteEmployeeContract } = useMutation({
    mutationFn: humanResourcesServices.deleteEmployeeContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
      enqueueSnackbar('Employee Contract Deleted Successfully', {
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

  const isTerminated = contract.status === 'terminated';

  const menuItems = [
    {
      icon: <EditOutlined />,
      title: 'Edit',
      action: 'edit',
    },
    ...(!isTerminated
      ? [
          {
            icon: <InsertPageBreak />,
            title: 'Terminate',
            action: 'terminate',
          },
        ]
      : []),
    {
      icon: <DeleteOutlined color='error' />,
      title: 'Delete',
      action: 'delete',
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        if (isTerminated) {
          enqueueSnackbar(
            'This contract has been terminated and cannot be edited.',
            { variant: 'warning' }
          );
          return;
        }
        setOpenEditDialog(true);
        break;
      case 'terminate':
        setOpenTerminateDialog(true);
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
      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        {openEditDialog && (
          <EditEmployeesContract
            contract={contract}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
      </Dialog>

      {/* Terminate Dialog */}
      <Dialog
        open={openTerminateDialog}
        fullWidth
        maxWidth='sm'
        fullScreen={belowLargeScreen}
      >
        <EmployeesContractsTerminateForm
          contract={contract}
          setOpenDialog={setOpenTerminateDialog}
        />
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
