'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
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

type SalaryTypeItem = {
  id?: number;
  name?: string;
  category?: string;
};

const extractList = (payload: any): SalaryTypeItem[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

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

  const { data: allowanceTypesResponse } = useQuery({
    queryKey: ['allowanceTypesForSalarySheet'],
    queryFn: () =>
      humanResourcesServices.getAllowanceTypesList({ page: 1, limit: 500 }),
    enabled: openSalarySheetDialog,
    staleTime: 1000 * 60,
  });

  const { data: deductionTypesResponse } = useQuery({
    queryKey: ['deductionTypesForSalarySheet'],
    queryFn: () =>
      humanResourcesServices.getDeductionTypesList({ page: 1, limit: 500 }),
    enabled: openSalarySheetDialog,
    staleTime: 1000 * 60,
  });

  const { data: contributionTypesResponse } = useQuery({
    queryKey: ['contributionTypesForSalarySheet'],
    queryFn: () =>
      humanResourcesServices.getEmployerContributionTypesList({
        page: 1,
        limit: 500,
      }),
    enabled: openSalarySheetDialog,
    staleTime: 1000 * 60,
  });

  const allowanceTypes = extractList(allowanceTypesResponse);
  const deductionTypes = extractList(deductionTypesResponse);
  const contributionTypes = extractList(contributionTypesResponse);

  const runDetailsQueries = useQueries({
    queries: runs.map((run) => ({
      queryKey: ['showPayrollRun', run.id],
      queryFn: () => humanResourcesServices.showPayrollRun(String(run.id)),
      enabled: openSalarySheetDialog && Boolean(run.id),
    })),
  });

  const salarySheetRows = runs.map((run, index) => {
    const queryData = runDetailsQueries[index]?.data as any;
    const detailedRun = queryData?.data ?? queryData ?? run;
    return {
      run: detailedRun,
      computed: getPayslipCalculations(detailedRun),
    };
  });

  const periodLabel = `${MONTH_NAMES[payrollPeriod.month] ?? payrollPeriod.month} ${payrollPeriod.year}`;

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
        allowanceTypes={allowanceTypes}
        deductionTypes={deductionTypes}
        contributionTypes={contributionTypes}
      />
    </>
  );
};

export default PayrollPeriodItemAction;
