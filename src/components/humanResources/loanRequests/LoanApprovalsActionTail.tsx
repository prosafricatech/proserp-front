'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip } from '@mui/material';
import { LoanRequest } from './LoanRequestType';
import { getNextPendingLoanLevel } from './loanApprovalUtils';

interface LoanApprovalsActionTailProps {
  loanRequest: LoanRequest;
}

// PHASE 1 — visual only, mirrors LeaveApprovalsActionTail. Shown only when
// there's no approval decision yet (approvals.length === 0), same as leave.
const LoanApprovalsActionTail = ({ loanRequest }: LoanApprovalsActionTailProps) => {
  const { hasOrganizationRole } = useJumboAuth();

  const pendingLevel = getNextPendingLoanLevel(loanRequest);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (loanRequest.status || '').toLowerCase();

  const canApprove =
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    !['approved', 'rejected', 'cancelled'].includes(normalizedStatus);

  if (!canApprove) return null;

  return (
    <ButtonGroup
      variant='outlined'
      size='small'
      disableElevation
      sx={{ '& .MuiButton-root': { px: 1 } }}
    >
      <Tooltip title='Approve Loan Request'>
        <IconButton onClick={() => {}}>
          <FactCheckOutlined />
        </IconButton>
      </Tooltip>
    </ButtonGroup>
  );
};

export default LoanApprovalsActionTail;
