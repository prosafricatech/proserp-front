'use client';

import { Stack, Tooltip, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography, Alert } from '@mui/material';
import {
  SendOutlined,
  DeleteOutlined,
  CheckCircleOutline,
  PaidOutlined,
  ReceiptLongOutlined,
  PreviewOutlined,
} from '@mui/icons-material';
import { useState } from 'react';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { useQuery } from '@tanstack/react-query';
import humanResourcesServices from '../humanResourcesServices';
import { getPayslipCalculations, PayslipComputed } from './payslipCalculations';
import SalarySheetDialog from '../payrollPeriods/SalarySheetDialog';

interface PayrollRunActionsProps {
  isDraft: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isPosted: boolean;
  isPaid: boolean;
  hasChain: boolean;
  payrollRunId: number;
  onAction: (action: string, data?: any) => void;
  isSubmitting: boolean;
  isDeleting: boolean;
  isApproving: boolean;
  isPosting: boolean;
  isPaying: boolean;
  runLabel?: string;
  payrollRun?: any;
  previewRows?: any[]; // Add previewRows prop
}

interface PostFormData {
  salary_expense_ledger_id: number;
  paye_payable_ledger_id: number;
  fallback_payable_ledger_id: number;
}

interface PayFormData {
  credit_ledger_id: number;
}

interface ConfirmDialogState {
  open: boolean;
  action: string | null;
  title: string;
  message: string;
  confirmText: string;
  color: 'primary' | 'success' | 'error' | 'warning' | 'info';
}

type SalaryTypeItem = {
  id?: number;
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  computation_method?: string;
  default_value?: number;
};

type SalarySheetRow = {
  run: any;
  computed: PayslipComputed;
};

export const PayrollRunActions = ({
  isDraft,
  isSubmitted,
  isApproved,
  isPosted,
  isPaid,
  hasChain,
  payrollRunId,
  onAction,
  isSubmitting,
  isDeleting,
  isApproving,
  isPosting,
  isPaying,
  runLabel = 'this run',
  payrollRun,
  previewRows = [], // Default to empty array
}: PayrollRunActionsProps) => {
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const [postForm, setPostForm] = useState<PostFormData>({
    salary_expense_ledger_id: 0,
    paye_payable_ledger_id: 0,
    fallback_payable_ledger_id: 0,
  });
  const [payForm, setPayForm] = useState<PayFormData>({
    credit_ledger_id: 0,
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    title: '',
    message: '',
    confirmText: '',
    color: 'primary',
  });

  // Fetch run details for salary sheet (fallback if previewRows not provided)
  const { data: runDetails, isLoading: isLoadingRun } = useQuery({
    queryKey: ['payrollRunDetails', payrollRunId],
    queryFn: () => humanResourcesServices.showPayrollRun(payrollRunId),
    enabled: openSalarySheetDialog && previewRows.length === 0,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch allowance types
  const { data: allowanceTypes } = useQuery({
    queryKey: ['allowanceTypes'],
    queryFn: async () => {
      const response = await humanResourcesServices.getAllowanceTypesList();
      return response?.data || [];
    },
    enabled: openSalarySheetDialog,
  });

  // Fetch deduction types
  const { data: deductionTypes } = useQuery({
    queryKey: ['deductionTypes'],
    queryFn: async () => {
      const response = await humanResourcesServices.getDeductionTypesList();
      return response?.data || [];
    },
    enabled: openSalarySheetDialog,
  });

  // Fetch employer contribution types
  const { data: contributionTypes } = useQuery({
    queryKey: ['employerContributionTypes'],
    queryFn: async () => {
      const response = await humanResourcesServices.getEmployerContributionTypesList();
      return response?.data || [];
    },
    enabled: openSalarySheetDialog,
  });

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'preview':
        setOpenSalarySheetDialog(true);
        break;
      case 'submit':
        setConfirmDialog({
          open: true,
          action: 'submit',
          title: 'Submit Payroll Run',
          message: `Are you sure you want to submit "${runLabel}" for approval? This will save all payslips.`,
          confirmText: 'Submit',
          color: 'primary',
        });
        break;
      case 'delete':
        setConfirmDialog({
          open: true,
          action: 'delete',
          title: 'Delete Payroll Run',
          message: `Are you sure you want to delete "${runLabel}"? This action cannot be undone.`,
          confirmText: 'Delete',
          color: 'error',
        });
        break;
      case 'approve':
        setConfirmDialog({
          open: true,
          action: 'approve',
          title: hasChain ? 'Approve Level' : 'Approve Payroll Run',
          message: hasChain 
            ? `Are you sure you want to approve this level for "${runLabel}"?`
            : `Are you sure you want to approve "${runLabel}"? This action cannot be undone.`,
          confirmText: 'Approve',
          color: 'success',
        });
        break;
      case 'post':
        setOpenPostDialog(true);
        break;
      case 'pay':
        setOpenPayDialog(true);
        break;
      default:
        break;
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action) {
      onAction(confirmDialog.action);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleCloseConfirm = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handlePostConfirm = () => {
    onAction('post', postForm);
    setOpenPostDialog(false);
    setPostForm({
      salary_expense_ledger_id: 0,
      paye_payable_ledger_id: 0,
      fallback_payable_ledger_id: 0,
    });
  };

  const handlePayConfirm = () => {
    onAction('pay', payForm);
    setOpenPayDialog(false);
    setPayForm({ credit_ledger_id: 0 });
  };

  const isPostFormValid = 
    postForm.salary_expense_ledger_id > 0 &&
    postForm.paye_payable_ledger_id > 0 &&
    postForm.fallback_payable_ledger_id > 0;

  const isPayFormValid = payForm.credit_ledger_id > 0;

  // Prepare salary sheet data - use previewRows if available, otherwise use runDetails
  const salarySheetRows: SalarySheetRow[] = [];
  let periodLabel = '';

  // If we have previewRows, use them directly
  if (previewRows.length > 0) {
    previewRows.forEach((row: any) => {
      // Create a run object from the preview row
      const run = {
        ...payrollRun,
        id: payrollRun?.id || row.employee_id,
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
      
      salarySheetRows.push({
        run: run,
        computed: getPayslipCalculations(run),
      });
    });

    // Get period label from payrollRun or use default
    if (payrollRun?.payroll_period) {
      const period = payrollRun.payroll_period;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      periodLabel = `${monthNames[period.month - 1]} ${period.year}`;
    } else {
      periodLabel = runLabel || 'Payroll Run';
    }
  } 
  // Fallback: use runDetails if no previewRows
  else if (runDetails) {
    const run = runDetails?.data || runDetails;
    const runData = Array.isArray(run) ? run : [run];
    
    runData.forEach((r: any) => {
      if (r) {
        salarySheetRows.push({
          run: r,
          computed: getPayslipCalculations(r),
        });
      }
    });

    if (runData.length > 0 && runData[0]?.payroll_period) {
      const period = runData[0].payroll_period;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      periodLabel = `${monthNames[period.month - 1]} ${period.year}`;
    } else {
      periodLabel = runLabel || 'Payroll Run';
    }
  }

  const displayRows = salarySheetRows.length > 0 ? salarySheetRows : [];
  const displayLabel = periodLabel || runLabel || 'Payroll Run';

  return (
    <>
      <Stack direction="row" spacing={1} mb={2} justifyContent="flex-end" alignItems="center" flexWrap="wrap" useFlexGap>
        {/* 1. PREVIEW - Always visible */}
        <Tooltip title="Preview Salary Sheet">
          <IconButton 
            size="small" 
            onClick={() => handleActionClick('preview')} 
            disabled={isLoadingRun}
            color="info"
          >
            {isLoadingRun ? <CircularProgress size={18} /> : <PreviewOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* 2. SUBMIT - For draft runs */}
        {isDraft && (
          <Tooltip title="Submit for Approval">
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('submit')} 
              disabled={isSubmitting} 
              color="primary"
            >
              {isSubmitting ? <CircularProgress size={18} /> : <SendOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {/* 3. APPROVE - For submitted runs */}
        {isSubmitted && (
          <Tooltip title={hasChain ? 'Approve Level' : 'Approve'}>
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('approve')} 
              disabled={isApproving} 
              color="success"
            >
              {isApproving ? <CircularProgress size={18} /> : <CheckCircleOutline fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {/* 4. POST PAYROLL TRANSACTIONS - For approved runs */}
        {isApproved && (
          <Tooltip title="Post Payroll Transactions">
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('post')} 
              disabled={isPosting} 
              color="primary"
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
              }}
            >
              {isPosting ? <CircularProgress size={18} color="inherit" /> : <ReceiptLongOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {/* 5. PAY EMPLOYEES - For posted runs */}
        {isPosted && !isPaid && (
          <Tooltip title="Pay Employees">
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('pay')} 
              disabled={isPaying} 
              color="success"
              sx={{ 
                bgcolor: 'success.main', 
                color: 'white',
                '&:hover': { bgcolor: 'success.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
              }}
            >
              {isPaying ? <CircularProgress size={18} color="inherit" /> : <PaidOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {/* 6. PAID - Status indicator */}
        {isPaid && (
          <Tooltip title="Paid">
            <IconButton size="small" color="success" disabled>
              <PaidOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* 7. DELETE - For draft runs */}
        {isDraft && (
          <Tooltip title="Delete Run">
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('delete')} 
              disabled={isDeleting} 
              color="error"
            >
              {isDeleting ? <CircularProgress size={18} /> : <DeleteOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Salary Sheet Dialog */}
      {openSalarySheetDialog && (
        <SalarySheetDialog
          open={openSalarySheetDialog}
          onClose={() => setOpenSalarySheetDialog(false)}
          periodLabel={displayLabel}
          rows={displayRows}
          allowanceTypes={allowanceTypes || []}
          deductionTypes={deductionTypes || []}
          contributionTypes={contributionTypes || []}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight={600}>
            {confirmDialog.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseConfirm} 
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmDialog.color}
            size="small"
            onClick={handleConfirmAction}
            disabled={
              (confirmDialog.action === 'submit' && isSubmitting) ||
              (confirmDialog.action === 'delete' && isDeleting) ||
              (confirmDialog.action === 'approve' && isApproving)
            }
          >
            {(confirmDialog.action === 'submit' && isSubmitting) ||
            (confirmDialog.action === 'delete' && isDeleting) ||
            (confirmDialog.action === 'approve' && isApproving) ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              confirmDialog.confirmText
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Transactions Dialog */}
      <Dialog
        open={openPostDialog}
        onClose={() => setOpenPostDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight={600}>
            Post Payroll Transactions
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Posting records payroll in the general ledger. It does not pay employees yet.
            </Alert>
            
            <LedgerSelect
              label="Salary Expense Account"
              allowedGroups={['Expenses']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  salary_expense_ledger_id: ledger?.id || 0,
                }))
              }
            />
            
            <LedgerSelect
              label="PAYE Payable Account"
              allowedGroups={['Accounts Payable']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  paye_payable_ledger_id: ledger?.id || 0,
                }))
              }
            />
            
            <LedgerSelect
              label="Fallback Employee Payable Account"
              allowedGroups={['Accounts Payable']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  fallback_payable_ledger_id: ledger?.id || 0,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenPostDialog(false)} 
            variant="outlined"
            size="small"
            disabled={isPosting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handlePostConfirm}
            disabled={isPosting || !isPostFormValid}
          >
            {isPosting ? <CircularProgress size={18} /> : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pay Employees Dialog */}
      <Dialog
        open={openPayDialog}
        onClose={() => setOpenPayDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight={600}>
            Pay Employees
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Select the bank or cash account the payroll payment will come from.
            </Alert>
            
            <LedgerSelect
              label="Bank or Cash Account"
              onChange={(ledger: any) =>
                setPayForm({ credit_ledger_id: ledger?.id || 0 })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenPayDialog(false)} 
            variant="outlined"
            size="small"
            disabled={isPaying}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handlePayConfirm}
            disabled={isPaying || !isPayFormValid}
          >
            {isPaying ? <CircularProgress size={18} /> : 'Pay Employees'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};