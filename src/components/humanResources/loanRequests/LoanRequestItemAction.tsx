'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  CancelOutlined,
  CheckCircleOutlined,
  HighlightOffOutlined,
  PaymentsOutlined,
} from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import LoanDirectDecisionForm, {
  LoanDirectDecisionMode,
} from './LoanDirectDecisionForm';
import { LoanRequestType } from './LoanRequestType';

// PHASE 3 — direct (no-chain) approve/reject wired up. Cancel/Disburse are
// still visual-only placeholders, see notes below and known-issues-cleanup.md.
const LoanRequestItemAction = ({
  loanRequest,
}: {
  loanRequest: LoanRequestType;
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [decisionMode, setDecisionMode] =
    useState<LoanDirectDecisionMode | null>(null);

  const isDirectFlow = !loanRequest.approval_chain_id;

  const canDirectDecide = isDirectFlow && loanRequest.status === 'in_review';

  const canCancel =
    ['in_review', 'approved'].includes(loanRequest.status) &&
    !loanRequest.disbursed_at;

  const canDisburse =
    loanRequest.status === 'approved' && !loanRequest.disbursed_at;

  return (
    <>
      {decisionMode && (
        <LoanDirectDecisionForm
          open={!!decisionMode}
          mode={decisionMode}
          loanRequest={loanRequest}
          belowLargeScreen={belowLargeScreen}
          onClose={() => setDecisionMode(null)}
        />
      )}

      {canDirectDecide && (
        <>
          <Tooltip title='Approve'>
            <IconButton size='small' onClick={() => setDecisionMode('approve')}>
              <CheckCircleOutlined color='success' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Reject'>
            <IconButton size='small' onClick={() => setDecisionMode('reject')}>
              <HighlightOffOutlined color='error' />
            </IconButton>
          </Tooltip>
        </>
      )}

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
