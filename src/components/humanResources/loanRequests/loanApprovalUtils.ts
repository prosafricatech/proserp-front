import { LoanRequestApproval, LoanRequestType } from './LoanRequestType';

export type LoanApprovalDecision =
  | 'approved'
  | 'rejected'
  | 'on hold'
  | 'unknown';

export const getLoanApprovalDecision = (
  approval: LoanRequestApproval | undefined
): LoanApprovalDecision => {
  const status = String(approval?.status || '').toLowerCase();
  const label = String(approval?.status_label || '').toLowerCase();

  if (status === 'rejected' || label === 'rejected') return 'rejected';
  if (status === 'on hold' || label === 'on hold') return 'on hold';
  if (status === 'approved' || label === 'approved') return 'approved';

  return 'unknown';
};

export const getNextPendingLoanLevel = (
  loanRequest: LoanRequestType | undefined
) => {
  if (!loanRequest) return undefined;

  const levels = [...(loanRequest.approval_chain?.levels || [])].sort(
    (a, b) => Number(a.position_index || 0) - Number(b.position_index || 0)
  );

  if (!levels.length) return undefined;

  const approvals = loanRequest.approvals || [];
  const latestApproval = approvals[approvals.length - 1];
  if (!latestApproval) return levels[0];

  if (getLoanApprovalDecision(latestApproval) !== 'approved') return undefined;

  const latestLevelId = Number(
    latestApproval.chain_level_id || latestApproval.approval_chain_level_id
  );

  if (!latestLevelId) return levels[0];

  const latestLevelIndex = levels.findIndex(
    (level) => Number(level.id) === latestLevelId
  );

  if (latestLevelIndex < 0) return undefined;

  return levels[latestLevelIndex + 1];
};
