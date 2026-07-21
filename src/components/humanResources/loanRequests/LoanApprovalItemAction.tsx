'use client';

import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import LoanApprovalForm from './LoanApprovalForm';
import { LoanRequestApproval, LoanRequestType } from './LoanRequestType';
import {
  getLoanApprovalDecision,
  getNextPendingLoanLevel,
} from './loanApprovalUtils';

interface LoanApprovalItemActionProps {
  loanRequest: LoanRequestType;
  approval: LoanRequestApproval;
  approvals: LoanRequestApproval[];
}

const LoanApprovalItemAction = ({
  loanRequest,
  approval,
  approvals,
}: LoanApprovalItemActionProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const latestApproval = approvals[approvals.length - 1];
  const latestApprovalDecision = getLoanApprovalDecision(latestApproval);
  const pendingLevel = getNextPendingLoanLevel(loanRequest);
  const isLatestApproval = latestApproval?.id === approval?.id;

  const canNextApprove =
    isLatestApproval && latestApprovalDecision === 'approved' && !!pendingLevel;

  return (
    <>
      <LoanApprovalForm
        open={openDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenDialog(false)}
      />

      {canNextApprove && (
        <Tooltip title='Approve'>
          <IconButton size='small' onClick={() => setOpenDialog(true)}>
            <FactCheckOutlined />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};

export default LoanApprovalItemAction;
