'use client';

import React from 'react';
import { CheckCircleOutlineOutlined, DeleteOutlined, EditOutlined, HighlightOff, UndoOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import PDFContent from '@/components/pdf/PDFContent';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import ImprestRetirementForm from './form/ImprestRetirementForm';
import ImprestRetirementApprovalForm from './form/ImprestRetirementApprovalForm';
import ImprestRetirementOnScreenPreview from './preview/ImprestRetirementOnScreenPreview';
import ImprestRetirementPDF from './preview/ImprestRetirementPDF';

interface ImprestRetirementApprovalActionProps {
  retirement: any;
  approvedRequisition: any;
  previewContext?: 'retirement' | 'approval';
  previewOnly?: boolean;
  isLatestApprovalRow?: boolean;
}

const extractOne = (payload: any): any | null => {
  if (!payload) return null;
  if (payload?.id) return payload;
  if (payload?.data?.id) return payload.data;
  if (payload?.data?.data?.id) return payload.data.data;
  return null;
};

const isTruthyFlag = (value: any) =>
  value === true || value === 1 || String(value || '').toLowerCase() === 'true';

function ImprestRetirementApprovalAction({
  retirement,
  approvedRequisition,
  previewContext = 'retirement',
  previewOnly = false,
  isLatestApprovalRow = true,
}: ImprestRetirementApprovalActionProps) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const { checkOrganizationPermission, hasOrganizationRole, authOrganization } = useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const organization = authOrganization?.organization;

  const [openUpdateDialog, setOpenUpdateDialog] = React.useState(false);
  const [openApprovalDialog, setOpenApprovalDialog] = React.useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
  const [activePreviewTab, setActivePreviewTab] = React.useState(0);
  const canApproveRetirement = checkOrganizationPermission([PERMISSIONS.IMPREST_RETIREMENT_APPROVE]);

  const isApprovalContext = previewContext === 'approval';
  const selectedApprovalId = React.useMemo(() => {
    const approval = retirement?.latest_approval || retirement?.approval || null;
    return Number(approval?.id || approval?.approval_id || 0) || null;
  }, [retirement]);

  const { data: retirementDetails, isFetching: isFetchingRetirementDetails } = useQuery({
    queryKey: ['imprestRetirementDetails', { id: retirement?.id }, 'imprest-retirement-update'],
    queryFn: async () => imprestRetirementServices.show(retirement?.id),
    enabled:
      !isApprovalContext &&
      !!retirement?.id &&
      (!!openUpdateDialog || !!openApprovalDialog || !!openPreviewDialog),
  });

  const { data: approvalDetails, isFetching: isFetchingApprovalDetails } = useQuery({
    queryKey: ['imprestRetirementApprovalDetails', { id: selectedApprovalId }, 'imprest-retirement-approval-update'],
    queryFn: async () => imprestRetirementServices.showApproval(selectedApprovalId),
    enabled: isApprovalContext && !!selectedApprovalId && (!!openApprovalDialog || !!openPreviewDialog),
  });

  const resolvedRetirement = React.useMemo(() => {
    const baseRetirement = extractOne(retirementDetails) || retirement;
    const selectedApproval =
      extractOne(approvalDetails) || retirement?.latest_approval || retirement?.approval || null;

    if (!isApprovalContext || !selectedApproval) {
      return baseRetirement;
    }

    return {
      ...baseRetirement,
      status: selectedApproval?.status || baseRetirement?.status,
      status_label: selectedApproval?.status_label || baseRetirement?.status_label,
      latest_approval: selectedApproval,
      approval: selectedApproval,
      approvals: [selectedApproval],
    };
  }, [retirementDetails, approvalDetails, retirement, isApprovalContext]);

  // Decide menu actions from the list row payload to keep behavior stable.
  const statusRaw = String(retirement?.status || '').toLowerCase();
  const statusLabelRaw = String(retirement?.status_label || '').toLowerCase();
  const latestApproval = retirement?.latest_approval;
  const approvalStatusRaw = String(latestApproval?.status || '').toLowerCase();
  const approvalStatusLabelRaw = String(latestApproval?.status_label || '').toLowerCase();
  const hasFinalApproval = isTruthyFlag(latestApproval?.is_final);
  const hasApprovalAction = Boolean(latestApproval);

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
  const isDraftLike =
    !hasFinalApproval &&
    (statusRaw === 'draft' ||
      statusRaw === 'suspended' ||
      statusRaw.includes('reject') ||
      statusLabelRaw.includes('reject') ||
      approvalStatusRaw.includes('reject'));
  const shouldEditApproval = hasApprovalAction;

  const { mutate: deleteRetirement, isPending: isDeletingRetirement } = useMutation({
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

  const { mutate: revokeRetirementApproval, isPending: isRevokingApproval } = useMutation({
    mutationFn: imprestRetirementServices.revokeApproval,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement approval revoked', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to revoke retirement approval', {
        variant: 'error',
      });
    },
  });

  const canUpdate = isDraftLike || isPendingApproval || isOnHold || isRejected || isApproved;
  const canDelete = isDraftLike || isPendingApproval;
  const nextApprovalLevel = resolvedRetirement?.next_approval_level || retirement?.next_approval_level;
  const hasNextApprovalLevel = Boolean(nextApprovalLevel?.id);
  const canApproveByRole = hasOrganizationRole(nextApprovalLevel?.role?.name ?? '');
  const canApproveNext =
    hasNextApprovalLevel &&
    canApproveByRole &&
    isLatestApprovalRow &&
    !hasFinalApproval &&
    !isOnHold &&
    !isRejected &&
    (isPendingApproval || isApproved);

  const handleDeleteDraft = () => {
    showDialog({
      title: 'Delete Draft',
      content: `Delete draft ${retirement?.retirementNo || `#${retirement?.id}`}?`,
      variant: 'confirm',
      onYes: async () => {
        hideDialog();
        await deleteRetirement(retirement.id);
      },
      onNo: () => hideDialog(),
    });
  };

  const resolveApprovalId = async (): Promise<number | null> => {
    if (selectedApprovalId) return selectedApprovalId;

    const approvals = Array.isArray(retirement?.approvals) ? retirement.approvals : [];
    const latestApprovalFromRow = retirement?.latest_approval || retirement?.approval || null;
    const lastApprovalInList = approvals.length > 0 ? approvals[approvals.length - 1] : null;
    return Number(
      latestApprovalFromRow?.id ||
        latestApprovalFromRow?.approval_id ||
        lastApprovalInList?.id ||
        lastApprovalInList?.approval_id ||
        0
    ) || null;
  };
  const handleRevoke = () => {
    showDialog({
      title: 'Revoke Approval',
      content: `Revoke approval for ${retirement?.retirementNo}?`,
      variant: 'confirm',
      onYes: async () => {
        hideDialog();
        const approvalId = await resolveApprovalId();
        if (!approvalId) {
          enqueueSnackbar('Approval reference not found for revoke', { variant: 'error' });
          return;
        }
        await revokeRetirementApproval({
          approvalId,
          remarks: '',
        });
      },
      onNo: () => hideDialog(),
    });
  };

  const showPreview = true;
  const showEdit = !previewOnly && canUpdate;
  const showApprove = !previewOnly && canApproveNext;
  const showRevoke = !previewOnly && (isApproved || isRejected || isOnHold) && canApproveRetirement;
  const showDelete = !previewOnly && canDelete;

  if (!showPreview && !showEdit && !showApprove && !showRevoke && !showDelete) return null;

  const previewRetirement = resolvedRetirement;
  const editRetirement = resolvedRetirement;
  const isFetchingDialogDetails = isApprovalContext
    ? isFetchingApprovalDetails
    : isFetchingRetirementDetails;

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
                    onChange={(_event: React.SyntheticEvent, newValue: number) => setActivePreviewTab(newValue)}
                    aria-label={previewContext === 'approval' ? 'approval preview tabs' : 'retirement preview tabs'}
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
                <ImprestRetirementOnScreenPreview retirement={previewRetirement} />
              ) : (
                <PDFContent
                  fileName={previewRetirement?.retirementNo || `retirement-${previewRetirement?.id || retirement?.id || ''}`}
                  document={<ImprestRetirementPDF retirement={previewRetirement} organization={organization} />}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Box sx={{ textAlign: 'right', marginTop: 1 }}>
                <Button variant="outlined" size="small" color="primary" onClick={() => setOpenPreviewDialog(false)}>
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
        {!isApprovalContext && isFetchingRetirementDetails && !retirementDetails ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementForm
            toggleOpen={setOpenUpdateDialog}
            approvedRequisition={approvedRequisition}
            existingRetirementDetails={editRetirement}
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
            retirement={editRetirement}
            isEdit={isOnHold || isRejected || isApproved}
          />
        )}
      </Dialog>

      {showPreview && (
        <Tooltip title={previewContext === 'approval' ? 'Preview Approval' : 'Preview Retirement'}>
          <IconButton size="small" onClick={() => setOpenPreviewDialog(true)}>
            <VisibilityOutlined />
          </IconButton>
        </Tooltip>
      )}

      {showEdit && (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => {
              if (shouldEditApproval) {
                setOpenApprovalDialog(true);
              } else {
                setOpenUpdateDialog(true);
              }
            }}
          >
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

      {showRevoke && (
        <Tooltip title="Revoke">
          <IconButton size="small" onClick={handleRevoke}>
            <UndoOutlined color="warning" />
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

export default React.memo(ImprestRetirementApprovalAction);
