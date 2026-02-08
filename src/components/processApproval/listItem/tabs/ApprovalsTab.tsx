import { Grid } from '@mui/material';
import React from 'react';
import ApprovalsActionTail from './ApprovalsActionTail';
import ApprovalsListItem from './ApprovalsListItem';
import { Requisition } from '../../RequisitionType';

interface ApprovalsTabProps {
  requisition: Requisition;
  isExpanded: boolean;
}

function ApprovalsTab({ requisition, isExpanded }: ApprovalsTabProps) {
  return (
    <Grid container spacing={2}>
      {requisition.approvals.length === 0 && (
        <Grid size={12} textAlign={'end'}>
          <ApprovalsActionTail requisition={requisition} isExpanded={isExpanded}/>
        </Grid>
      )}
      <Grid size={12}>
        <ApprovalsListItem approvals={requisition.approvals} requisition={requisition}/>
      </Grid>
    </Grid>
  );
}

export default ApprovalsTab;