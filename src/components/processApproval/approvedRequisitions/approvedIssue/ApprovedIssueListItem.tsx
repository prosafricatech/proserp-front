import React from 'react';
import { Alert, Box, Chip, Grid, LinearProgress, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import requisitionsServices from '../../requisitionsServices';
import { MaterialApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedIssueItemAction from './ApprovedIssueItemAction';

interface ApprovedIssueListItemProps {
  approvedRequisition: MaterialApprovalRequisition;
  isExpanded: boolean;
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
        const isTransfer = issue?.issue_type === 'transfer';
        const storeName = isTransfer
          ? `${issue?.source_store?.name || 'N/A'} → ${issue?.destination_store?.name || 'N/A'}`
          : issue?.store?.name || 'N/A';
        const issueNo = isTransfer ? issue?.transferNo : issue?.consumptionNo;
        const narration = issue?.narration || '';

        return (
          <Grid
            key={`${issue.issue_type}-${issue.id}`}
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
                  {readableDate(issue?.date)}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Tooltip title={isTransfer ? 'Source → Destination Store' : 'Store'}>
                <Typography variant='body2'>
                  {storeName}
                </Typography>
              </Tooltip>
              {isTransfer && (
                <Tooltip title='Receipt Status'>
                  <Chip
                    size='small'
                    label={issue.status}
                    color={issue.status === 'Fully Received' ? 'success' : 'warning'}
                    sx={{ mt: 0.5 }}
                  />
                </Tooltip>
              )}
            </Grid>

            <Grid size={{ xs: 10, md: 4 }}>
              <Tooltip title='Narration'>
                <Typography variant='body2'>
                  {narration}
                </Typography>
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 2, md: 1 }} sx={{ textAlign: 'end' }}>
              <Box display='flex' flexDirection='row' justifyContent='flex-end'>
                <ApprovedIssueItemAction issue={issue} />
              </Box>
            </Grid>
          </Grid>
        );
      })}
    </>
  );
}

export default React.memo(ApprovedIssueListItem);