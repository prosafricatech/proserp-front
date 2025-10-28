"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface CashReconciliationTabProps {
  salesShift?: any;
}

const CashReconciliationTab: React.FC<CashReconciliationTabProps> = ({ salesShift }) => {
  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <Typography variant="h6">
        This is cashreconciliation
      </Typography>
    </Box>
  );
};

export default CashReconciliationTab;