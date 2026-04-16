'use client'
import { CreditScoreOutlined } from "@mui/icons-material";
import { 
  ButtonGroup, 
  Dialog, 
  IconButton, 
  LinearProgress, 
  Skeleton, 
  Tooltip, 
  useMediaQuery 
} from "@mui/material";
import React, { useState } from "react";
import requisitionsServices from "../../requisitionsServices";
import ApprovedPaymentForm from "./form/ApprovedPaymentForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useQuery } from "@tanstack/react-query";
import { ApprovalRequisition } from "../ApprovalRequisitionType";

interface ApprovedPaymentActionTailProps {
  approvedRequisition: ApprovalRequisition;
  isExpanded: boolean;
}

const ApprovedPaymentActionTail: React.FC<ApprovedPaymentActionTailProps> = ({
  approvedRequisition, 
  isExpanded
}) => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { 
    data: approvedRequisitionDetails, 
    isFetching 
  } = useQuery({
    queryKey: ['requisitionDetails', { id: approvedRequisition.id }],
    queryFn: async () => 
      requisitionsServices.getApprovedRequisitionDetails(approvedRequisition.id),
    enabled: !!isExpanded && !!openDialog,
  });

  if (isFetching) {
        return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <React.Fragment>
      <Dialog 
        maxWidth="lg" 
        scroll={belowLargeScreen ? 'body' : 'paper'} 
        fullWidth 
        fullScreen={belowLargeScreen} 
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <ApprovedPaymentForm 
          toggleOpen={setOpenDialog} 
          approvedDetails={approvedRequisitionDetails} 
          approvedRequisition={approvedRequisition}
        />
      </Dialog>

      <ButtonGroup 
        variant="outlined" 
        size="small" 
        disableElevation 
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title="Pay">
          <IconButton onClick={() => setOpenDialog(true)}>
            <CreditScoreOutlined/>
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </React.Fragment>
  );
};

export default React.memo(ApprovedPaymentActionTail);