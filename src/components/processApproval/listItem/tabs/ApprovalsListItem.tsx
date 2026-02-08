import { Alert, Chip, Grid, Tooltip, Typography } from '@mui/material';
import React from 'react';
import ApprovalItemAction from './ApprovalItemAction';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Approval, Requisition } from '../../RequisitionType';

interface ApprovalsListItemProps {
  approvals: Approval[];
  requisition: Requisition;
}

function ApprovalsListItem({ requisition, approvals }: ApprovalsListItemProps) {
  return (
    <Grid container spacing={2}>
      {approvals?.length > 0 ? (
        approvals.map((approval, index) => (
          <Grid
            key={index}
            size={{xs: 12}}
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              padding: 1,
            }}
            container
            spacing={2}
            width={'100%'}
            alignItems={'center'}
          >
            <Grid size={{xs: 12, md: 4, lg: 4}}>
              <Tooltip title={'Action Date'}>
                <Typography variant='h6'>{readableDate(approval?.approval_date)}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 3, lg: 3}}>
              <Tooltip title={'Done By'}>
                <Typography variant='h6'>{approval?.creator?.name}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 3, lg: 3}}>
              <Tooltip title='Amount'>
                <Typography>
                  {(approval.amount + approval.vat_amount)?.toLocaleString('en-US', 
                  {
                    style: 'currency',
                    currency: requisition.currency?.code,
                  })}
                </Typography>
              </Tooltip>
              <Tooltip title='Status'>
                <Chip
                  size='small' 
                  label={approval?.status_label}
                  color={
                    approval?.status?.toLowerCase() === 'suspended'
                      ? 'primary'
                      : approval?.status?.toLowerCase() === 'rejected'
                      ? 'error'
                      : approval?.status?.toLowerCase() === 'on hold'
                      ? 'warning'
                      : (approval?.status?.toLowerCase() === 'submitted' && approval?.status_label?.toLowerCase() === 'completed')
                      ? 'success'
                      : 'info'
                  }                
                /> 
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 2, lg: 2}} textAlign={'right'}>
              <ApprovalItemAction approval={approval} approvals={approvals} requisition={requisition}/>
            </Grid>
          </Grid>
        ))
      ) : (
        <Grid size={{xs: 12}}>
          <Alert variant='outlined' severity='info'>No Approvals Found</Alert>
        </Grid>
      )}
    </Grid>
  );
}

export default ApprovalsListItem;