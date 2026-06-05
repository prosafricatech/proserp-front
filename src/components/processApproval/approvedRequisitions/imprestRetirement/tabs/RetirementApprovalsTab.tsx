'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import {
  Alert,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import ImprestRetirementApprovalItemAction from '../ImprestRetirementApprovalItemAction';

const getStatusChipColor = (status: string, statusLabel?: string) => {
  const normalizedStatus = String(status || '').toLowerCase();
  const normalizedLabel = String(statusLabel || '').toLowerCase();

  const labelHasPriority =
    normalizedLabel.includes('reject') ||
    normalizedLabel.includes('approved') ||
    normalizedLabel.includes('complete') ||
    normalizedLabel.includes('hold') ||
    normalizedLabel.includes('pending') ||
    normalizedLabel.includes('wait');

  const statusSource = labelHasPriority ? normalizedLabel : normalizedStatus;

  if (statusSource.includes('reject')) return 'error';
  if (statusSource.includes('approved') || statusSource.includes('complete'))
    return 'success';
  if (statusSource.includes('hold')) return 'info';
  if (statusSource.includes('pending') || statusSource.includes('wait'))
    return 'warning';

  return 'default';
};

type RetirementApprovalsTabProps = {
  retirement: any;
  isActive: boolean;
  approvedRequisition?: any;
};

function RetirementApprovalsTab({
  retirement,
  isActive,
  approvedRequisition: _approvedRequisition,
}: RetirementApprovalsTabProps) {
  const { data: retirementDetails, isFetching } = useQuery({
    queryKey: [
      'imprestRetirementDetails',
      { id: retirement?.id },
      'imprest-retirement-approvals-tab',
    ],
    queryFn: () => imprestRetirementServices.show(retirement?.id),
    enabled: !!retirement?.id && isActive,
  });

  const resolvedRetirement = retirementDetails || retirement;
  const approvals = Array.isArray(resolvedRetirement?.approvals)
    ? resolvedRetirement.approvals
    : Array.isArray(resolvedRetirement?.approvals?.data)
      ? resolvedRetirement.approvals.data
      : [];
  const latestApprovalId =
    Number(resolvedRetirement?.latest_approval?.id || 0) || null;
  const normalizedCurrencyCode = String(
    resolvedRetirement?.currency?.code ||
      resolvedRetirement?.currency_code ||
      resolvedRetirement?.imprest_approval?.requisition?.currency?.code ||
      resolvedRetirement?.requisition?.currency?.code ||
      ''
  )
    .trim()
    .toUpperCase();
  const currencyCode = /^[A-Z]{3}$/.test(normalizedCurrencyCode)
    ? normalizedCurrencyCode
    : null;

  const formatApprovalAmount = (value: number) =>
    currencyCode
      ? value.toLocaleString('en-US', {
          style: 'currency',
          currency: currencyCode,
        })
      : value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  if (isFetching && !retirementDetails) {
    return <LinearProgress />;
  }

  if (approvals.length === 0) {
    return (
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }}>
          <Alert variant='outlined' severity='info' sx={{ mt: 1 }}>
            No approvals found for this retirement.
          </Alert>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={1}>
      {approvals.map((approval: any, index: number) => {
        const approvalItems = approval?.items || [];
        const approvalTotal = Number.isFinite(Number(approval?.amount))
          ? Number(approval.amount)
          : approvalItems.reduce(
              (sum: number, item: any) =>
                sum +
                (Number.isFinite(Number(item?.amount))
                  ? Number(item.amount)
                  : Number(item?.quantity || 0) * Number(item?.rate || 0)),
              0
            );
        const formattedApprovalTotal = formatApprovalAmount(approvalTotal);
        const statusChipColor = getStatusChipColor(
          approval?.status || approval?.status_label,
          approval?.status_label
        );

        const retirementForApprovalAction = {
          ...resolvedRetirement,
          status: approval?.status || resolvedRetirement?.status,
          status_label:
            approval?.status_label || resolvedRetirement?.status_label,
          latest_approval: approval,
          approval,
          approvals: [approval],
        };

        return (
          <Grid
            key={approval?.id || index}
            size={{ xs: 12 }}
            container
            spacing={1}
            alignItems='center'
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              py: 1,
              px: 0.5,
            }}
          >
            <Grid size={{ xs: 12, md: 3 }}>
              <Tooltip title='Approval Date'>
                <Typography variant='body2' fontWeight={600} noWrap>
                  {readableDate(approval?.approval_date)}
                </Typography>
              </Tooltip>
              <Tooltip title='Approved By'>
                <Typography variant='caption' color='text.secondary' noWrap>
                  {approval?.creator?.name}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Tooltip title='Status'>
                <Chip
                  size='small'
                  label={approval?.status_label}
                  color={statusChipColor}
                  variant={statusChipColor === 'default' ? 'outlined' : 'filled'}
                />
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Tooltip title='Amount'>
                <Typography variant='body2' noWrap>
                  {formattedApprovalTotal}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Tooltip title='Remarks'>
                <Typography variant='caption' color='text.secondary' noWrap>
                  {approval?.remarks}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }} textAlign={{ md: 'right' }}>
              <ImprestRetirementApprovalItemAction
                retirement={retirementForApprovalAction}
                approval={approval}
                approvals={approvals}
                isLatestApprovalRow={
                  latestApprovalId
                    ? Number(approval?.id) === latestApprovalId
                    : index === approvals.length - 1
                }
              />
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default React.memo(RetirementApprovalsTab);
