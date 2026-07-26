'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { FactCheckOutlined } from '@mui/icons-material';
import { ButtonGroup, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import LeaveApprovalDialog, {
  getNextPendingLeaveLevel,
} from './LeaveApprovalDialog';
import { LeaveRequestType } from './LeaveRequestType';

interface LeaveApprovalsActionTailProps {
  leaveRequest: LeaveRequestType;
}

const LeaveApprovalsActionTail = ({
  leaveRequest,
}: LeaveApprovalsActionTailProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { hasOrganizationRole, checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const pendingLevel = getNextPendingLeaveLevel(leaveRequest);
  const pendingRoleName = pendingLevel?.role?.name || '';
  const normalizedStatus = (leaveRequest.status || '').toLowerCase();

  const canEditRequest = checkOrganizationPermission(
    PERMISSIONS.LEAVE_REQUESTS_EDIT
  );

  const canApprove =
    !!pendingLevel &&
    (!pendingRoleName || hasOrganizationRole(pendingRoleName)) &&
    !['approved', 'rejected', 'cancelled'].includes(normalizedStatus) &&
    canEditRequest;

  return (
    <>
      <LeaveApprovalDialog
        open={openDialog}
        isEditMode={false}
        belowLargeScreen={belowLargeScreen}
        leaveRequest={leaveRequest}
        onClose={() => setOpenDialog(false)}
      />

      {canApprove && (
        <ButtonGroup
          variant='outlined'
          size='small'
          disableElevation
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title='Approve Leave Request'>
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default LeaveApprovalsActionTail;
