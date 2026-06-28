'use client';

import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Dialog,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { lazy, useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from '../payrollRuns/PayrollRunType';
import { getPayslipCalculations } from '../payrollRuns/payslipCalculations';
import { PayrollPeriodType } from './PayrollPeriodType';
import PayrollPeriodViewDialog, {
  PayrollPeriodViewDialogProp,
} from './PayrollPeriodViewDialog';

const PayrollPeriodForm = lazy(() => import('./PayrollPeriodForm'));

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }
  return (
    error?.response?.data?.message || error?.message || 'Something went wrong'
  );
};

interface PayrollPeriodItemActionProps {
  payrollPeriod: PayrollPeriodType;
  hasRuns?: boolean;
}

const PayrollPeriodItemAction = ({
  payrollPeriod,
  hasRuns = false,
}: PayrollPeriodItemActionProps) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [salarySheetData, setSalarySheetData] = useState<any>(null);
  const [periodData, setPeriodData] =
    useState<PayrollPeriodViewDialogProp | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Delete mutation
  const { mutate: deletePeriod, isPending: isDeleting } = useMutation({
    mutationFn: () =>
      humanResourcesServices.deletePayrollPeriod(payrollPeriod.id),
    onSuccess: () => {
      enqueueSnackbar('Payroll period deleted successfully', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to delete period';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  // Fetch run details for salary sheet (fallback if previewRows not provided)
  const { data: periodDetails, isLoading: periodLoading = true } = useQuery({
    queryKey: ['payrollPeriodDetails', payrollPeriod?.id],
    queryFn: () => humanResourcesServices.showPayrollPeriod(payrollPeriod?.id),
    enabled: isLoading,
    // staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    setPeriodData((prev: any) => ({ ...prev, ...periodDetails }));
  }, [periodDetails]);

  // Fetch allowance types
  const { data: allowanceTypes, isLoading: allowanceLoading = true } = useQuery(
    {
      queryKey: ['allowanceTypes'],
      queryFn: async () => {
        const response = await humanResourcesServices.getAllowanceTypesList();
        return response?.data || [];
      },
      enabled: isLoading,
    }
  );

  // Fetch deduction types
  const { data: deductionTypes, isLoading: deductionLoading = true } = useQuery(
    {
      queryKey: ['deductionTypes'],
      queryFn: async () => {
        const response = await humanResourcesServices.getDeductionTypesList();
        return response?.data || [];
      },
      enabled: isLoading,
    }
  );

  // Fetch employer contribution types
  const { data: contributionTypes, isLoading: contributionLoading = true } =
    useQuery({
      queryKey: ['employerContributionTypes'],
      queryFn: async () => {
        const response =
          await humanResourcesServices.getEmployerContributionTypesList();
        return response?.data || [];
      },
      enabled: isLoading,
    });

  const handleGetRunsDetails = async (payrollRun: PayrollRunType) => {
    // setIsLoading(true);
    try {
      // Fetch preview data
      const previewResponse = await humanResourcesServices.previewPayrollRun({
        id: payrollRun.id,
      });
      const previewRows =
        previewResponse?.data?.rows || previewResponse?.rows || [];

      // Build salary sheet rows
      const salaryRows = previewRows.map((row: any) => {
        // Create a minimal run object from preview data
        const run = {
          ...payrollRun,
          employee: row.employee,
          allowances: row.allowances || [],
          deductions: row.deductions || [],
          employer_contributions: row.employer_contributions || [],
          basic_salary: row.basic_salary || 0,
          gross_salary: row.gross_salary || 0,
          net_salary: row.net_salary || 0,
          paye: row.paye || 0,
          taxable_income: row.taxable_income || 0,
          total_allowances: row.total_allowances || 0,
          total_deductions: row.total_deductions || 0,
        };
        return {
          run: run,
          computed: getPayslipCalculations(run),
        };
      });

      // Get period label
      let periodLabel = payrollRun.cost_center?.name || 'Company-wide Run';

      if (payrollRun?.payroll_period) {
        const monthNames = [
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
        const monthIndex = payrollRun.payroll_period.month;
        // Ensure month is within valid range (1-12)
        const monthName =
          monthIndex && monthIndex >= 1 && monthIndex <= 12
            ? monthNames[monthIndex - 1]
            : '';
        const year = payrollRun.payroll_period.year || '';
        periodLabel = `${monthName} ${year} - ${periodLabel}`;
      }

      setSalarySheetData((prev: any) => ({
        ...prev,
        rows: [...(prev.rows || []), ...salaryRows],
        periodLabel: periodLabel,
      }));

      // setIsLoading(false);
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSalarySheetData((prev: any) => ({
      ...prev,
      ...(deductionTypes && { deductionTypes }),
      ...(allowanceTypes && { allowanceTypes }),
      ...(contributionTypes && { contributionTypes }),
    }));
  }, [deductionTypes, allowanceTypes, contributionTypes]);

  useEffect(() => {
    if (periodDetails && periodDetails.runs_count > 0) {
      const periodRuns = periodDetails.runs;
      periodRuns.map((run: any) => handleGetRunsDetails(run));
    }
  }, [periodDetails]);

  useEffect(() => {
    if (salarySheetData) {
      setPeriodData((prev: any) => ({ ...prev, ...salarySheetData }));
    }
  }, [salarySheetData]);

  useEffect(() => {
    const canOpenDialog =
      !allowanceLoading &&
      !deductionLoading &&
      !contributionLoading &&
      !periodLoading &&
      periodData &&
      Object.keys(periodData).length > 0;
    if (canOpenDialog) {
      setIsLoading(false);
      setOpenPreviewDialog(true);
    }
  }, [
    allowanceLoading,
    deductionLoading,
    contributionLoading,
    periodData,
    periodLoading,
  ]);

  const handleDelete = () => {
    if (hasRuns) {
      enqueueSnackbar('Cannot delete period with existing runs', {
        variant: 'error',
      });
      return;
    }

    showDialog({
      title: 'Delete Payroll Period',
      content: `Delete ${payrollPeriod.year} - ${payrollPeriod.month}?`,
      onYes: () => {
        hideDialog();
        deletePeriod();
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const canEdit = !hasRuns || payrollPeriod.status?.toLowerCase() === 'draft';

  return (
    <>
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth='sm'
        fullScreen={belowLargeScreen}
      >
        {openEditDialog && (
          <PayrollPeriodForm
            setOpenDialog={setOpenEditDialog}
            payrollPeriod={payrollPeriod}
          />
        )}
      </Dialog>

      {/* Salary Sheet Dialog */}
      {!openPreviewDialog && isLoading && (
        <Dialog open={!openPreviewDialog && isLoading} fullWidth>
          <LinearProgress />
        </Dialog>
      )}
      {openPreviewDialog && !isLoading && (
        <PayrollPeriodViewDialog
          open={openPreviewDialog}
          onClose={() => setOpenPreviewDialog(false)}
          allowanceTypes={periodData?.allowanceTypes}
          contributionTypes={periodData?.contributionTypes}
          created_at={periodData?.created_at}
          created_by={periodData?.created_by}
          deductionTypes={periodData?.deductionTypes}
          deleted_at={periodData?.deleted_at}
          id={periodData?.id}
          month={periodData?.month}
          periodLabel={periodData?.periodLabel}
          remarks={periodData?.remarks}
          rows={periodData?.rows}
          runs={periodData?.runs}
          runs_count={periodData?.runs_count}
          updated_at={periodData?.updated_at}
          year={periodData?.year}
          isLoading={isLoading}
        />
      )}

      <Tooltip title='Preview Period Run'>
        <IconButton size='small' onClick={() => setIsLoading(true)}>
          <VisibilityOutlined fontSize='small' />
        </IconButton>
      </Tooltip>

      {canEdit && (
        <Tooltip title='Edit'>
          <IconButton size='small' onClick={() => setOpenEditDialog(true)}>
            <EditOutlined fontSize='small' />
          </IconButton>
        </Tooltip>
      )}

      {!hasRuns && (
        <Tooltip title='Delete'>
          <IconButton
            size='small'
            onClick={handleDelete}
            color='error'
            disabled={isDeleting}
          >
            <DeleteOutlined fontSize='small' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default PayrollPeriodItemAction;
