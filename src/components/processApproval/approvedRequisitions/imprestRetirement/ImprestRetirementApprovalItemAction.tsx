'use client';

import React from 'react';
import {
  EditOutlined,
  FactCheckOutlined,
  HighlightOff,
  UndoOutlined,
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
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import PDFContent from '@/components/pdf/PDFContent';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import ImprestRetirementApprovalForm from './form/ImprestRetirementApprovalForm';
import ImprestRetirementOnScreenPreview from './preview/ImprestRetirementOnScreenPreview';
import ImprestRetirementPDF from './preview/ImprestRetirementPDF';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

type ImprestRetirementApprovalItemActionProps = {
  retirement: any;
  approval?: any;
  approvals?: any[];
  isLatestApprovalRow?: boolean;
};

const isTruthyFlag = (value: any) =>
  value === true || value === 1 || String(value || '').toLowerCase() === 'true';
const normalizeStatus = (value: any) => String(value || '').toLowerCase();

function ImprestRetirementApprovalItemAction({
  retirement,
  approval,
  approvals,
  isLatestApprovalRow = true,
}: ImprestRetirementApprovalItemActionProps) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const { checkOrganizationPermission, hasOrganizationRole, authOrganization, authUser } =
    useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const organization = authOrganization?.organization;

  const [openApprovalDialog, setOpenApprovalDialog] = React.useState(false);
  const [approvalDialogMode, setApprovalDialogMode] = React.useState<'approve' | 'edit'>('approve');
  const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
  const [activePreviewTab, setActivePreviewTab] = React.useState(0);
  const canDeleteAnyRetirementApproval = checkOrganizationPermission([
    PERMISSIONS.IMPREST_RETIREMENT_APPROVALS_DELETE_ANY,
  ]);

  const currentApproval = approval || retirement?.latest_approval || retirement?.approval || null;
  const selectedApprovalId = React.useMemo(() => {
    return Number(currentApproval?.id || currentApproval?.approval_id || 0) || null;
  }, [currentApproval]);

  const { data: approvalDetails, isFetching: isFetchingApprovalDetails } = useQuery({
    queryKey: [
      'imprestRetirementApprovalDetails',
      { id: selectedApprovalId },
      'imprest-retirement-approval-item-action',
    ],
    queryFn: async () => imprestRetirementServices.showApproval(selectedApprovalId),
    enabled: !!selectedApprovalId && (!!openApprovalDialog || !!openPreviewDialog),
  });

  const { data: retirementDetails, isFetching: isFetchingRetirementDetails } = useQuery({
    queryKey: ['imprestRetirementDetails', { id: retirement?.id }, 'imprest-retirement-approval-item-action'],
    queryFn: async () => imprestRetirementServices.show(retirement?.id),
    enabled: !!retirement?.id && (!!openApprovalDialog || !!openPreviewDialog),
  });

  const resolvedRetirement = React.useMemo(() => {
    const baseRetirement = retirementDetails || retirement;
    const selectedApproval =
      approvalDetails ?? approval ?? retirement?.latest_approval ?? retirement?.approval;

    if (!selectedApproval) return baseRetirement;

    return {
      ...baseRetirement,
      status: selectedApproval?.status || baseRetirement?.status,
      status_label: selectedApproval?.status_label || baseRetirement?.status_label,
      latest_approval: selectedApproval,
      approval: selectedApproval,
      approvals: [selectedApproval],
    };
  }, [retirementDetails, approvalDetails, retirement, approval]);

  const approvalList = Array.isArray(approvals)
    ? approvals
    : Array.isArray(retirement?.approvals)
      ? retirement.approvals
      : [];
  const latestApprovalRow = approvalList.length > 0 ? approvalList[approvalList.length - 1] : null;
  const isCurrentLatestApprovalRow =
    isLatestApprovalRow &&
    (approvalList.length === 0 || latestApprovalRow?.id === currentApproval?.id);

  const statusRaw = normalizeStatus(currentApproval?.status || retirement?.status);
  const statusLabelRaw = normalizeStatus(
    currentApproval?.status_label || retirement?.status_label
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
    (approvalStatusRaw === 'pending' || !approvalStatusRaw || statusLabelRaw.includes('pending'));

  const nextApprovalLevel = resolvedRetirement?.next_approval_level || retirement?.next_approval_level;
  const retirementStatusRaw = normalizeStatus(resolvedRetirement?.status || retirement?.status);
  const canEditOrDeleteDate =
    checkOrganizationPermission(PERMISSIONS.APPROVAL_BACKDATE) ||
    dayjs(currentApproval?.approval_date).isSameOrAfter(dayjs().startOf('day'));
  const canApproveNext =
    Boolean(nextApprovalLevel?.id) &&
    hasOrganizationRole(nextApprovalLevel?.role?.name ?? '') &&
    retirementStatusRaw !== 'suspended' &&
    isCurrentLatestApprovalRow &&
    Number(currentApproval?.is_final || 0) === 0 &&
    !isOnHold &&
    !isRejected &&
    (isPendingApproval || isApproved || approvalList.length === 0);

  const canEditLatestRow =
    canEditOrDeleteDate &&
    isCurrentLatestApprovalRow &&
    currentApproval?.creator?.id === authUser?.user?.id &&
    !(currentApproval?.has_orders || currentApproval?.has_payments);

  const { mutate: revokeRetirementApproval } = useMutation({
    mutationFn: imprestRetirementServices.revokeApproval,
    onSuccess: async (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement approval revoked', {
        variant: 'success',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] }),
        queryClient.invalidateQueries({ queryKey: ['imprestRetirementDetails'] }),
        queryClient.invalidateQueries({ queryKey: ['imprestRetirementApprovalDetails'] }),
      ]);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to revoke retirement approval', {
        variant: 'error',
      });
    },
  });

  const resolveApprovalId = async (): Promise<number | null> => {
    if (selectedApprovalId) return selectedApprovalId;

    const approvalsList = Array.isArray(retirement?.approvals) ? retirement.approvals : [];
    const latestApprovalFromRow = retirement?.latest_approval || retirement?.approval || null;
    const lastApprovalInList = approvalsList.length > 0 ? approvalsList[approvalsList.length - 1] : null;
    return (
      Number(
        latestApprovalFromRow?.id ||
          latestApprovalFromRow?.approval_id ||
          lastApprovalInList?.id ||
          lastApprovalInList?.approval_id ||
          0
      ) || null
    );
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

  const showEdit = canEditLatestRow;
  const showApprove = canApproveNext;
  const showRevoke =
    canEditOrDeleteDate &&
    isCurrentLatestApprovalRow &&
    ((currentApproval?.creator?.id === authUser?.user?.id) ||
      canDeleteAnyRetirementApproval)

  const isFetchingDialogDetails = isFetchingApprovalDetails || isFetchingRetirementDetails;

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
                    aria-label="approval preview tabs"
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
                <ImprestRetirementOnScreenPreview retirement={resolvedRetirement} />
              ) : (
                <PDFContent
                  fileName={
                    resolvedRetirement?.retirementNo ||
                    `retirement-${resolvedRetirement?.id || retirement?.id || ''}`
                  }
                  document={
                    <ImprestRetirementPDF
                      retirement={resolvedRetirement}
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
            retirement={resolvedRetirement}
            isEdit={approvalDialogMode === 'edit'}
          />
        )}
      </Dialog>

      <Tooltip title="View">
        <IconButton size="small" onClick={() => setOpenPreviewDialog(true)}>
          <VisibilityOutlined />
        </IconButton>
      </Tooltip>

      {showEdit && (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => {
              setApprovalDialogMode('edit');
              setOpenApprovalDialog(true);
            }}
          >
            <EditOutlined />
          </IconButton>
        </Tooltip>
      )}

      {showApprove && (
        <Tooltip title="Approve">
          <IconButton
            size="small"
            onClick={() => {
              setApprovalDialogMode('approve');
              setOpenApprovalDialog(true);
            }}
          >
            <FactCheckOutlined />
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
    </>
  );
}

export default React.memo(ImprestRetirementApprovalItemAction);
