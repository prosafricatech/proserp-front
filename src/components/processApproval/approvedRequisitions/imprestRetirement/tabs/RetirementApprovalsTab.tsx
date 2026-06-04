'use client';

import React from 'react';
import { Alert, Chip, Grid, LinearProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import ImprestRetirementApprovalItemAction from '../ImprestRetirementApprovalItemAction';

type RetirementApprovalsTabProps = {
  retirement: any;
  isActive: boolean;
  approvedRequisition: any;
};

function RetirementApprovalsTab({ retirement, isActive, approvedRequisition }: RetirementApprovalsTabProps) {
  const { data: retirementDetails, isFetching } = useQuery({
    queryKey: ['imprestRetirementDetails', { id: retirement?.id }, 'imprest-retirement-approvals-tab'],
    queryFn: () => imprestRetirementServices.show(retirement?.id),
    enabled: !!retirement?.id && isActive,
  });

  const resolvedRetirement = retirementDetails || retirement;
  const approvals = resolvedRetirement?.approvals || [];
  const latestApprovalId = Number(resolvedRetirement?.latest_approval?.id || 0) || null;

  if (isFetching && !retirementDetails) {
    return <LinearProgress />;
  }

  if (approvals.length === 0) {
    return (
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }}>
          <Alert variant="outlined" severity="info" sx={{ mt: 1 }}>
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
        const currencyCode = retirement?.requisition?.currency?.code;
        const formattedApprovalTotal = currencyCode
          ? approvalTotal.toLocaleString('en-US', {
              style: 'currency',
              currency: currencyCode,
            })
          : approvalTotal.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

        const retirementForApprovalAction = {
          ...resolvedRetirement,
          status: approval?.status || resolvedRetirement?.status,
          status_label: approval?.status_label || resolvedRetirement?.status_label,
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
            alignItems="center"
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              py: 1,
              px: 0.5,
            }}
          >
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" fontWeight={600}>
                {readableDate(approval?.approval_date)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {approval?.creator?.name}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Chip size="small" label={approval?.status_label} />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2">{formattedApprovalTotal}</Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {approval?.remarks}
              </Typography>
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
