'use client';

import { DeleteOutlined, EditOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useSnackbar } from 'notistack';
import React, { lazy, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PayrollPeriodType } from './PayrollPeriodType';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';

const PayrollPeriodForm = lazy(() => import('./PayrollPeriodForm'));

interface PayrollPeriodItemActionProps {
  payrollPeriod: PayrollPeriodType;
  hasRuns: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

const PayrollPeriodItemAction = ({
  payrollPeriod,
  hasRuns,
  onDelete,
  isDeleting,
}: PayrollPeriodItemActionProps) => {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  const lang = useLanguage();
  const [openEditDialog, setOpenEditDialog] = useState(false);

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
        onDelete();
      },
      onNo: () => hideDialog(),
      variant: 'confirm',
    });
  };

  const handleView = () => {
    router.push(`/${lang}/humanResources/payroll/${payrollPeriod.id}`);
  };

  const handleEdit = () => {
    setOpenEditDialog(true);
  };

  const monthName = new Date(payrollPeriod.year, payrollPeriod.month - 1).toLocaleString(
    'default',
    { month: 'long' }
  );

  return (
    <>
      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth='sm'
        fullScreen={belowLargeScreen}
      >
        <PayrollPeriodForm
          setOpenDialog={setOpenEditDialog}
          payrollPeriod={payrollPeriod}
        />
      </Dialog>

      {/* Edit Button - Only if no runs or period is draft */}
      {(!hasRuns || payrollPeriod.status?.toLowerCase() === 'draft') && (
        <Tooltip title='Edit Period'>
          <IconButton size='small' onClick={handleEdit}>
            <EditOutlined fontSize='small' />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Button - Only if no runs */}
      <Tooltip title={hasRuns ? 'Cannot delete (has runs)' : 'Delete Period'}>
        <span>
          <IconButton
            size='small'
            onClick={handleDelete}
            color='error'
            disabled={hasRuns || isDeleting}
          >
            <DeleteOutlined fontSize='small' />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};

export default PayrollPeriodItemAction;