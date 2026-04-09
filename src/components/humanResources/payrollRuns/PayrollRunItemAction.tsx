'use client';

import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { MenuItemProps } from '@jumbo/types';
import { CheckCircleOutline, MoreHorizOutlined } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from './PayrollRunType';

const PayrollRunItemAction = ({ payrollRun }: { payrollRun: PayrollRunType }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { mutate: finalizePayrollRun } = useMutation({
    mutationFn: humanResourcesServices.finalizePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar('Payroll Run Finalized Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar('Error Finalizing Payroll Run', { variant: 'error' });
      console.log('error finalizing payroll run: ', error);
    },
  });

  const isFinalized = (payrollRun.status || '').toLowerCase() === 'finalized';

  const menuItems = [
    {
      icon: <CheckCircleOutline color={isFinalized ? 'disabled' : 'success'} />,
      title: isFinalized ? 'Already Finalized' : 'Finalize',
      action: 'finalize',
      disabled: isFinalized,
    },
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'finalize':
        if (isFinalized) return;
        showDialog({
          title: 'Finalize Payroll Run',
          content: 'Are you sure you want to finalize this payroll run?',
          onYes: () => {
            hideDialog();
            finalizePayrollRun(payrollRun.id);
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
    <JumboDdMenu
      icon={
        <Tooltip title='Actions'>
          <MoreHorizOutlined fontSize='small' />
        </Tooltip>
      }
      menuItems={menuItems}
      onClickCallback={handleItemAction}
    />
  );
};

export default PayrollRunItemAction;
