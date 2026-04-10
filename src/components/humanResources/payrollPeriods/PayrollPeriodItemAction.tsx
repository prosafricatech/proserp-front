'use client';

import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  EditOutlined,
  MoreHorizOutlined,
  PaidOutlined,
  PersonOutline,
  PlayCircleOutline,
} from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { Employee } from '../employees/EmployeesType';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from './PayrollPeriodType';
import PayrollPeriodForm from './PayrollPeriodForm';

const PayrollPeriodItemAction = ({
  payrollPeriod,
}: {
  payrollPeriod: PayrollPeriodType;
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openProcessDialog, setOpenProcessDialog] = useState(false);
  const [processMode, setProcessMode] = useState<'all' | 'single'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: employeesResponse } = useQuery({
    queryKey: ['payrollProcessEmployees'],
    queryFn: humanResourcesServices.getAllEmployees,
    staleTime: 1000 * 60 * 10,
  });

  const employees: Employee[] = employeesResponse?.data || [];

  const { mutate: deletePayrollPeriod } = useMutation({
    mutationFn: humanResourcesServices.deletePayrollPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      enqueueSnackbar('Payroll Period Deleted Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar('Error Deleting Payroll Period', { variant: 'error' });
      console.log('error deleting payroll period: ', error);
    },
  });

  const { mutate: processPayrollPeriodAllEmployees, isPending: isProcessingAllPayroll } =
    useMutation({
      mutationFn: humanResourcesServices.processPayrollPeriodAllEmployees,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
        queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
        enqueueSnackbar('Payroll Processed Successfully', {
          variant: 'success',
        });
      },
      onError: (error: any) => {
        enqueueSnackbar('Error Processing Payroll', { variant: 'error' });
        console.log('error processing payroll: ', error);
      },
    });

  const { mutate: processPayrollPeriodSingleEmployee, isPending: isProcessingSinglePayroll } =
    useMutation({
      mutationFn: humanResourcesServices.processPayrollPeriodSingleEmployee,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
        queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
        enqueueSnackbar('Payroll Processed Successfully', {
          variant: 'success',
        });
      },
      onError: (error: any) => {
        enqueueSnackbar('Error Processing Payroll', { variant: 'error' });
        console.log('error processing payroll: ', error);
      },
    });

  const { mutate: markPayrollPeriodPaid, isPending: isMarkingPaid } = useMutation({
    mutationFn: humanResourcesServices.markPayrollPeriodPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar('Payroll Marked as Paid Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar('Error Marking Payroll as Paid', { variant: 'error' });
      console.log('error marking payroll as paid: ', error);
    },
  });

  const status = (payrollPeriod.status || '').toLowerCase();
  const isPaid = status === 'paid';
  const isApproved = status === 'approved';
  const isDeleteDisabled = isApproved || isPaid;
  const isMarkPaidDisabled = !isApproved || isPaid;
  const isProcessDisabled = isPaid;

  const menuItems = [
    { icon: <EditOutlined />, title: 'Edit', action: 'edit' },
    {
      icon: <PlayCircleOutline color={isProcessDisabled ? 'disabled' : 'primary'} />,
      title: 'Process All Employees',
      action: 'process-all',
      disabled: isProcessDisabled,
    },
    {
      icon: <PersonOutline color={isProcessDisabled ? 'disabled' : 'primary'} />,
      title: 'Process Single Employee',
      action: 'process-single',
      disabled: isProcessDisabled,
    },
    {
      icon: <PaidOutlined color={isMarkPaidDisabled ? 'disabled' : 'success'} />,
      title: isPaid ? 'Already Paid' : 'Mark Paid',
      action: 'mark-paid',
      disabled: isMarkPaidDisabled,
    },
    {
      icon: <DeleteOutlined color={isDeleteDisabled ? 'disabled' : 'error'} />,
      title: 'Delete',
      action: 'delete',
      disabled: isDeleteDisabled,
    },
  ];

  const resetProcessForm = () => {
    setSelectedEmployee(null);
  };

  const openProcessPayrollDialog = (mode: 'all' | 'single') => {
    setProcessMode(mode);
    resetProcessForm();
    setOpenProcessDialog(true);
  };

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        if (isDeleteDisabled) return;
        showDialog({
          title: 'Confirm Delete',
          content: 'Are you sure you want to delete this Payroll Period?',
          onYes: () => {
            hideDialog();
            deletePayrollPeriod(payrollPeriod.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'process-all':
        if (isProcessDisabled) return;
        openProcessPayrollDialog('all');
        break;
      case 'process-single':
        if (isProcessDisabled) return;
        openProcessPayrollDialog('single');
        break;
      case 'mark-paid':
        if (isMarkPaidDisabled) return;
        showDialog({
          title: 'Mark Payroll as Paid',
          content: 'Mark this approved payroll period as paid?',
          onYes: () => {
            hideDialog();
            markPayrollPeriodPaid(payrollPeriod.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  const handleProcessPayroll = () => {
    if (processMode === 'single' && !selectedEmployee?.id) {
      enqueueSnackbar('Please select an employee', { variant: 'warning' });
      return;
    }

    if (processMode === 'all') {
      processPayrollPeriodAllEmployees(
        { id: payrollPeriod.id },
        {
          onSuccess: () => {
            setOpenProcessDialog(false);
            resetProcessForm();
          },
        }
      );
      return;
    }

    processPayrollPeriodSingleEmployee(
      {
        id: payrollPeriod.id,
        employee_id: selectedEmployee!.id,
      },
      {
        onSuccess: () => {
          setOpenProcessDialog(false);
          resetProcessForm();
        },
      }
    );
  };

  return (
    <>
      <Dialog
        open={openEditDialog}
        fullWidth
        maxWidth='md'
        fullScreen={belowLargeScreen}
      >
        <PayrollPeriodForm
          payrollPeriod={payrollPeriod}
          setOpenDialog={setOpenEditDialog}
        />
      </Dialog>

      <Dialog
        open={openProcessDialog}
        onClose={() => setOpenProcessDialog(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>
          {processMode === 'all' ? 'Process Payroll' : 'Process Single Employee'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant='body2' color='text.secondary'>
              {processMode === 'all'
                ? `Process payroll for all employees in ${payrollPeriod.month}/${payrollPeriod.year}.`
                : `Select one employee to process payroll for ${payrollPeriod.month}/${payrollPeriod.year}.`}
            </Typography>
            {processMode === 'single' && (
              <Autocomplete
                options={employees}
                value={selectedEmployee}
                onChange={(_, value) => setSelectedEmployee(value)}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                getOptionLabel={(option) =>
                  `${option.first_name || ''} ${option.middle_name || ''} ${option.last_name || ''}`.trim() ||
                  `Employee #${option.id}`
                }
                renderInput={(params) => (
                  <TextField {...params} label='Employee' fullWidth />
                )}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProcessDialog(false)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleProcessPayroll}
            disabled={
              (processMode === 'single' && !selectedEmployee) ||
              isProcessingAllPayroll ||
              isProcessingSinglePayroll ||
              isMarkingPaid
            }
          >
            Process
          </Button>
        </DialogActions>
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

export default PayrollPeriodItemAction;
