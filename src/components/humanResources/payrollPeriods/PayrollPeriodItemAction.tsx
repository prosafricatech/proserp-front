'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Organization } from '@/types/auth-types';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { MenuItemProps } from '@jumbo/types';
import {
  DeleteOutlined,
  MoreHorizOutlined,
  ReceiptLongOutlined,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { getPayslipCalculations } from '../payrollRuns/payslipCalculations';
import { PayrollPeriodType } from './PayrollPeriodType';
import SalarySheetDialog from './SalarySheetDialog';

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const PayrollPeriodItemAction = ({
  payrollPeriod,
}: {
  payrollPeriod: PayrollPeriodType;
}) => {
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;

  const [isExporting, setIsExporting] = useState(false);

  const { mutate: deletePayrollPeriod } = useMutation({
    mutationFn: humanResourcesServices.deletePayrollPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
      enqueueSnackbar('Payroll Period Deleted Successfully', {
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

  const status = (payrollPeriod.status || '').toLowerCase();
  const isPaid = status === 'paid';
  const isApproved = status === 'approved';
  const canViewSalarySheet = isApproved || isPaid;
  const isDeleteDisabled = isApproved || isPaid;

  const { data: runsResponse } = useQuery({
    queryKey: ['payrollRunsForSalarySheet', payrollPeriod.id],
    queryFn: () =>
      humanResourcesServices.getPayrollRunsList({
        payroll_period_id: payrollPeriod.id,
        page: 1,
        limit: 500,
      }),
    enabled: openSalarySheetDialog,
  });

  const runs: PayrollRunType[] = runsResponse?.data || [];

  const runDetailsQueries = useQueries({
    queries: runs.map((run) => ({
      queryKey: ['showPayrollRun', run.id],
      queryFn: () => humanResourcesServices.showPayrollRun(String(run.id)),
      enabled: openSalarySheetDialog && Boolean(run.id),
      staleTime: 1000 * 60,
    })),
  });

  const salarySheetRows = runs.map((run, index) => {
    const detailedRun = runDetailsQueries[index]?.data ?? run;
    return {
      run,
      computed: getPayslipCalculations(detailedRun),
    };
  });

  const periodLabel = `${MONTH_NAMES[payrollPeriod.month] ?? payrollPeriod.month} ${payrollPeriod.year}`;

  const downloadFileName = `Payroll`;

  const exportedData = {
    organization: organization as Organization,
  };

  const handleExcelExport = async (exportedData: any) => {
    try {
      setIsExporting(true);
      const blob =
        await humanResourcesServices.ExportPayrollToExcel(exportedData);
      // console.log('blob: ', blob);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${downloadFileName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setIsExporting(false);
    } catch (e: any) {
      console.log('error exporting excel: ', e);
      setIsExporting(false);
    }
  };

  const menuItems = [
    ...(canViewSalarySheet
      ? [
          {
            icon: <ReceiptLongOutlined color='primary' />,
            title: 'Salary Sheet',
            action: 'salary-sheet',
          },
        ]
      : []),
    ...(!isDeleteDisabled
      ? [
          {
            icon: <DeleteOutlined color='error' />,
            title: 'Delete',
            action: 'delete',
          },
        ]
      : []),
    ...[
      {
        icon: <FontAwesomeIcon icon={faFileExcel} color='green' />,
        title: 'Excel',
        action: 'export',
      },
    ],
  ];

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
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
      case 'salary-sheet':
        if (!canViewSalarySheet) return;
        setOpenSalarySheetDialog(true);
        break;
      case 'export':
        handleExcelExport(exportedData);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />

      <SalarySheetDialog
        open={openSalarySheetDialog}
        onClose={() => setOpenSalarySheetDialog(false)}
        periodLabel={periodLabel}
        rows={salarySheetRows}
      />
    </>
  );
};

export default PayrollPeriodItemAction;
