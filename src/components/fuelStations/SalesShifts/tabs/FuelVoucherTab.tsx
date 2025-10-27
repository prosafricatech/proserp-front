"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface FuelVoucherTabProps {
  salesShift?: any;
}

const FuelVoucherTab: React.FC<FuelVoucherTabProps> = ({ salesShift }) => {
  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Typography variant="h6">
        This is fuelvouchertab
      </Typography>
    </Box>
  );
};

export default FuelVoucherTab;