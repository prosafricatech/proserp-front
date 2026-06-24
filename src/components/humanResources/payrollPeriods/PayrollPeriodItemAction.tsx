'use client';

import { DeleteOutlined, EditOutlined } from '@mui/icons-material';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { lazy, useState } from 'react';
import humanResourcesServices from '../humanResourcesServices';
import { PayrollPeriodType } from './PayrollPeriodType';

const PayrollPeriodForm = lazy(() => import('./PayrollPeriodForm'));

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

  // Delete mutation
  const { mutate: deletePeriod, isPending: isDeleting } = useMutation({
    mutationFn: () => humanResourcesServices.deletePayrollPeriod(payrollPeriod.id),
    onSuccess: () => {
      enqueueSnackbar('Payroll period deleted successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['payrollPeriods'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete period';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleDelete = () => {
    if (hasRuns) {
      enqueueSnackbar('Cannot delete period with existing runs', { variant: 'error' });
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
        maxWidth="sm"
        fullScreen={belowLargeScreen}
      >
        <PayrollPeriodForm
          setOpenDialog={setOpenEditDialog}
          payrollPeriod={payrollPeriod}
        />
      </Dialog>

      {canEdit && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => setOpenEditDialog(true)}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {!hasRuns && (
        <Tooltip title="Delete">
          <IconButton size="small" onClick={handleDelete} color="error" disabled={isDeleting}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default PayrollPeriodItemAction;