'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { MenuItemProps } from '@jumbo/types';
import {
  AccountBalanceWalletOutlined,
  CheckCircleOutline,
  DeleteOutlined,
  MoreHorizOutlined,
  PaidOutlined,
  PreviewOutlined,
  ReceiptLongOutlined,
  SendOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollRunType } from './PayrollRunType';

const money = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getErrorMessage = (error: any) => {
  const validationErrors = error?.response?.data?.validation_errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const first = Object.values(validationErrors)[0] as any;
    return Array.isArray(first) ? first[0] : String(first);
  }

  return error?.response?.data?.message || error?.message || 'Something went wrong';
};

const getPendingPayrollLevel = (payrollRun: PayrollRunType) => {
  const levels = payrollRun.approval_chain?.levels || [];
  const approvedLevelIds = new Set(
    (payrollRun.approvals || [])
      .filter((approval) => approval.status === 'approved')
      .map((approval) => Number(approval.chain_level_id || approval.approval_chain_level_id))
  );

  return levels.find((level) => !approvedLevelIds.has(Number(level.id))) || levels[0];
};

const PayrollRunItemAction = ({ payrollRun }: { payrollRun: PayrollRunType }) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const router = useRouter();
  const lang = useLanguage();
  const [preview, setPreview] = useState<any | null>(null);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openChainApprovalDialog, setOpenChainApprovalDialog] = useState(false);
  const [chainStatus, setChainStatus] = useState<'approved' | 'rejected' | 'on hold'>('approved');
  const [chainRemarks, setChainRemarks] = useState('');
  const [postForm, setPostForm] = useState({
    salary_expense_ledger_id: 0,
    paye_payable_ledger_id: 0,
    fallback_payable_ledger_id: 0,
  });
  const [payForm, setPayForm] = useState({ credit_ledger_id: 0 });

  const invalidatePayrollRunQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
    queryClient.invalidateQueries({ queryKey: ['payrollRunsForPeriod', String(payrollRun.payroll_period_id)] });
    queryClient.invalidateQueries({ queryKey: ['showPayrollRun', payrollRun.id] });
  };

  const { mutate: finalizePayrollRun } = useMutation({
    mutationFn: humanResourcesServices.finalizePayrollRun,
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll Run Finalized Successfully', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const { mutate: previewPayrollRun, isPending: isPreviewing } = useMutation({
    mutationFn: () => humanResourcesServices.previewPayrollRun({ id: payrollRun.id }),
    onSuccess: (response) => {
      setPreview(response?.data || response);
      setOpenPreviewDialog(true);
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: submitPayrollRun, isPending: isSubmitting } = useMutation({
    mutationFn: () => humanResourcesServices.submitPayrollRun({ id: payrollRun.id }),
    onSuccess: (response: any) => {
      invalidatePayrollRunQueries();
      enqueueSnackbar(response?.message || 'Payroll submitted for approval', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: approvePayrollRun, isPending: isApproving } = useMutation({
    mutationFn: () => humanResourcesServices.approvePayrollRun(payrollRun.id),
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll run approved', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: approveChainPayrollRun, isPending: isApprovingChain } = useMutation({
    mutationFn: () =>
      humanResourcesServices.addPayrollRunApproval({
        payroll_run_id: payrollRun.id,
        chain_level_id: getPendingPayrollLevel(payrollRun)?.id,
        status: chainStatus,
        remarks: chainRemarks,
      }),
    onSuccess: () => {
      setOpenChainApprovalDialog(false);
      setChainStatus('approved');
      setChainRemarks('');
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll approval recorded', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: postTransactions, isPending: isPosting } = useMutation({
    mutationFn: () => humanResourcesServices.postPayrollRunTransactions({ id: payrollRun.id, ...postForm }),
    onSuccess: (response: any) => {
      setOpenPostDialog(false);
      invalidatePayrollRunQueries();
      enqueueSnackbar(
        response?.journal_voucher?.voucher_no
          ? `Payroll posted: ${response.journal_voucher.voucher_no}`
          : 'Payroll transactions posted',
        { variant: 'success' }
      );
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: payPayrollRun, isPending: isPaying } = useMutation({
    mutationFn: () => humanResourcesServices.payPayrollRun({ id: payrollRun.id, ...payForm }),
    onSuccess: (response: any) => {
      setOpenPayDialog(false);
      invalidatePayrollRunQueries();
      enqueueSnackbar(
        response?.payment?.voucher_no
          ? `Payroll paid: ${response.payment.voucher_no}`
          : 'Payroll run paid',
        { variant: 'success' }
      );
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const { mutate: deletePayrollRun } = useMutation({
    mutationFn: humanResourcesServices.deletePayrollRun,
    onSuccess: () => {
      invalidatePayrollRunQueries();
      enqueueSnackbar('Payroll run deleted', { variant: 'success' });
    },
    onError: (error: any) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const status = (payrollRun.status || '').toLowerCase();
  const hasApprovalChain = Boolean(payrollRun.approval_chain_id || payrollRun.approval_chain);
  const isFinalized = status === 'finalized';
  const isDraft = status === 'draft' || !status;
  const isSubmitted = status === 'submitted';
  const isApproved = status === 'approved';
  const isPosted = status === 'posted';

  const previewRows = useMemo(() => {
    const rows = preview?.rows || preview?.data?.rows || [];
    return Array.isArray(rows) ? rows : [];
  }, [preview]);

  const menuItems = [
    {
      icon: <ReceiptLongOutlined color='primary' />,
      title: 'Full Payslip Detail',
      action: 'viewPayslip',
    },
    ...(isDraft
      ? [
          {
            icon: <PreviewOutlined color='primary' />,
            title: 'Preview Salary Sheet',
            action: 'preview',
          },
          {
            icon: <SendOutlined color='primary' />,
            title: 'Submit',
            action: 'submit',
          },
          {
            icon: <DeleteOutlined color='error' />,
            title: 'Delete Draft',
            action: 'delete',
          },
        ]
      : []),
    ...(isSubmitted
      ? [
          {
            icon: <CheckCircleOutline color='success' />,
            title: hasApprovalChain ? 'Approve Level' : 'Approve',
            action: hasApprovalChain ? 'chainApprove' : 'approve',
          },
        ]
      : []),
    ...(isApproved
      ? [
          {
            icon: <AccountBalanceWalletOutlined color='primary' />,
            title: 'Post Transactions',
            action: 'post',
          },
        ]
      : []),
    ...(isPosted
      ? [
          {
            icon: <PaidOutlined color='success' />,
            title: 'Pay Employees',
            action: 'pay',
          },
        ]
      : []),
    ...(!isFinalized && !['draft', 'submitted', 'approved', 'posted', 'paid'].includes(status)
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
        router.push(`/${lang}/humanResources/payroll/${payrollRun.payroll_period_id}?run_id=${payrollRun.id}`);
        break;
      case 'preview':
        previewPayrollRun();
        break;
      case 'submit':
        showDialog({
          title: 'Submit Payroll Run',
          content: 'Submit this payroll run and save payslips for approval?',
          onYes: () => {
            hideDialog();
            submitPayrollRun();
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'approve':
        showDialog({
          title: 'Approve Payroll Run',
          content: 'Approve this payroll run directly?',
          onYes: () => {
            hideDialog();
            approvePayrollRun();
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      case 'chainApprove':
        setOpenChainApprovalDialog(true);
        break;
      case 'post':
        setOpenPostDialog(true);
        break;
      case 'pay':
        setOpenPayDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Delete Payroll Run',
          content: 'Delete this draft payroll run?',
          onYes: () => {
            hideDialog();
            deletePayrollRun(payrollRun.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
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
    <>
      {(isPreviewing || isSubmitting || isApproving) && <LinearProgress />}
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined fontSize='small' />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />

      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)} fullWidth maxWidth='lg'>
        <DialogTitle>Salary Sheet Preview</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>
            Preview is calculated live. Payslips are saved only after Submit.
          </Alert>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell align='right'>Basic</TableCell>
                  <TableCell align='right'>Gross</TableCell>
                  <TableCell align='right'>PAYE</TableCell>
                  <TableCell align='right'>Deductions</TableCell>
                  <TableCell align='right'>Net</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row: any, index: number) => (
                  <TableRow key={`${row?.employee?.id || index}`}>
                    <TableCell>
                      <Typography variant='body2'>{row?.employee?.name || '-'}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {row?.employee?.employee_number || ''}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>{money(row?.basic_salary)}</TableCell>
                    <TableCell align='right'>{money(row?.gross_salary)}</TableCell>
                    <TableCell align='right'>{money(row?.paye)}</TableCell>
                    <TableCell align='right'>{money(row?.total_deductions)}</TableCell>
                    <TableCell align='right'>{money(row?.net_salary)}</TableCell>
                  </TableRow>
                ))}
                {!previewRows.length && (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>No preview rows returned.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreviewDialog(false)}>Close</Button>
          {isDraft && (
            <Button variant='contained' onClick={() => submitPayrollRun()} disabled={isSubmitting}>
              Submit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={openChainApprovalDialog} onClose={() => setOpenChainApprovalDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Payroll Approval</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity='info'>
              Pending level: {getPendingPayrollLevel(payrollRun)?.name || getPendingPayrollLevel(payrollRun)?.level_name || 'Next level'}
            </Alert>
            <TextField
              select
              SelectProps={{ native: true }}
              label='Decision'
              size='small'
              value={chainStatus}
              onChange={(event) => setChainStatus(event.target.value as any)}
            >
              <option value='approved'>Approved</option>
              <option value='rejected'>Rejected</option>
              <option value='on hold'>On Hold</option>
            </TextField>
            <TextField
              label='Remarks'
              size='small'
              multiline
              minRows={2}
              value={chainRemarks}
              onChange={(event) => setChainRemarks(event.target.value)}
              helperText={chainStatus === 'approved' ? 'Optional for approvals' : 'Required unless approving'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChainApprovalDialog(false)} disabled={isApprovingChain}>Cancel</Button>
          <Button
            variant='contained'
            onClick={() => approveChainPayrollRun()}
            disabled={isApprovingChain || !getPendingPayrollLevel(payrollRun)?.id}
          >
            Save Decision
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPostDialog} onClose={() => setOpenPostDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Post Payroll Transactions</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant='body2' color='text.secondary'>
              Posting records payroll in the general ledger. It does not pay employees yet.
            </Typography>
            <LedgerSelect
              label='Salary Expense Account'
              onChange={(ledger: any) => setPostForm((state) => ({ ...state, salary_expense_ledger_id: ledger?.id || 0 }))}
            />
            <LedgerSelect
              label='PAYE Payable Account'
              onChange={(ledger: any) => setPostForm((state) => ({ ...state, paye_payable_ledger_id: ledger?.id || 0 }))}
            />
            <LedgerSelect
              label='Fallback Employee Payable Account'
              onChange={(ledger: any) => setPostForm((state) => ({ ...state, fallback_payable_ledger_id: ledger?.id || 0 }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPostDialog(false)} disabled={isPosting}>Cancel</Button>
          <Button
            variant='contained'
            onClick={() => postTransactions()}
            disabled={
              isPosting ||
              !postForm.salary_expense_ledger_id ||
              !postForm.paye_payable_ledger_id ||
              !postForm.fallback_payable_ledger_id
            }
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPayDialog} onClose={() => setOpenPayDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Pay Employees</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant='body2' color='text.secondary'>
              Select the bank or cash account the payroll payment will come from.
            </Typography>
            <LedgerSelect
              label='Bank or Cash Account'
              onChange={(ledger: any) => setPayForm({ credit_ledger_id: ledger?.id || 0 })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayDialog(false)} disabled={isPaying}>Cancel</Button>
          <Button variant='contained' color='success' onClick={() => payPayrollRun()} disabled={isPaying || !payForm.credit_ledger_id}>
            Pay
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PayrollRunItemAction;
