'use client';

import { FactCheckOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { LoanRequest, LoanRequestApproval } from './LoanRequestType';
import { getNextPendingLoanLevel, getLoanApprovalDecision } from './loanApprovalUtils';

interface LoanApprovalItemActionProps {
  loanRequest: LoanRequest;
  approval: LoanRequestApproval;
  approvals: LoanRequestApproval[];
}

// PHASE 1 — visual only, mirrors LeaveApprovalItemAction's visibility rules.
// No Edit/Delete here: unlike leave/payroll, there's no per-approval
// update/delete endpoint for loans yet (only loanRequestChainDecision).
const LoanApprovalItemAction = ({
  loanRequest,
  approval,
  approvals,
}: LoanApprovalItemActionProps) => {
  const latestApproval = approvals[approvals.length - 1];
  const latestApprovalDecision = getLoanApprovalDecision(latestApproval);
  const pendingLevel = getNextPendingLoanLevel(loanRequest);
  const isLatestApproval = latestApproval?.id === approval?.id;

  const canNextApprove =
    isLatestApproval && latestApprovalDecision === 'approved' && !!pendingLevel;

  return (
    <>
      {canNextApprove && (
        <Tooltip title='Approve'>
          <IconButton size='small' onClick={() => {}}>
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LoanApprovalItemAction;
