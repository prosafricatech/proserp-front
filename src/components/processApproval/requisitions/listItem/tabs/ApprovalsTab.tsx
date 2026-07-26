import { Grid } from '@mui/material';
import { Requisition } from '../../../RequisitionType';
import ApprovalsActionTail from './ApprovalsActionTail';
import ApprovalsListItem from './ApprovalsListItem';

interface ApprovalsTabProps {
  requisition: Requisition;
  isExpanded: boolean;
}

function ApprovalsTab({ requisition, isExpanded }: ApprovalsTabProps) {
  // A superseded return-to-requester means the requester resubmitted and the
  // chain restarted — even though that row is still shown in the timeline
  // below for history, there's no active approval to act on, same as a
  // brand-new requisition with no approvals at all.
  const lastApproval = requisition.approvals[requisition.approvals.length - 1];
  const chainReset = requisition.approvals.length === 0 || !!lastApproval?.is_superseded;

  return (
    <Grid container spacing={2}>
      {chainReset && (
        <Grid size={12} textAlign={'end'}>
          <ApprovalsActionTail
            requisition={requisition}
            isExpanded={isExpanded}
          />
        </Grid>
      )}
      <Grid size={12}>
        <ApprovalsListItem
          approvals={requisition.approvals}
          requisition={requisition}
        />
      </Grid>
    </Grid>
  );
}

export default ApprovalsTab;
