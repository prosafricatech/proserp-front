'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  FactCheckOutlined,
  HighlightOff,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import ImprestRetirementApprovalForm from './form/ImprestRetirementApprovalForm';
import ImprestRetirementForm from './form/ImprestRetirementForm';
import ImprestRetirementOnScreenPreview from './preview/ImprestRetirementOnScreenPreview';
import ImprestRetirementPDF from './preview/ImprestRetirementPDF';

dayjs.extend(isSameOrAfter);

type ImprestRetirementItemActionProps = {
  retirement: any;
  approvedRequisition?: any;
  isExpanded: boolean;
};

const isTruthyFlag = (value: any) =>
  value === true || value === 1 || String(value || '').toLowerCase() === 'true';
const normalizeStatus = (value: any) => String(value || '').toLowerCase();

function ImprestRetirementItemAction({
  retirement,
  approvedRequisition,
  isExpanded,
}: ImprestRetirementItemActionProps) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const { hasOrganizationRole, authOrganization } = useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const organization = authOrganization?.organization;

  const [openUpdateDialog, setOpenUpdateDialog] = React.useState(false);
  const [openApprovalDialog, setOpenApprovalDialog] = React.useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
  const [showOnScreen, setShowOnScreen] = useState(true);

  const { data: retirementDetails, isFetching: isFetchingRetirementDetails } =
    useQuery({
      queryKey: [
        'imprestRetirementDetails',
        { id: retirement?.id },
        'imprest-retirement-item-action',
      ],
      queryFn: async () => imprestRetirementServices.show(retirement?.id),
      enabled:
        !!retirement?.id &&
        (isExpanded ||
          !!openUpdateDialog ||
          !!openApprovalDialog ||
          !!openPreviewDialog),
    });

  const currentApproval =
    retirementDetails?.latest_approval ||
    retirementDetails?.approval ||
    retirement?.latest_approval ||
    null;

  const statusRaw = normalizeStatus(
    currentApproval?.status || retirementDetails?.status || retirement?.status
  );
  const statusLabelRaw = normalizeStatus(
    currentApproval?.status_label ||
      retirementDetails?.status_label ||
      retirement?.status_label
  );
  const approvalStatusRaw = normalizeStatus(currentApproval?.status);
  const approvalStatusLabelRaw = normalizeStatus(currentApproval?.status_label);
  const isFinalApproval = isTruthyFlag(currentApproval?.is_final);

  const isOnHold =
    approvalStatusRaw === 'on hold' ||
    statusLabelRaw.includes('on hold') ||
    approvalStatusLabelRaw.includes('on hold');
  const isRejected =
    approvalStatusRaw === 'rejected' ||
    statusLabelRaw.includes('rejected') ||
    approvalStatusLabelRaw.includes('rejected');
  const isApproved =
    approvalStatusRaw === 'approved' ||
    statusLabelRaw.includes('approved') ||
    approvalStatusLabelRaw.includes('approved') ||
    isFinalApproval;
  const isPendingApproval =
    !isFinalApproval &&
    !isOnHold &&
    !isRejected &&
    !isApproved &&
    statusRaw === 'submitted' &&
    (approvalStatusRaw === 'pending' ||
      !approvalStatusRaw ||
      statusLabelRaw.includes('pending'));

  const nextApprovalLevel =
    retirementDetails?.next_approval_level || retirement?.next_approval_level;
  const approvalsCount = retirementDetails?.approvals?.length ?? 0;
  const canApproveNext =
    Boolean(nextApprovalLevel?.id) &&
    hasOrganizationRole(nextApprovalLevel?.role?.name ?? '') &&
    !isFinalApproval &&
    !isOnHold &&
    !isRejected &&
    (isPendingApproval || isApproved || approvalsCount === 0);

  const canEditOrDeleteRetirement =
    approvalsCount === 0 &&
    dayjs(
      retirementDetails?.retirement_date || retirement?.retirement_date
    ).isSameOrAfter(dayjs().startOf('day'));

  const { mutate: deleteRetirement } = useMutation({
    mutationFn: imprestRetirementServices.delete,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement draft deleted', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete retirement draft',
        {
          variant: 'error',
        }
      );
    },
  });

  const handleDeleteDraft = () => {
    showDialog({
      title: 'Delete Draft',
      content: `Delete draft ${retirementDetails?.retirementNo || `#${retirementDetails?.id}`}?`,
      variant: 'confirm',
      onYes: async () => {
        hideDialog();
        await deleteRetirement(retirementDetails?.id);
      },
      onNo: () => hideDialog(),
    });
  };

  const showEdit = canEditOrDeleteRetirement;
  const showApprove = canApproveNext && approvalsCount === 0;
  const showDelete = canEditOrDeleteRetirement;

  const isFetchingDialogDetails = isFetchingRetirementDetails;

  return (
    <>
      <Dialog
        open={openPreviewDialog}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth='md'
        onClose={() => setOpenPreviewDialog(false)}
      >
        {isFetchingDialogDetails ? (
          <LinearProgress />
        ) : (
          <>
            <DialogTitle>
              <PreviewTopBar
                fileExportGrid={
                  <FileExportGrid
                    exportPdf
                    handlePdf={() => {
                      setShowOnScreen((prev) => !prev);
                    }}
                  />
                }
                closeButton={
                  <IconButton
                    size='small'
                    color='primary'
                    onClick={() => setOpenPreviewDialog(false)}
                  >
                    <HighlightOff color='primary' />
                  </IconButton>
                }
              />
            </DialogTitle>
            <DialogContent>
              {showOnScreen ? (
                <ImprestRetirementOnScreenPreview
                  retirement={retirementDetails}
                />
              ) : (
                <PDFContent
                  fileName={
                    retirementDetails?.retirementNo ||
                    `retirement-${retirementDetails?.id || retirement?.id || ''}`
                  }
                  document={
                    <ImprestRetirementPDF
                      retirement={retirementDetails}
                      organization={organization}
                    />
                  }
                />
              )}
            </DialogContent>
            <DialogActions>
              <Box sx={{ textAlign: 'right', marginTop: 1 }}>
                <Button
                  variant='outlined'
                  size='small'
                  color='primary'
                  onClick={() => setOpenPreviewDialog(false)}
                >
                  Close
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={openUpdateDialog}
        maxWidth='lg'
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={() => setOpenUpdateDialog(false)}
      >
        {isFetchingRetirementDetails && !retirementDetails ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementForm
            toggleOpen={setOpenUpdateDialog}
            approvedRequisition={approvedRequisition}
            existingRetirementDetails={retirementDetails}
            preferredRetirementId={retirement?.id}
          />
        )}
      </Dialog>

      <Dialog
        open={openApprovalDialog}
        maxWidth='lg'
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        onClose={() => setOpenApprovalDialog(false)}
      >
        {isFetchingDialogDetails ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementApprovalForm
            toggleOpen={setOpenApprovalDialog}
            retirement={retirementDetails}
            isEdit={false}
          />
        )}
      </Dialog>

      <Tooltip title='Preview Retirement'>
        <IconButton size='small' onClick={() => setOpenPreviewDialog(true)}>
          <VisibilityOutlined />
        </IconButton>
      </Tooltip>

      {showEdit && (
        <Tooltip title='Edit'>
          <IconButton size='small' onClick={() => setOpenUpdateDialog(true)}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {showApprove && (
        <Tooltip title='Approve'>
          <IconButton size='small' onClick={() => setOpenApprovalDialog(true)}>
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}

      {showDelete && (
        <Tooltip title='Delete'>
          <IconButton size='small' onClick={handleDeleteDraft}>
            <DeleteOutlined color='error' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}

export default React.memo(ImprestRetirementItemAction);
