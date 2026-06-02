'use client';

import React from 'react';
import { CheckCircleOutlineOutlined, DeleteOutlined, EditOutlined, HighlightOff, MoreHorizOutlined, UndoOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Tab, Tabs, TextField, Tooltip, useMediaQuery } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { JumboDdMenu } from '@jumbo/components';
import { MenuItemProps } from '@jumbo/types';
import PDFContent from '@/components/pdf/PDFContent';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import ImprestRetirementForm from './form/ImprestRetirementForm';
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

type DecisionPayload = {
  items: Array<{
    imprest_retirement_item_id: number;
    ledger_id: number;
    measurement_unit_id: number;
    quantity: number;
    rate: number;
    description: string;
  }>;
};

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
  const [remarksDialogMode, setRemarksDialogMode] = React.useState<'reject' | 'on-hold' | null>(null);
  const [remarks, setRemarks] = React.useState('');
  const [pendingDecisionPayload, setPendingDecisionPayload] = React.useState<DecisionPayload | null>(null);

  const statusRaw = String(retirement?.status || '').toLowerCase();
  const statusLabelRaw = String(retirement?.status_label || '').toLowerCase();
  const approvalStatusRaw = String(retirement?.approval?.status || '').toLowerCase();

  const isPendingApproval =
    statusRaw === 'submitted' &&
    (approvalStatusRaw === 'pending' || !approvalStatusRaw || statusLabelRaw.includes('pending'));
  const isApproved = approvalStatusRaw === 'approved' || statusLabelRaw.includes('approved');
  const isRejected = approvalStatusRaw === 'rejected' || statusLabelRaw.includes('rejected');
  const isDraftLike =
    statusRaw === 'draft' ||
    statusRaw === 'suspended' ||
    statusRaw.includes('reject') ||
    statusLabelRaw.includes('reject') ||
    approvalStatusRaw.includes('reject');
  const canApproveRetirement = checkOrganizationPermission([PERMISSIONS.IMPREST_RETIREMENT_APPROVE]);

  const { data: retirementDetails, isFetching: isFetchingRetirementDetails } = useQuery({
    queryKey: ['imprestRetirementDetails', { id: retirement?.id }, 'imprest-retirement-update'],
    queryFn: async () => imprestRetirementServices.show(retirement?.id),
    enabled: !!retirement?.id && (!!openUpdateDialog || !!openApprovalDialog || !!openPreviewDialog),
  });

  const { mutate: approveRetirement, isPending } = useMutation({
    mutationFn: imprestRetirementServices.approve,
    onSuccess: (response: any) => {
      enqueueSnackbar(response?.message || 'Retirement approved', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['imprestRetirements'] });
      setOpenApprovalDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to approve retirement', {
        variant: 'error',
      });
    },
  });

  const currentRetirementDetails = React.useMemo(
    () => extractOne(retirementDetails) || retirement,
    [retirementDetails, retirement]
  );

  const chainLevelId = Number(
    currentRetirementDetails?.next_approval_level?.id ||
      approvedRequisition?.next_approval_level?.id ||
      approvedRequisition?.requisition?.next_approval_level?.id ||
      retirement?.next_approval_level?.id ||
      0
  );

  const isFinal = Number(
    currentRetirementDetails?.next_approval_level?.is_final ||
      approvedRequisition?.next_approval_level?.is_final ||
      approvedRequisition?.requisition?.next_approval_level?.is_final ||
      retirement?.next_approval_level?.is_final ||
      0
  );

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

  const canUpdateOrDelete = isDraftLike || isPendingApproval;

  const menuItems: MenuItemProps[] = [
    { icon: <VisibilityOutlined />, title: 'Preview', action: 'preview' } as MenuItemProps,
    ...(canUpdateOrDelete
      ? [
          { icon: <EditOutlined />, title: 'Edit', action: 'update-draft' } as MenuItemProps,
        ]
      : []),
    ...(isPendingApproval
      && canApproveRetirement
      ? [
          { icon: <CheckCircleOutlineOutlined color="success" />, title: 'Approve', action: 'retirement-approval' } as MenuItemProps,
        ]
      : []),
    ...((isApproved || isRejected) && canApproveRetirement
      ? [{ icon: <UndoOutlined color="warning" />, title: 'Revoke', action: 'revoke' } as MenuItemProps]
      : []),
    ...(canUpdateOrDelete
      ? [{ icon: <DeleteOutlined color="error" />, title: 'Delete', action: 'delete-draft' } as MenuItemProps]
      : []),
  ];

  const runApprovalDecision = async ({
    status,
    remarks,
    items,
  }: {
    status: 'approved' | 'rejected' | 'on hold';
    remarks?: string | null;
    items?: DecisionPayload['items'];
  }) => {
    if (!chainLevelId) {
      enqueueSnackbar('Approval chain level is missing for this retirement.', {
        variant: 'error',
      });
      return;
    }

    const payload: any = {
      imprest_retirement_id: retirement.id,
      chain_level_id: chainLevelId,
      is_final: isFinal,
      status,
      approval_date: dayjs().format('YYYY-MM-DD'),
      remarks: remarks ?? null,
    };

    if (items?.length && (status === 'approved' || status === 'on hold')) {
      payload.items = items;
    }

    await approveRetirement(payload);
  };

  const handleApprove = async (payload: DecisionPayload) => {
    await runApprovalDecision({
      status: 'approved',
      remarks: null,
      items: payload.items,
    });
  };

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

  const handleSubmitRemarksAction = async () => {
    if (!remarks.trim()) {
      enqueueSnackbar(
        remarksDialogMode === 'on-hold'
          ? 'Remarks are required for on-hold decision'
          : 'Remarks are required for rejection',
        { variant: 'error' }
      );
      return;
    }

    await runApprovalDecision({
      status: remarksDialogMode === 'on-hold' ? 'on hold' : 'rejected',
      remarks: remarks.trim(),
      items:
        remarksDialogMode === 'on-hold'
          ? pendingDecisionPayload?.items || []
          : undefined,
    });

    setRemarksDialogMode(null);
    setRemarks('');
    setPendingDecisionPayload(null);
  };

  const resolveApprovalId = async (): Promise<number | null> => {
    const directApprovalId = Number(retirement?.approval?.id || retirementDetails?.approval?.id || 0);
    if (directApprovalId) return directApprovalId;

    const latestRetirement = await imprestRetirementServices.show(retirement?.id);
    const fetchedApprovalId = Number(latestRetirement?.approval?.id || latestRetirement?.data?.approval?.id || 0);
    return fetchedApprovalId || null;
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
        setOpenUpdateDialog(true);
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
        {isFetchingRetirementDetails ? (
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
        {isFetchingRetirementDetails ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementForm
            toggleOpen={setOpenApprovalDialog}
            approvedRequisition={approvedRequisition}
            existingRetirementDetails={retirementDetails}
            preferredRetirementId={retirement?.id}
            reviewMode
            onApprove={handleApprove}
            onHold={(payload) => {
              setPendingDecisionPayload(payload);
              setRemarks('');
              setRemarksDialogMode('on-hold');
            }}
            onReject={() => {
              setPendingDecisionPayload(null);
              setRemarks('');
              setRemarksDialogMode('reject');
            }}
            approveLoading={isPending}
            holdLoading={isPending || isRevokingApproval}
            rejectLoading={isPending || isRevokingApproval}
          />
        )}
      </Dialog>

      <Dialog
        open={!!remarksDialogMode}
        onClose={() => {
          setRemarksDialogMode(null);
          setRemarks('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle textAlign="center">
          {remarksDialogMode === 'on-hold' ? 'Put Retirement On Hold' : 'Reject Retirement'}
        </DialogTitle>
        <DialogContent>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1 }}
            label="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button
            size="small"
            onClick={() => {
              setRemarksDialogMode(null);
              setRemarks('');
              setPendingDecisionPayload(null);
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color={remarksDialogMode === 'on-hold' ? 'warning' : 'error'}
            onClick={handleSubmitRemarksAction}
            disabled={isPending || isRevokingApproval}
          >
            {remarksDialogMode === 'on-hold' ? 'On Hold' : 'Reject'}
          </Button>
        </DialogActions>
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
