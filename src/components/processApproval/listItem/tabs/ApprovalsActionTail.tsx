'use client'
import { FactCheckOutlined } from "@mui/icons-material";
import { 
  ButtonGroup, 
  Dialog, 
  IconButton, 
  LinearProgress, 
  Skeleton, 
  Tooltip, 
  useMediaQuery 
} from "@mui/material";
import React, { useContext, useState } from "react";
import ApprovalForm from "./form/ApprovalForm";
import { requisitionContext } from "../../Requisitions";
import requisitionsServices from "../../requisitionsServices";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Requisition } from "@/components/processApproval/RequisitionType";

interface ApprovalsActionTailProps {
  requisition: Requisition;
  isExpanded: boolean;
}

const ApprovalsActionTail: React.FC<ApprovalsActionTailProps> = ({ 
  requisition, 
  isExpanded 
}) => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const { isEditAction } = useContext(requisitionContext);
  const { hasOrganizationRole } = useJumboAuth();

  const { data: requisitionDetails, isPending } = useQuery({
    queryKey: ['requisitionDetails', { id: requisition.id }],
    queryFn: async () => await requisitionsServices.getRequisitionDetails(requisition.id),
    enabled: !isEditAction && isExpanded && openDialog,
    refetchOnWindowFocus: true
  });

  if (isPending) {
        return (
      <div style={{ width: '100%', padding: '16px' }}>
        <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
        <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
        <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
      </div>
    );
  }

  const canApprove = hasOrganizationRole(requisition?.next_approval_level?.role?.name as string) &&
    !(requisition.status?.toLowerCase() === 'suspended');

  return (
    <>
      <Dialog 
        maxWidth="lg" 
        fullWidth 
        scroll={belowLargeScreen ? 'body' : 'paper'} 
        fullScreen={belowLargeScreen} 
        open={openDialog}
      >
        {requisitionDetails && (
          <ApprovalForm 
            toggleOpen={setOpenDialog} 
            requisition={requisitionDetails} 
          />
        )}
      </Dialog>

      {canApprove && (
        <ButtonGroup 
          variant="outlined" 
          size="small" 
          disableElevation 
          sx={{ '& .MuiButton-root': { px: 1 } }}
        >
          <Tooltip title="Approve Requisition">
            <IconButton onClick={() => setOpenDialog(true)}>
              <FactCheckOutlined />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      )}
    </>
  );
};

export default ApprovalsActionTail;