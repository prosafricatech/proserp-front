'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { MODULES } from '@/utilities/constants/modules';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import {
  DeleteOutlined,
  DoneAllOutlined,
  MonetizationOnOutlined,
  PreviewOutlined,
  ReceiptLongOutlined,
  SendOutlined,
} from '@mui/icons-material';
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
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import SalarySheetDialog from '../payrollPeriods/SalarySheetDialog';
import BankTransferListDialog from './BankTransferListView/BankTransferListDialog';
import { getPayslipCalculations, PayslipComputed } from './payslipCalculations';
import { SalarySheetType } from './salarySheetType';

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
  isCompleting: boolean;
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
  isCompleting,
  runLabel = 'this run',
  payrollRun,
  previewRows = [], // Default to empty array
}: PayrollRunActionsProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { organizationHasSubscribed } = useJumboAuth();
  const orgHasSubscribedAccountsAndFinance = organizationHasSubscribed(
    MODULES.ACCOUNTS_AND_FINANCE
  );
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [openSalarySheetDialog, setOpenSalarySheetDialog] = useState(false);
  const [isLoadingSalarySheet, setIsLoadingSalarySheet] = useState(false);
  const [salarySheetData, setSalarySheetData] = useState<any>(null);
  const [postForm, setPostForm] = useState<PostFormData>({
    salary_expense_ledger_id: 0,
    paye_payable_ledger_id: 0,
    fallback_payable_ledger_id: 0,
  });
  const [payForm, setPayForm] = useState<PayFormData>({
    credit_ledger_id: 0,
  });
  const [bankTransferList, setBankTransferList] =
    useState<SalarySheetType | null>(null);
  const [loadingBankTransfer, setLoadingBankTransfer] = useState(false);
  const [openBanktransferList, setOpenBanktransferList] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    title: '',
    message: '',
    confirmText: '',
    color: 'primary',
  });

  const handleOpenSalarySheet = async () => {
    setIsLoadingSalarySheet(true);
    setOpenSalarySheetDialog(true);

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

      setSalarySheetData({
        rows: salaryRows,
        // allowanceTypes: allowanceTypes || [],
        // deductionTypes: deductionTypes || [],
        // contributionTypes: contributionTypes || [],
        periodLabel: periodLabel,
      });

      setIsLoadingSalarySheet(false);
    } catch (error: any) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      setIsLoadingSalarySheet(false);
      setOpenSalarySheetDialog(false);
    }
  };

  const handleOpenBankTransferList = async () => {
    setLoadingBankTransfer(true);
    try {
      const response = await humanResourcesServices.bankTransferList(
        payrollRun.id ?? payrollRunId
      );

      if (response) {
        setBankTransferList(response);
      }
      setLoadingBankTransfer(false);
      setOpenBanktransferList(true);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
      setLoadingBankTransfer(false);
    }
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'preview':
        handleOpenSalarySheet();
        break;
      case 'bankTransfer':
        handleOpenBankTransferList();
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
      case 'post':
        setOpenPostDialog(true);
        break;
      case 'pay':
        setOpenPayDialog(true);
        break;
      case 'complete':
        setOpenCompleteDialog(true);
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

  const handleCompleteConfirm = () => {
    onAction('complete');
    setOpenCompleteDialog;
  };

  const isPostFormValid =
    postForm.salary_expense_ledger_id > 0 &&
    postForm.paye_payable_ledger_id > 0 &&
    postForm.fallback_payable_ledger_id > 0;

  const isPayFormValid = payForm.credit_ledger_id > 0;

  const canViewBankTransferList = isApproved || isPosted || isPaid;

  return (
    <>
      <Stack
        direction='row'
        spacing={1}
        mb={2}
        justifyContent='flex-end'
        alignItems='center'
        flexWrap='wrap'
        useFlexGap
      >
        {/* 1. PREVIEW - Always visible */}
        <Tooltip title='Preview Salary Sheet'>
          <IconButton
            size='small'
            onClick={() => handleActionClick('preview')}
            disabled={isLoadingSalarySheet}
            color='info'
          >
            {isLoadingSalarySheet ? (
              <CircularProgress size={18} />
            ) : (
              <PreviewOutlined fontSize='medium' />
            )}
          </IconButton>
        </Tooltip>

        {/* Salaray sheet (basic transfer list) */}
        {canViewBankTransferList && (
          <Tooltip title='View Bank Transfer List'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('bankTransfer')}
              disabled={loadingBankTransfer}
            >
              {loadingBankTransfer ? (
                <CircularProgress size={18} />
              ) : (
                <ReceiptLongOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* 2. SUBMIT - For draft runs */}
        {isDraft && (
          <Tooltip title='Submit for Approval'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('submit')}
              disabled={isSubmitting}
              color='primary'
            >
              {isSubmitting ? (
                <CircularProgress size={18} />
              ) : (
                <SendOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* 4. POST PAYROLL TRANSACTIONS - For approved runs */}
        {isApproved && orgHasSubscribedAccountsAndFinance && (
          <Tooltip title='Post Payroll Transactions'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('post')}
              disabled={isPosting}
              color='primary'
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
              }}
            >
              {isPosting ? (
                <CircularProgress size={18} color='inherit' />
              ) : (
                <ReceiptLongOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* 5. PAY EMPLOYEES - For posted runs */}
        {isPosted && !isPaid && orgHasSubscribedAccountsAndFinance && (
          <Tooltip title='Pay Employees'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('pay')}
              disabled={isPaying}
              color='success'
              sx={{
                color: 'sucess',
              }}
            >
              {isPaying ? (
                <CircularProgress size={18} />
              ) : (
                <MonetizationOnOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* SHOW COMPLETE BUTTON IF NOT SUBSCRIBED TO ACCOUNTS AND FINANCE */}
        {isApproved && !orgHasSubscribedAccountsAndFinance && (
          <Tooltip title='Complete Payroll'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('complete')}
              disabled={isCompleting}
              color='success'
            >
              {isCompleting ? (
                <CircularProgress size={18} color='inherit' />
              ) : (
                <DoneAllOutlined fontSize='small' />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* 7. DELETE - For draft runs */}
        {isDraft && (
          <Tooltip title='Delete Run'>
            <IconButton
              size='small'
              onClick={() => handleActionClick('delete')}
              disabled={isDeleting}
              color='error'
            >
              {isDeleting ? (
                <CircularProgress size={18} />
              ) : (
                <DeleteOutlined fontSize='medium' />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>

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

      {!loadingBankTransfer ? (
        bankTransferList && (
          <BankTransferListDialog
            bankTransfer={bankTransferList}
            open={openBanktransferList}
            setOpen={setOpenBanktransferList}
          />
        )
      ) : (
        <Dialog open fullWidth>
          <LinearProgress />
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' component='div' fontWeight={600}>
            {confirmDialog.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {confirmDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseConfirm} variant='outlined' size='small'>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={confirmDialog.color}
            size='small'
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
              <CircularProgress size={18} color='inherit' />
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
        maxWidth='xs'
      >
        <DialogTitle>
          <Typography variant='h6' component='div' fontWeight={600}>
            Post Payroll Transactions
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity='info' sx={{ mb: 1 }}>
              Posting records payroll in the general ledger. It does not pay
              employees yet.
            </Alert>

            <LedgerSelect
              label='Salary Expense Account'
              allowedGroups={['Expenses']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  salary_expense_ledger_id: ledger?.id || 0,
                }))
              }
            />

            <LedgerSelect
              label='PAYE Payable Account'
              allowedGroups={['Accounts Payable']}
              onChange={(ledger: any) =>
                setPostForm((state) => ({
                  ...state,
                  paye_payable_ledger_id: ledger?.id || 0,
                }))
              }
            />

            <LedgerSelect
              label='Fallback Employee Payable Account'
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
            variant='outlined'
            size='small'
            disabled={isPosting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='primary'
            size='small'
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
        maxWidth='xs'
      >
        <DialogTitle>
          <Typography variant='h6' component='div' fontWeight={600}>
            Pay Employees
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity='info' sx={{ mb: 1 }}>
              Select the bank or cash account the payroll payment will come
              from.
            </Alert>

            <LedgerSelect
              label='Bank or Cash Account'
              onChange={(ledger: any) =>
                setPayForm({ credit_ledger_id: ledger?.id || 0 })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenPayDialog(false)}
            variant='outlined'
            size='small'
            disabled={isPaying}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='success'
            size='small'
            onClick={handlePayConfirm}
            disabled={isPaying || !isPayFormValid}
          >
            {isPaying ? <CircularProgress size={18} /> : 'Pay Employees'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete payroll confirmation Dialog */}
      <Dialog
        open={openCompleteDialog}
        onClose={() => setOpenCompleteDialog(false)}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>
          <Typography variant='h6' component='div' fontWeight={600}>
            Are you sure you want to complete the payroll
          </Typography>
        </DialogTitle>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenCompleteDialog(false)}
            variant='outlined'
            size='small'
            disabled={isCompleting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            size='small'
            onClick={handleCompleteConfirm}
            disabled={isCompleting}
          >
            {isCompleting ? <CircularProgress size={18} /> : 'Complete Payroll'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
