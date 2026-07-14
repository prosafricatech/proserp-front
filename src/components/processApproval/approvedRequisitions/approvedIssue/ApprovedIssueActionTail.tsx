'use client'

import React, { useState } from 'react';
import { Inventory2Outlined } from '@mui/icons-material';
import {
  ButtonGroup,
  Dialog,
  IconButton,
  LinearProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import requisitionsServices from '../../requisitionsServices';
import { MaterialApprovalRequisition } from '../ApprovalRequisitionType';
import ApprovedIssueForm from './form/ApprovedIssueForm';

interface ApprovedIssueActionTailProps {
  approvedRequisition: MaterialApprovalRequisition;
  isExpanded: boolean;
}

function ApprovedIssueActionTail({
  approvedRequisition,
  isExpanded,
}: ApprovedIssueActionTailProps) {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openDialog, setOpenDialog] = useState(false);

  const { data: approvedRequisitionDetails, isFetching } = useQuery({
    queryKey: ['requisitionDetails', { id: approvedRequisition.id, lane: 'issues' }],
    queryFn: async () =>
      requisitionsServices.getApprovedRequisitionDetails(approvedRequisition.id),
    enabled: !!isExpanded && !!openDialog,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <>
      <Dialog
        maxWidth='lg'
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        {approvedRequisitionDetails && (
          <ApprovedIssueForm
            toggleOpen={setOpenDialog}
            approvedDetails={approvedRequisitionDetails}
            approvedRequisition={approvedRequisition}
          />
        )}
      </Dialog>

      <ButtonGroup
        variant='outlined'
        size='small'
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title='Issue from Store'>
          <IconButton onClick={() => setOpenDialog(true)}>
            <Inventory2Outlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
}

export default React.memo(ApprovedIssueActionTail);
