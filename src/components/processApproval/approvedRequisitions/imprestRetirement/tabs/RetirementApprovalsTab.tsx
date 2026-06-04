'use client';

import React from 'react';
import { Alert, Chip, Grid, LinearProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import ImprestRetirementApprovalAction from '../ImprestRetirementApprovalAction';

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const extractOne = (payload: any): any | null => {
  if (!payload) return null;
  if (payload?.id) return payload;
  if (payload?.data?.id) return payload.data;
  if (payload?.data?.data?.id) return payload.data.data;
  return null;
};

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

  const resolvedRetirement = extractOne(retirementDetails) || retirement;
  const approvals = extractList(resolvedRetirement?.approvals);
  const latestApprovalId = Number(resolvedRetirement?.latest_approval?.id || 0) || null;
  const currencyCode =
    resolvedRetirement?.currency?.code ||
    resolvedRetirement?.currency_code ||
    retirement?.currency?.code ||
    retirement?.currency_code ||
    'TZS';

  if (isFetching && !retirementDetails) {
    return <LinearProgress />;
  }

  if (approvals.length === 0) {
    return (
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }} textAlign={{ md: 'right' }}>
          <ImprestRetirementApprovalAction
            retirement={resolvedRetirement}
            approvedRequisition={approvedRequisition}
            previewContext="retirement"
            isLatestApprovalRow
          />
        </Grid>
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
        const approvalItems = extractList(approval?.items);
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
                {approval?.creator?.name || '-'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Chip size="small" label={approval?.status_label || '-'} />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="body2">
                {approvalTotal.toLocaleString('en-US', {
                  style: 'currency',
                  currency: currencyCode,
                })}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {approval?.remarks || '-'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }} textAlign={{ md: 'right' }}>
              <ImprestRetirementApprovalAction
                retirement={retirementForApprovalAction}
                approvedRequisition={approvedRequisition}
                previewContext="approval"
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
