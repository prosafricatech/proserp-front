'use client';

import React from 'react';
import { CheckCircleOutlineOutlined, DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, UndoOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Tab, Tabs, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { JumboDdMenu } from '@jumbo/components';
import { MenuItemProps } from '@jumbo/types';
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

function ImprestRetirementApprovalAction({ retirement, approvedRequisition }: ImprestRetirementApprovalActionProps) {
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { theme } = useJumboTheme();
  const { checkOrganizationPermission, authOrganization } = useJumboAuth();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const organization = authOrganization?.organization;

  const [openUpdateDialog, setOpenUpdateDialog] = React.useState(false);
  const [openApprovalDialog, setOpenApprovalDialog] = React.useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = React.useState(false);
  const [activePreviewTab, setActivePreviewTab] = React.useState(0);
  const canApproveRetirement = checkOrganizationPermission([PERMISSIONS.IMPREST_RETIREMENT_APPROVE]);

  const { data: retirementDetails, isFetching: isFetchingRetirementDetails } = useQuery({
    queryKey: ['imprestRetirementDetails', { id: retirement?.id }, 'imprest-retirement-update'],
    queryFn: async () => imprestRetirementServices.show(retirement?.id),
    enabled: !!retirement?.id && (!!openUpdateDialog || !!openApprovalDialog || !!openPreviewDialog),
  });

  const resolvedRetirement = React.useMemo(
    () => extractOne(retirementDetails) || retirement,
    [retirementDetails, retirement]
  );

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
  const canDelete = isDraftLike || isPendingApproval || isOnHold || isRejected;

  const menuItems: MenuItemProps[] = [
    { icon: <VisibilityOutlined />, title: 'Preview', action: 'preview' } as MenuItemProps,
    ...(canUpdate
      ? [
          { icon: <EditOutlined />, title: 'Edit', action: 'update-draft' } as MenuItemProps,
        ]
      : []),
    ...((isPendingApproval || isOnHold || isRejected)
      && canApproveRetirement
      && !hasFinalApproval
      ? [
          { icon: <CheckCircleOutlineOutlined color="success" />, title: 'Approve', action: 'retirement-approval' } as MenuItemProps,
        ]
      : []),
    ...((isApproved || isRejected || isOnHold) && canApproveRetirement
      ? [{ icon: <UndoOutlined color="warning" />, title: 'Revoke', action: 'revoke' } as MenuItemProps]
      : []),
    ...(canDelete
      ? [{ icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete-draft' } as MenuItemProps]
      : []),
  ];

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
      content: `Revoke approval for ${retirement?.retirementNo || `#${retirement?.id}`}?`,
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

  const handleItemAction = (menuItem: MenuItemProps) => {
    switch (menuItem.action) {
      case 'update-draft':
        if (shouldEditApproval) {
          setOpenApprovalDialog(true);
        } else {
          setOpenUpdateDialog(true);
        }
        break;
      case 'preview':
        setOpenPreviewDialog(true);
        break;
      case 'delete-draft':
        handleDeleteDraft();
        break;
      case 'approve':
      case 'retirement-approval':
        setOpenApprovalDialog(true);
        break;
      case 'revoke':
        handleRevoke();
        break;
      default:
        break;
    }
  };

  if (menuItems.length === 0) return null;

  const previewRetirement = retirementDetails?.data?.data || retirementDetails?.data || retirementDetails || retirement;
  const editRetirement = resolvedRetirement;

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
        {isFetchingRetirementDetails ? (
          <LinearProgress />
        ) : (
          <>
            <DialogTitle>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 11 }}>
                  <Tabs
                    value={activePreviewTab}
                    onChange={(_event: React.SyntheticEvent, newValue: number) => setActivePreviewTab(newValue)}
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
        {isFetchingRetirementDetails && !retirementDetails ? (
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
        {isFetchingRetirementDetails ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementApprovalForm
            toggleOpen={setOpenApprovalDialog}
            retirement={editRetirement}
            isEdit={isOnHold || isRejected || isApproved}
          />
        )}
      </Dialog>

      <JumboDdMenu
        icon={
          <Tooltip title="Retirement Actions">
            <MoreHorizOutlined fontSize="small" />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
}

export default React.memo(ImprestRetirementApprovalAction);
