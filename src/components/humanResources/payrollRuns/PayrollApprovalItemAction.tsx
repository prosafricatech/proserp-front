'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { DeleteOutlined, EditOutlined, FactCheckOutlined, PreviewOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import SalarySheetDialog from '../payrollPeriods/SalarySheetDialog';
import { getPayslipCalculations } from './payslipCalculations';
import SummaryTab from './SummaryTab';
import { PayrollRunType } from './PayrollRunType';

interface PayrollApprovalItemActionProps {
  payrollRun: PayrollRunType;
  approval: NonNullable<PayrollRunType['approvals']>[number];
  approvals: NonNullable<PayrollRunType['approvals']>;
}

const calculateSummaryFromPayslips = (payslips: any[] = []) => {
  const totals = {
    basic_salary: 0,
    employees_count: 0,
    gross_salary: 0,
    net_salary: 0,
    paye: 0,
    total_allowances: 0,
    total_deductions: 0,
  };

  if (!Array.isArray(payslips) || payslips.length === 0) return totals;

  payslips.forEach((payslip: any) => {
    const basicSalary = Number(payslip.basic_salary) || 0;
    const paye = Number(payslip.paye) || 0;

    // Calculate total allowances from allowances array
    const allowances = Array.isArray(payslip.allowances) ? payslip.allowances : [];
    const allowancesSum = allowances.reduce(
      (sum: number, a: any) => sum + (Number(a.amount) || Number(a.value) || 0),
      0
    );

    // Calculate total deductions from deductions array
    const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];
    const deductionsSum = deductions.reduce(
      (sum: number, d: any) => sum + (Number(d.amount) || Number(d.value) || 0),
      0
    );

    const grossSalary = basicSalary + allowancesSum;
    const netSalary = grossSalary - paye - deductionsSum;

    totals.basic_salary += basicSalary;
    totals.paye += paye;
    totals.total_allowances += allowancesSum;
    totals.total_deductions += deductionsSum + paye; // Total deductions includes PAYE
    totals.gross_salary += grossSalary;
    totals.net_salary += netSalary;
  });

  totals.employees_count = payslips.length;
  return totals;
};

const getPendingPayrollLevel = (payrollRun: PayrollRunType | undefined) => {
  if (!payrollRun) return undefined;
  const levels = payrollRun?.approval_chain?.levels || [];
  const approvedLevelIds = new Set(
    (payrollRun.approvals || [])
      .filter((a) => a.status === 'approved')
      .map((a) => Number(a.chain_level_id || a.approval_chain_level_id))
  );
  return levels.find((level) => !approvedLevelIds.has(Number(level.id)));
};

const PayrollApprovalItemAction = ({
  payrollRun,
  approval,
  approvals,
}: PayrollApprovalItemActionProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');
  const [editStatus, setEditStatus] = useState<'approved' | 'rejected' | 'on hold'>('approved');
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const [isLoadingSalarySheet, setIsLoadingSalarySheet] = useState(false);
  const [salarySheetData, setSalarySheetData] = useState<any>(null);

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authUser, hasOrganizationRole } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getPendingPayrollLevel(payrollRun);
  const pendingRoleName =
    payrollRun?.next_approval_level?.role?.name || pendingLevel?.role?.name || '';
  const isLatestApproval = approvals[approvals.length - 1]?.id === approval?.id;
  const runStatus = (payrollRun?.status || '').toLowerCase();

  const { mutate: addApproval, isPending: isAdding } = useMutation({
    mutationFn: humanResourcesServices.addPayrollRunApproval,
    onSuccess: () => {
      setOpenDialog(false);
      setRemarks('');
      setRemarksError('');
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails', payrollRun.id] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar('Payroll approval recorded', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const { mutate: deleteApproval, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => humanResourcesServices.deletePayrollRunApproval(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails', payrollRun.id] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar(data?.message || 'Approval deleted', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const { mutate: updateApproval, isPending: isUpdating } = useMutation({
    mutationFn: (data: any) => humanResourcesServices.updatePayrollRunApproval(approval.id!, data),
    onSuccess: (data: any) => {
      setOpenDialog(false);
      setIsEditMode(false);
      setRemarks('');
      setRemarksError('');
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails', payrollRun.id] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      enqueueSnackbar(data?.message || 'Approval updated', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Something went wrong',
        { variant: 'error' }
      );
    },
  });

  const handleDelete = () => {
    showDialog({
      title: 'Confirm Delete?',
      content: 'If you click yes, this Approval will be deleted',
      onYes: () => {
        hideDialog();
        deleteApproval(approval.id!);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const canEdit =
    isLatestApproval && (approval as any)?.creator?.id === authUser?.user?.id;

  const canDelete =
    isLatestApproval &&
    (approval as any)?.creator?.id === authUser?.user?.id;

  const normalizedApprovalStatus = (approval?.status || '').toLowerCase();

  const canNextApprove =
    isLatestApproval &&
    runStatus !== 'approved' &&
    normalizedApprovalStatus === 'approved' &&
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName));

  const handleSaveEdit = () => {
    if (!remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }
    setRemarksError('');
    updateApproval({ remarks, status: editStatus });
  };

  const handleDecisionClick = (status: 'approved' | 'rejected' | 'on hold') => {
    if (isEditMode) {
      // In edit mode, update the approval
      setEditStatus(status);
      if (remarks.trim()) {
        updateApproval({ remarks, status });
      } else {
        setRemarksError('Remarks are required');
      }
    } else {
      // In create mode, use the existing flow
      handleDecision(status);
    }
  };

  const handleDecision = (status: 'approved' | 'rejected' | 'on hold') => {
    if ((status === 'rejected' || status === 'on hold') && !remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }
    setRemarksError('');
    addApproval({
      payroll_run_id: payrollRun.id,
      chain_level_id: pendingLevel?.id,
      status,
      remarks,
    });
  };

  const handleOpenSalarySheet = async () => {
    setIsLoadingSalarySheet(true);
    setOpenSalarySheetDialog(true);

    try {
      const previewResponse = await humanResourcesServices.previewPayrollRun({
        id: payrollRun.id,
      });
      const previewRows =
        previewResponse?.data?.rows || previewResponse?.rows || [];

      const salaryRows = previewRows.map((row: any) => {
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
        const monthName =
          monthIndex && monthIndex >= 1 && monthIndex <= 12
            ? monthNames[monthIndex - 1]
            : '';
        const year = payrollRun.payroll_period.year || '';
        periodLabel = `${monthName} ${year} - ${periodLabel}`;
      }

      setSalarySheetData({
        rows: salaryRows,
        periodLabel: periodLabel,
      });

      setIsLoadingSalarySheet(false);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Something went wrong', {
        variant: 'error',
      });
      setIsLoadingSalarySheet(false);
      setOpenSalarySheetDialog(false);
    }
  };

  return (
    <>
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setIsEditMode(false);
          setRemarks('');
          setRemarksError('');
        }}
        fullWidth
        maxWidth='lg'
        fullScreen={belowLargeScreen}
        scroll={belowLargeScreen ? 'body' : 'paper'}
      >
        <DialogTitle>
          Payroll Approval {isEditMode ? '— Edit' : '— Next Level'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Always show summary/preview section */}
            <Alert severity='info'>
              {isEditMode ? 'Editing Approval' : 'Pending level:'} {' '}
              {isEditMode ? '' : pendingLevel?.name || pendingLevel?.level_name || 'Next level'}
            </Alert>

            {/* Summary Section */}
            <Stack
              direction='row'
              spacing={1}
              alignItems='flex-start'
              justifyContent='space-between'
              sx={{ py: 1 }}
            >
              <Stack flex={1}>
                {(() => {
                  const summary = calculateSummaryFromPayslips(
                    payrollRun.payslips
                  );
                  return (
                    <SummaryTab
                      basic_salary={summary.basic_salary}
                      employees={summary.employees_count}
                      gross_salary={summary.gross_salary}
                      net_salary={summary.net_salary}
                      paye={summary.paye}
                      total_allowances={summary.total_allowances}
                      total_deductions={summary.total_deductions}
                    />
                  );
                })()}
              </Stack>
              <Tooltip title='Preview Salary Sheet'>
                <IconButton
                  onClick={handleOpenSalarySheet}
                  disabled={isLoadingSalarySheet}
                  color='info'
                  size='small'
                  sx={{ mt: 1 }}
                >
                  {isLoadingSalarySheet ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PreviewOutlined />
                  )}
                </IconButton>
              </Tooltip>
            </Stack>

            <TextField
              label='Remarks'
              size='small'
              fullWidth
              multiline
              minRows={2}
              value={remarks}
              error={!!remarksError}
              helperText={remarksError}
              onChange={(e: any) => {
                setRemarksError('');
                setRemarks(e.target.value);
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setIsEditMode(false);
              setRemarks('');
              setRemarksError('');
              setEditStatus('approved');
            }}
            disabled={isAdding || isUpdating}
          >
            Cancel
          </Button>
          <LoadingButton
            loading={isAdding || isUpdating}
            variant='contained'
            color='error'
            size='small'
            onClick={() => handleDecisionClick('rejected')}
          >
            Reject
          </LoadingButton>
          <LoadingButton
            loading={isAdding || isUpdating}
            variant='contained'
            size='small'
            onClick={() => handleDecisionClick('on hold')}
          >
            Hold
          </LoadingButton>
          <LoadingButton
            loading={isAdding || isUpdating}
            variant='contained'
            color='success'
            size='small'
            onClick={() => handleDecisionClick('approved')}
          >
            Approve
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Salary Sheet Dialog */}
      {salarySheetData && isLoadingSalarySheet ? (
        <Dialog open fullWidth>
          <LinearProgress />
        </Dialog>
      ) : (
        salarySheetData && (
          <SalarySheetDialog
            open={openSalarySheetDialog}
            onClose={() => {
              setOpenSalarySheetDialog(false);
              setSalarySheetData(null);
            }}
            periodLabel={salarySheetData.periodLabel}
            rows={salarySheetData.rows}
            isLoading={isLoadingSalarySheet}
          />
        )
      )}

      <Tooltip title='Preview'>
        <IconButton
          onClick={handleOpenSalarySheet}
          disabled={isLoadingSalarySheet}
          color='info'
          size='small'
        >
          {isLoadingSalarySheet ? (
            <CircularProgress size={20} />
          ) : (
            <PreviewOutlined />
          )}
        </IconButton>
      </Tooltip>

      {canEdit && (
        <Tooltip title='Edit'>
          <IconButton
            onClick={() => {
              setRemarks(approval?.remarks || '');
              setEditStatus((approval?.status || 'approved') as any);
              setIsEditMode(true);
              setOpenDialog(true);
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canNextApprove && (
        <Tooltip title='Approve'>
          <IconButton
            onClick={() => {
              setRemarks('');
              setOpenDialog(true);
            }}
          >
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}

      {canDelete && (
        <Tooltip title='Delete'>
          <IconButton onClick={handleDelete} disabled={isDeleting}>
            <DeleteOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default PayrollApprovalItemAction;
