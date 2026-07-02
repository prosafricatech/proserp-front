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
import PayrollPeriodNewViewDialog, {
  PayrollPeriodNewViewDialogProp,
} from './PayrollPeriodNewViewDialog';
import { PayrollPeriodType } from './PayrollPeriodType';

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
    useState<PayrollPeriodNewViewDialogProp | null>(null);
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
    const fetchAllData = async () => {
      if (!payrollPeriod?.id) return;

      setIsLoading(true);
      setFetchingRows(true);

      try {
        // Fetch period details
        const periodResponse = await humanResourcesServices.showPayrollPeriod(
          payrollPeriod.id
        );
        const period = periodResponse?.period;
        const runs = periodResponse?.runs;

        const employeeDeductions = runs.flatMap((run: any) =>
          run?.payslips?.flatMap((slip: any) =>
            slip.deductions?.map((deduction: any) => ({
              ...deduction,
              employee_contract_id: slip.contract?.id,
            }))
          )
        );

        const employeeAllowances = runs.flatMap((run: any) =>
          run?.payslips?.flatMap((slip: any) =>
            slip.allowances?.map((allowance: any) => ({
              ...allowance,
              employee_contract_id: slip.contract?.id,
            }))
          )
        );

        const employeecontributions = runs.flatMap((run: any) =>
          run?.payslips?.flatMap((slip: any) =>
            slip.employer_contributions?.map((contribution: any) => ({
              ...contribution,
              employee_contract_id: slip.contract?.id,
            }))
          )
        );

        const getUniqueTypes = (value: Array<any>) => {
          const filteredDeductions = Array.from(
            new Map(
              value.map((itm) => [
                itm?.deduction_type_id ??
                  itm?.allowance_type_id ??
                  itm?.employer_contribution_type_id ??
                  itm?.label,
                itm,
              ])
            ).values()
          );
          return filteredDeductions;
        };

        const unique_deductions_types = getUniqueTypes(employeeDeductions);
        const unique_allowances_types = getUniqueTypes(employeeAllowances);
        const unique_contributions_types = getUniqueTypes(
          employeecontributions
        );

        const hasAllowances = unique_allowances_types.length > 0;
        const hasDeductions = unique_deductions_types.length > 0;
        const hasContributions = unique_contributions_types.length > 0;

        const hasTypes = {
          hasAllowances: hasAllowances,
          hasDeductions: hasDeductions,
          hasContributions: hasContributions,
        };
        const employeetypes = {
          employeeDeductions: employeeDeductions,
          employeeAllowances: employeeAllowances,
          employeecontributions: employeecontributions,
        };

        const uniqueTypes = {
          unique_allowances_types: unique_allowances_types,
          unique_deductions_types: unique_deductions_types,
          unique_contributions_types: unique_contributions_types,
        };

        const employees = runs.flatMap((run: any) =>
          run?.payslips.flatMap((slip: any, idx: number) => ({
            ...slip.employee,
            basic_salary: slip.contract?.basic_salary ?? 0,
            allwances: slip.allowances ?? [],
            deductions: slip.deductions ?? [],
            employer_contributions: slip.employer_contributions ?? [],
            paye: slip.paye ?? 0,
            slipIndex: idx,
          }))
        );

        setPeriodData({
          period: period,
          runs: runs,
          hasTypes: hasTypes,
          employeeTypes: employeetypes,
          uniqueTypes: uniqueTypes,
          isLoading: false,
        });

        setFetchingRows(false);
        setIsLoading(false);

        // Open dialog immediately after data is set
        setOpenPreviewDialog(true);
      } catch (error: any) {
        console.error(error);
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
        // <PayrollPeriodViewDialog
        //   open={openPreviewDialog && !isLoading}
        //   onClose={() => {
        //     setOpenPreviewDialog(false);
        //     setSalarySheetData(null);
        //     setPeriodData(null);
        //   }}
        //   allowanceTypes={periodData?.allowanceTypes}
        //   contributionTypes={periodData?.contributionTypes}
        //   created_at={periodData?.created_at}
        //   created_by={periodData?.created_by}
        //   deductionTypes={periodData?.deductionTypes}
        //   deleted_at={periodData?.deleted_at}
        //   id={periodData?.id}
        //   month={periodData?.month}
        //   periodLabel={periodData?.periodLabel}
        //   remarks={periodData?.remarks}
        //   rows={periodData?.rows}
        //   runs={periodData?.runs}
        //   runs_count={periodData?.runs_count}
        //   updated_at={periodData?.updated_at}
        //   year={periodData?.year}
        //   isLoading={isLoading}
        // />

        <PayrollPeriodNewViewDialog
          open={openPreviewDialog && !isLoading}
          onClose={() => {
            setOpenPreviewDialog(false);
            setSalarySheetData(null);
            setPeriodData(null);
          }}
          period={periodData?.period}
          runs={periodData?.runs}
          hasTypes={periodData?.hasTypes}
          employeeTypes={periodData?.employeeTypes}
          uniqueTypes={periodData?.uniqueTypes}
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
