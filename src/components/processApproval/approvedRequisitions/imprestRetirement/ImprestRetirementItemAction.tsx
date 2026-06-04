'use client';

import React from 'react';
import {
  CheckCircleOutlineOutlined,
  DeleteOutlined,
  EditOutlined,
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
  Grid,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import PDFContent from '@/components/pdf/PDFContent';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import ImprestRetirementForm from './form/ImprestRetirementForm';
import ImprestRetirementApprovalForm from './form/ImprestRetirementApprovalForm';
import ImprestRetirementOnScreenPreview from './preview/ImprestRetirementOnScreenPreview';
import ImprestRetirementPDF from './preview/ImprestRetirementPDF';

type ImprestRetirementItemActionProps = {
  retirement: any;
  approvedRequisition: any;
  isExpanded: boolean;
};

const isTruthyFlag = (value: any) =>
  value === true || value === 1 || String(value || '').toLowerCase() === 'true';

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
  const [activePreviewTab, setActivePreviewTab] = React.useState(0);

  const { data: retirementDetails, isFetching: isFetchingRetirementDetails } = useQuery({
    queryKey: ['imprestRetirementDetails', { id: retirement?.id }, 'imprest-retirement-item-action'],
    queryFn: async () => imprestRetirementServices.show(retirement?.id),
    enabled:
      !!retirement?.id &&
      (isExpanded || !!openUpdateDialog || !!openApprovalDialog || !!openPreviewDialog),
  });

  const currentApproval =
    retirementDetails?.latest_approval ||
    retirementDetails?.approval ||
    retirement?.latest_approval ||
    null;

  const statusRaw = String(currentApproval?.status || retirementDetails?.status || '').toLowerCase();
  const statusLabelRaw = String(
    currentApproval?.status_label || retirementDetails?.status_label || ''
  ).toLowerCase();
  const approvalStatusRaw = String(currentApproval?.status || '').toLowerCase();
  const approvalStatusLabelRaw = String(currentApproval?.status_label || '').toLowerCase();
  const hasFinalApproval = isTruthyFlag(currentApproval?.is_final);

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
    hasFinalApproval;
  const isPendingApproval =
    !hasFinalApproval &&
    !isOnHold &&
    !isRejected &&
    !isApproved &&
    statusRaw === 'submitted' &&
    (approvalStatusRaw === 'pending' || !approvalStatusRaw || statusLabelRaw.includes('pending'));

  const nextApprovalLevel =
    retirementDetails?.next_approval_level || retirement?.next_approval_level;
  const hasNextApprovalLevel = Boolean(nextApprovalLevel?.id);
  const canApproveByRole = hasOrganizationRole(nextApprovalLevel?.role?.name ?? '');
  const canApproveNext =
    hasNextApprovalLevel &&
    canApproveByRole &&
    !hasFinalApproval &&
    !isOnHold &&
    !isRejected &&
    (isPendingApproval || isApproved || retirementDetails?.approvals?.length === 0);

  const canEditOrDeleteRetirement =
    retirementDetails?.approvals?.length === 0 &&
    dayjs(retirement?.retirement_date).isSameOrAfter(dayjs().startOf('day'));

  const { mutate: deleteRetirement } = useMutation({
    mutationFn: imprestRetirementServices.delete,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement draft deleted', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete retirement draft', {
        variant: 'error',
      });
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

  const showPreview = true;
  const showEdit = canEditOrDeleteRetirement;
  const showApprove = canApproveNext && retirementDetails?.approvals?.length === 0;
  const showDelete = canEditOrDeleteRetirement;

  if (!showPreview && !showEdit && !showApprove && !showDelete) return null;

  const isFetchingDialogDetails = isFetchingRetirementDetails;

  return (
    <>
      <Dialog
        open={openPreviewDialog}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth="md"
        onClose={() => setOpenPreviewDialog(false)}
      >
        {isFetchingDialogDetails ? (
          <LinearProgress />
        ) : (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 11 }}>
                  <Tabs
                    value={activePreviewTab}
                    onChange={(_event: React.SyntheticEvent, newValue: number) =>
                      setActivePreviewTab(newValue)
                    }
                    aria-label="retirement preview tabs"
                  >
                    <Tab label="ONSCREEN" />
                    <Tab label="PDF" />
                  </Tabs>
                </Grid>
                <Grid size={{ xs: 1 }} sx={{ textAlign: 'right' }}>
                  <Tooltip title="Close">
                    <IconButton size="small" onClick={() => setOpenPreviewDialog(false)}>
                      <HighlightOff color="primary" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </DialogTitle>
            <DialogContent>
              {activePreviewTab === 0 ? (
                <ImprestRetirementOnScreenPreview retirement={retirementDetails} />
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
                  variant="outlined"
                  size="small"
                  color="primary"
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
        maxWidth="lg"
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
        maxWidth="lg"
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

      {showPreview && (
        <Tooltip title="Preview Retirement">
          <IconButton size="small" onClick={() => setOpenPreviewDialog(true)}>
            <VisibilityOutlined />
          </IconButton>
        </Tooltip>
      )}

      {showEdit && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => setOpenUpdateDialog(true)}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {showApprove && (
        <Tooltip title="Approve">
          <IconButton size="small" onClick={() => setOpenApprovalDialog(true)}>
            <CheckCircleOutlineOutlined color="success" />
          </IconButton>
        </Tooltip>
      )}

      {showDelete && (
        <Tooltip title="Delete">
          <IconButton size="small" onClick={handleDeleteDraft}>
            <DeleteOutlined color="error" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}

export default React.memo(ImprestRetirementItemAction);
