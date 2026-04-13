'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { MenuItemProps } from '@jumbo/types';
import {
  CheckCircleOutline,
  MoreHorizOutlined,
  ReceiptLongOutlined,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from './PayrollRunType';

const PayrollRunItemAction = ({ payrollRun }: { payrollRun: PayrollRunType }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const router = useRouter();
  const lang = useLanguage();

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
      icon: <ReceiptLongOutlined color='primary' />,
      title: 'Full Payslip Detail',
      action: 'viewPayslip',
    },
    ...(!isFinalized
      ? [
          {
            icon: <CheckCircleOutline color='success' />,
            title: 'Finalize',
            action: 'finalize',
          },
        ]
      : []),
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'viewPayslip':
        router.push(`/${lang}/humanResources/payroll/${payrollRun.payroll_period_id}/runs/${payrollRun.id}`);
        break;
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
