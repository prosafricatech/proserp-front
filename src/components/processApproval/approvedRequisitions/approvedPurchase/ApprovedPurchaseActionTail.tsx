'use client'
import { ShoppingCartOutlined } from "@mui/icons-material";
import { ButtonGroup, Dialog, IconButton, LinearProgress, Tooltip, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import requisitionsServices from "../../requisitionsServices";
import ApprovedPurchaseForm from "./form/ApprovedPurchaseForm";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useQuery } from "@tanstack/react-query";
import { PurchaseApprovalRequisition } from "../ApprovalRequisitionType";

interface ApprovedPurchaseActionTailProps {
  approvedRequisition: PurchaseApprovalRequisition;
  isExpanded: boolean;
}

const ApprovedPurchaseActionTail: React.FC<ApprovedPurchaseActionTailProps> = ({
  approvedRequisition, 
  isExpanded
}) => {
  const { theme } = useJumboTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: approvedRequisitionDetails, isFetching, error } = useQuery({
    queryKey: ['requisitionDetails', { id: approvedRequisition.id }],
    queryFn: async () => await requisitionsServices.getApprovedRequisitionDetails(approvedRequisition.id),
    enabled: isExpanded && openDialog,
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  if (error) {
    console.error("Error loading requisition details:", error);
    return null; 
  }

  return (
    <>
      <Dialog 
        maxWidth="xl" 
        scroll={belowLargeScreen ? 'body' : 'paper'} 
        fullWidth 
        fullScreen={belowLargeScreen} 
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        {approvedRequisitionDetails && (
          <ApprovedPurchaseForm 
            toggleOpen={setOpenDialog} 
            approvedDetails={approvedRequisitionDetails} 
            approvedRequisition={approvedRequisition}
          />
        )}
      </Dialog>

      <ButtonGroup 
        variant="outlined" 
        size="small" 
        disableElevation 
        sx={{ '& .MuiButton-root': { px: 1 } }}
      >
        <Tooltip title="Order">
          <IconButton onClick={() => setOpenDialog(true)}>
            <ShoppingCartOutlined />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
    </>
  );
};

export default React.memo(ApprovedPurchaseActionTail);