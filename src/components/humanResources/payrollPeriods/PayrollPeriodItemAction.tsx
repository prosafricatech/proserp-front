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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { lazy, useEffect, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
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
  const [fetchingRows, setFetchingRows] = useState(false);

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

  useEffect(() => {
    // const fetchAllData = async () => {
    //   if (!payrollPeriod?.id) return;

    //   setIsLoading(true);
    //   setFetchingRows(true);

    //   try {
    //     // Fetch period details
    //     const periodResponse = await humanResourcesServices.showPayrollPeriod(
    //       payrollPeriod.id
    //     );
    //     const periodDetails = periodResponse?.data || periodResponse || {};

    //     // Fetch all runs details in parallel
    //     const runs = periodDetails.runs || [];
    //     const runPromises = runs.map((run: any) =>
    //       humanResourcesServices.previewPayrollRun({ id: run.id })
    //     );
    //     const runResponses = await Promise.all(runPromises);

    //     // Build salary rows
    //     const salaryRows = runResponses.flatMap((response, index) => {
    //       const previewRows = response?.data?.rows || response?.rows || [];
    //       const run = runs[index];

    //       return previewRows.map((row: any) => ({
    //         run: { ...run, ...row },
    //         computed: getPayslipCalculations({ ...run, ...row }),
    //       }));
    //     });

    //     // Fetch types
    //     const [allowanceRes, deductionRes, contributionRes] = await Promise.all(
    //       [
    //         humanResourcesServices.getAllowanceTypesList(),
    //         humanResourcesServices.getDeductionTypesList(),
    //         humanResourcesServices.getEmployerContributionTypesList(),
    //       ]
    //     );

    //     // Build period label
    //     let periodLabel = periodDetails.cost_center?.name || 'Company-wide Run';
    //     if (periodDetails.month) {
    //       const monthNames = [
    //         'January',
    //         'February',
    //         'March',
    //         'April',
    //         'May',
    //         'June',
    //         'July',
    //         'August',
    //         'September',
    //         'October',
    //         'November',
    //         'December',
    //       ];
    //       periodLabel = `${monthNames[periodDetails.month - 1]} ${periodDetails.year} - ${periodLabel}`;
    //     }

    //     // Set ALL data at once
    //     setPeriodData({
    //       ...periodDetails,
    //       rows: salaryRows,
    //       runs: runs,
    //       allowanceTypes: allowanceRes?.data || [],
    //       deductionTypes: deductionRes?.data || [],
    //       contributionTypes: contributionRes?.data || [],
    //       periodLabel: periodLabel,
    //       isLoading: false,
    //     });

    //     setFetchingRows(false);
    //     setIsLoading(false);

    //     // Open dialog immediately after data is set
    //     setOpenPreviewDialog(true);
    //   } catch (error: any) {
    //     enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    //     setIsLoading(false);
    //     setFetchingRows(false);
    //   }
    // };

    const fetchAllData = async () => {
      if (!payrollPeriod?.id) return;

      setIsLoading(true);
      setFetchingRows(true);

      try {
        // Fetch period details
        const periodResponse = await humanResourcesServices.showPayrollPeriod(
          payrollPeriod.id
        );
        console.log('periodResponse: ', periodResponse);
        const period = periodResponse.period;
        const runs = periodResponse.runs;
        const total_employees = periodResponse.total_employees;
        const total_runs = periodResponse.total_runs;

        const employeeAlloances = runs.flatMap((run: any) =>
          run.payslips?.flatMap((slip: any) =>
            slip.allowances?.flatMap((allowance: any) => ({
              ...allowance,
              employee_contract_id: slip.contract?.id,
            }))
          )
        );

        const employeeDeductions = runs.flatMap((run: any) =>
          run.payslips?.flatMap((slip: any) =>
            slip.deductions?.flatMap((deduction: any) => ({
              ...deduction,
              employee_contract_id: slip.contract?.id,
            }))
          )
        );

        const employeeContributions = runs.flatMap((run: any) =>
          run.payslips?.flatMap((slip: any) =>
            slip.employer_contributions?.flatMap((contribution: any) => ({
              ...contribution,
              employee_contract_id: slip.contract?.id,
            }))
          )
        );

        console.log('employeeAlloances: ', employeeAlloances);
        console.log('employeeDeductions: ', employeeDeductions);
        console.log('employeeContributions: ', employeeContributions);

        setFetchingRows(false);
        setIsLoading(false);
      } catch (error: any) {
        enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
        setIsLoading(false);
        setFetchingRows(false);
      }
    };

    if (isLoading && !openPreviewDialog) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollPeriod?.id, isLoading]); // Add isLoading to dependencies

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
          open={openPreviewDialog && !isLoading}
          onClose={() => {
            setOpenPreviewDialog(false);
            setSalarySheetData(null);
            setPeriodData(null);
          }}
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
        <IconButton
          size='small'
          onClick={() => {
            setIsLoading(true);
          }}
        >
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
