'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { ReplayOutlined, VisibilityOutlined } from '@mui/icons-material';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import PayrollPaymentViewEditDialog from './PayrollPaymentViewEditDialog';
import { formatMoney } from './payrollUtils';

export type PayrollPaymentRow = {
  id: number;
  voucher_no: string;
  transaction_date: string;
  narration: string;
  reference: string;
  amount: number;
  type: 'employee_payment' | 'payable_settlement';
};

/**
 * Shared by both the "Payments" and "Payable Settlements" tabs — same
 * underlying Payment shape either way (see PayrollPostingService::listPayments()),
 * just pre-filtered by the parent. Reverse deletes the Payment + journals and
 * whichever audit-trail row (PayslipPayment/PayrollRunPayableSettlement) points
 * at it, then recomputes the run's paid status — see reversePayment().
 */
const PayrollPaymentsTab = ({
  payments,
  payrollRunId,
  emptyMessage,
  canReverse,
  canEdit,
}: {
  payments: PayrollPaymentRow[];
  payrollRunId: number;
  emptyMessage: string;
  canReverse: boolean;
  canEdit: boolean;
}) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [viewingPaymentId, setViewingPaymentId] = useState<number | null>(
    null
  );

  const {
    mutate: reverse,
    isPending,
    variables: reversingPaymentId,
  } = useMutation({
    mutationFn: (paymentId: number) =>
      humanResourcesServices.reversePayrollRunPayment({
        id: payrollRunId,
        payment_id: paymentId,
      }),
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Payment reversed', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunDetails', payrollRunId],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayments', payrollRunId],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayBalances', payrollRunId],
      });
      queryClient.invalidateQueries({
        queryKey: ['payrollRunPayableSummary', payrollRunId],
      });
    },
    onError: (error: any) =>
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
  });

  const handleReverse = (payment: PayrollPaymentRow) => {
    showDialog({
      title: 'Reverse Payment',
      content: `This deletes ${payment.voucher_no} (${formatMoney(payment.amount)}) and its journals, and adjusts the run's paid status accordingly. Continue?`,
      onYes: () => {
        hideDialog();
        reverse(payment.id);
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  return (
    <>
      <PayrollPaymentViewEditDialog
        open={!!viewingPaymentId}
        onClose={() => setViewingPaymentId(null)}
        payrollRunId={payrollRunId}
        paymentId={viewingPaymentId}
        canEdit={canEdit}
        canRemove={canReverse}
      />

      {payments.length === 0 ? (
        <Typography variant='body2' color='text.secondary' py={2}>
          {emptyMessage}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Voucher</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Narration</TableCell>
                <TableCell align='right' sx={{ fontWeight: 700 }}>
                  Amount
                </TableCell>
                <TableCell align='center' sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>{payment.voucher_no}</TableCell>
                  <TableCell>
                    {readableDate(payment.transaction_date, false)}
                  </TableCell>
                  <TableCell>{payment.narration}</TableCell>
                  <TableCell align='right'>
                    {formatMoney(payment.amount)}
                  </TableCell>
                  <TableCell align='center'>
                    <Tooltip title='View'>
                      <IconButton
                        size='small'
                        onClick={() => setViewingPaymentId(payment.id)}
                      >
                        <VisibilityOutlined color='primary' fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    {canReverse && (
                      <Tooltip title='Reverse'>
                        <IconButton
                          size='small'
                          disabled={
                            isPending && reversingPaymentId === payment.id
                          }
                          onClick={() => handleReverse(payment)}
                        >
                          <ReplayOutlined color='warning' fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default PayrollPaymentsTab;
