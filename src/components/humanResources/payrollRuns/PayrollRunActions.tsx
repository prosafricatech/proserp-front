'use client';

import { Stack, Tooltip, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from '@mui/material';
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
}

interface PostFormData {
  salary_expense_ledger_id: number;
  paye_payable_ledger_id: number;
  fallback_payable_ledger_id: number;
}

interface PayFormData {
  credit_ledger_id: number;
}

const money = (value: number | string | undefined) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
}: PayrollRunActionsProps) => {
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [postForm, setPostForm] = useState<PostFormData>({
    salary_expense_ledger_id: 0,
    paye_payable_ledger_id: 0,
    fallback_payable_ledger_id: 0,
  });
  const [payForm, setPayForm] = useState<PayFormData>({
    credit_ledger_id: 0,
  });

  // Fetch preview data
  const { data: previewData, isLoading: isPreviewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['previewPayrollRunEmployees', payrollRunId],
    queryFn: () => humanResourcesServices.previewPayrollRun({ id: payrollRunId }),
    enabled: false, // Don't fetch on mount, only when preview is clicked
  });

  const previewRows = previewData?.data?.rows || previewData?.rows || [];

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'preview':
        refetchPreview();
        setOpenPreviewDialog(true);
        break;
      case 'submit':
        if (window.confirm(`Are you sure you want to submit "${runLabel}" for approval?`)) {
          onAction('submit');
        }
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${runLabel}"? This action cannot be undone.`)) {
          onAction('delete');
        }
        break;
      case 'approve':
        if (window.confirm(hasChain 
          ? `Are you sure you want to approve this level for "${runLabel}"?`
          : `Are you sure you want to approve "${runLabel}"? This action cannot be undone.`
        )) {
          onAction('approve');
        }
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

  return (
    <>
      <Stack direction="row" spacing={1} mb={2} justifyContent="flex-end" alignItems="center" flexWrap="wrap" useFlexGap>
        {/* 1. PREVIEW - Always visible */}
        <Tooltip title="Preview">
          <IconButton 
            size="small" 
            onClick={() => handleActionClick('preview')} 
            disabled={isPreviewLoading}
          >
            {isPreviewLoading ? <CircularProgress size={18} /> : <PreviewOutlined fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* 2. SUBMIT - For draft runs */}
        {isDraft && (
          <Tooltip title="Submit for Approval">
            <IconButton 
              size="small" 
              onClick={() => handleActionClick('submit')} 
              disabled={isSubmitting} 
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
              sx={{ 
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

      {/* Preview Dialog */}
      <Dialog
        open={openPreviewDialog}
        onClose={() => setOpenPreviewDialog(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight={600}>
            Salary Sheet Preview
          </Typography>
        </DialogTitle>
        <DialogContent>
          {isPreviewLoading ? (
            <LinearProgress />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">Basic</TableCell>
                    <TableCell align="right">Allowances</TableCell>
                    <TableCell align="right">Gross</TableCell>
                    <TableCell align="right">PAYE</TableCell>
                    <TableCell align="right">Deductions</TableCell>
                    <TableCell align="right">Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.length > 0 ? (
                    previewRows.map((row: any, index: number) => (
                      <TableRow key={`${row?.employee?.id || index}`}>
                        <TableCell>
                          <Typography variant="body2">
                            {row?.employee?.name || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row?.employee?.employee_number || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {money(row?.basic_salary)}
                        </TableCell>
                        <TableCell align="right">
                          {money(row?.total_allowances || 0)}
                        </TableCell>
                        <TableCell align="right">
                          {money(row?.gross_salary)}
                        </TableCell>
                        <TableCell align="right">
                          {money(row?.paye || 0)}
                        </TableCell>
                        <TableCell align="right">
                          {money(row?.total_deductions || 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {money(row?.net_salary)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No employees found for this run.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenPreviewDialog(false)} 
            variant="outlined"
            size="small"
          >
            Close
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