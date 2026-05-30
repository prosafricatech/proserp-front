'use client';

import React, { useState } from 'react';
import { AssignmentTurnedInOutlined } from '@mui/icons-material';
import { ButtonGroup, Dialog, IconButton, LinearProgress, Tooltip, useMediaQuery } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import requisitionsServices from '../../requisitionsServices';
import { PaymentApprovalRequisition } from '../ApprovalRequisitionType';
import ImprestRetirementForm from './form/ImprestRetirementForm';

interface ImprestRetirementActionTailProps {
  approvedRequisition: PaymentApprovalRequisition;
  isExpanded: boolean;
}

const ImprestRetirementActionTail: React.FC<ImprestRetirementActionTailProps> = ({
  approvedRequisition,
  isExpanded,
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [openDialog, setOpenDialog] = useState(false);

  const { data: approvedRequisitionDetails, isFetching } = useQuery({
    queryKey: ['requisitionDetails', { id: approvedRequisition.id }, 'imprest-retirement'],
    queryFn: async () => requisitionsServices.getApprovedRequisitionDetails(approvedRequisition.id),
    enabled: !!isExpanded && !!openDialog,
  });

  return (
    <>
      <Dialog
        maxWidth="lg"
        scroll={belowLargeScreen ? 'body' : 'paper'}
        fullWidth
        fullScreen={belowLargeScreen}
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        {isFetching ? (
          <LinearProgress />
        ) : (
          <ImprestRetirementForm
            toggleOpen={setOpenDialog}
            approvedRequisition={approvedRequisition}
            approvedDetails={approvedRequisitionDetails}
          />
        )}
      </Dialog>

      <ButtonGroup
        variant="outlined"
        size="small"
        disableElevation
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title="Retire Imprest">
          <IconButton onClick={() => setOpenDialog(true)}>
            <AssignmentTurnedInOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default React.memo(ImprestRetirementActionTail);
