import React from 'react';
import { Alert, Grid, LinearProgress, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import requisitionsServices from '../../requisitionsServices';
import { MaterialApprovalRequisition } from '../ApprovalRequisitionType';

interface ApprovedIssueListItemProps {
  approvedRequisition: MaterialApprovalRequisition;
  isExpanded: boolean;
}

function getIssueDate(issue: any): string {
  return issue?.consumption_date;
}

function getIssueAmount(issue: any): number {
  if (Number.isFinite(Number(issue?.amount))) return Number(issue.amount);
  if (Array.isArray(issue?.details)) {
    return issue.details.reduce(
      (sum: number, line: any) => sum + Number(line?.amount || 0),
      0
    );
  }
  return 0;
}

function ApprovedIssueListItem({
  approvedRequisition,
  isExpanded,
}: ApprovedIssueListItemProps) {
  const { data: approvedIssues, isFetching, error } = useQuery({
    queryKey: ['approvedIssues', { id: approvedRequisition.id }],
    queryFn: async () => requisitionsServices.getApprovedIssues(approvedRequisition.id),
    enabled: !!isExpanded,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Alert variant='outlined' severity='error'>
        Failed to load store issues.
      </Alert>
    );
  }

  if (!approvedIssues || approvedIssues.length === 0) {
    return (
      <Alert variant='outlined' severity='info'>
        No store issues raised yet.
      </Alert>
    );
  }

  return (
    <>
      {approvedIssues.map((issue: any) => {
        const storeName = issue?.store?.name || 'N/A';
        const issueNo = issue?.consumptionNo || '';
        const narration = issue?.narration || '';

        return (
          <Grid
            key={issue.id}
            container
            sx={{
              paddingLeft: 1,
              paddingRight: 1,
              py: 1,
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Grid size={{ xs: 6, md: 4 }}>
              <Tooltip title='Issue No.'>
                <Typography variant='body2' fontWeight='medium'>
                  {issueNo}
                </Typography>
              </Tooltip>
              <Tooltip title='Issue Date'>
                <Typography variant='caption' color='text.secondary' display='block'>
                  {readableDate(getIssueDate(issue))}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Tooltip title='Store'>
                <Typography variant='body2'>
                  {storeName}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Tooltip title='Narration'>
                <Typography variant='body2'>
                  {narration}
                </Typography>
              </Tooltip>
            </Grid>
          </Grid>
        );
      })}
    </>
  );
}

export default React.memo(ApprovedIssueListItem);