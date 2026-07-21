'use client';

import { CancelOutlined, PaymentsOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { LoanRequestType } from './LoanRequestType';

// PHASE 1 — visual only. Buttons show/hide with the correct rules already,
// but do nothing on click yet. Wiring (dialogs + mutations) comes next phase.
const LoanRequestItemAction = ({
  loanRequest,
}: {
  loanRequest: LoanRequestType;
}) => {
  const canCancel =
    ['in_review', 'approved'].includes(loanRequest.status) &&
    !loanRequest.disbursed_at;

  const canDisburse =
    loanRequest.status === 'approved' && !loanRequest.disbursed_at;

  return (
    <>
      {canDisburse && (
        <Tooltip title='Disburse'>
          <IconButton size='small' onClick={() => {}}>
            <PaymentsOutlined color='success' />
          </IconButton>
        </Tooltip>
      )}

      {canCancel && (
        <Tooltip title='Cancel'>
          <IconButton size='small' onClick={() => {}}>
            <CancelOutlined color='warning' />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LoanRequestItemAction;
