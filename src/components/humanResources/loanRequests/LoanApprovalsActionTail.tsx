'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import LoanApprovalForm from './LoanApprovalForm';
import { LoanRequestType } from './LoanRequestType';
import { getNextPendingLoanLevel } from './loanApprovalUtils';

interface LoanApprovalsActionTailProps {
  loanRequest: LoanRequestType;
}

const LoanApprovalsActionTail = ({
  loanRequest,
}: LoanApprovalsActionTailProps) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingLoanLevel(loanRequest);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (loanRequest.status || '').toLowerCase();

  const hasLoanEditPermission = checkOrganizationPermission(
    PERMISSIONS.LOANS_EDIT
  );

  const canApprove =
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    !['approved', 'rejected', 'cancelled'].includes(normalizedStatus);

  if (!canApprove) return null;

  return (
    <>
      <LoanApprovalForm
        open={openDialog}
        loanRequest={loanRequest}
        belowLargeScreen={belowLargeScreen}
        onClose={() => setOpenDialog(false)}
      />

      {hasLoanEditPermission && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Loan Request'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default LoanApprovalsActionTail;
