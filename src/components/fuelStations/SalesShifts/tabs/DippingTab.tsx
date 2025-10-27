"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface DippingTabProps {
  salesShift?: any;
}

const DippingTab: React.FC<DippingTabProps> = ({ salesShift }) => {
  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Typography variant="h6">
        This is dipping
      </Typography>
    </Box>
  );
};

export default DippingTab;