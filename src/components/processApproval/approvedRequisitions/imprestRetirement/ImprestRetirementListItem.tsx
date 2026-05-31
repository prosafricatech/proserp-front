'use client';

import React from 'react';
import { Alert, Chip, Grid, ListItemText, LinearProgress, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import imprestRetirementServices from '@/components/processApproval/imprestRetirements/imprestRetirementServices';
import ImprestRetirementApprovalAction from './ImprestRetirementApprovalAction';

const extractList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

type ImprestRetirementListItemProps = {
  requisitionApprovalId: number;
  approvedRequisition: any;
};

function ImprestRetirementListItem({ requisitionApprovalId, approvedRequisition }: ImprestRetirementListItemProps) {
  const { data: retirementsResponse, isFetching } = useQuery({
    queryKey: ['imprestRetirements', { requisition_approval_id: requisitionApprovalId }],
    queryFn: () =>
      imprestRetirementServices.list({
        requisition_approval_id: requisitionApprovalId,
        limit: 20,
      }),
    enabled: !!requisitionApprovalId,
  });

  const retirements = extractList(retirementsResponse);

  if (isFetching) {
    return <LinearProgress />;
  }

  if (retirements.length === 0) {
    return (
      <Alert variant="outlined" severity="info">
        No retirement records found.
      </Alert>
    );
  }

  return (
    <Grid container spacing={1}>
      {retirements.map((retirement: any) => {
        const items = extractList(retirement?.items);
        const totalAmount = Number.isFinite(Number(retirement?.amount))
          ? Number(retirement.amount)
          : items.reduce(
              (sum: number, item: any) => sum + (Number.isFinite(Number(item?.amount)) ? Number(item.amount) : 0),
              0
            );
        const currencyCode = retirement?.currency?.code || retirement?.currency_code || 'TZS';

        return (
          <Grid
            key={retirement.id}
            container
            spacing={1}
            width={'100%'}
            alignItems="center"
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              px: 1,
              py: 1.25,
            }}
          >
            <Grid size={{ xs: 6, md: 3 }}>
              <ListItemText
                primary={
                  <Tooltip title="Retirement Number">
                    <Typography component="span" lineHeight={1.25} noWrap fontWeight={600}>
                      {retirement?.retirementNo}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <Tooltip title="Reference Requisition">
                    <Typography component="span" variant="caption" lineHeight={1.2} noWrap>
                      {retirement?.requisition?.requisitionNo}
                    </Typography>
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Tooltip title="Retirement Date">
                <Typography component="span" lineHeight={1.25} noWrap>
                  {readableDate(retirement?.retirement_date)}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <ListItemText
                primary={
                  <Tooltip title="Remarks">
                    <Typography component="span" lineHeight={1.25} noWrap>
                      {retirement?.remarks}
                    </Typography>
                  </Tooltip>
                }
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Tooltip title="Status">
                <Chip
                  size="small"
                  label={retirement?.status_label || '-'}
                  color={String(retirement?.status_label || retirement?.status || '').toLowerCase().includes('reject') ? 'error' : 'default'}
                  variant={String(retirement?.status_label || retirement?.status || '').toLowerCase().includes('reject') ? 'filled' : 'outlined'}
                />
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }} textAlign={{ md: 'right' }}>
              <Tooltip title="Amount">
                <Typography>
                  {totalAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: currencyCode,
                  })}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 6, md: 1 }} textAlign={'end'}>
              <ImprestRetirementApprovalAction retirement={retirement} approvedRequisition={approvedRequisition} />
            </Grid>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default React.memo(ImprestRetirementListItem);
