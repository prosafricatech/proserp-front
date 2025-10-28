"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface AdjustmentsTabProps {
  salesShift?: any;
}

const AdjustmentsTab: React.FC<AdjustmentsTabProps> = ({ salesShift }) => {
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
        This is adjustmentstab
      </Typography>
    </Box>
  );
};

export default AdjustmentsTab;