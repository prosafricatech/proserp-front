"use client";

import React from "react";
import { Divider, Grid, Tab, Tabs, useMediaQuery } from "@mui/material";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useFormContext } from "react-hook-form";
import { SalesShift } from "../SalesShiftType";
import PumpReadingTab from "./PumpReadingTab";
import AdjustmentsTab from "./AdjustmentsTab";
import DippingTab from "./DippingTab";
import CashReconciliationTab from "./CashReconciliationTab";
import FuelVoucherTab from "./FuelVoucherTab";

interface SalesShiftTabsProps {
  salesShift?: SalesShift;
  activeTab: number;
  onTabChange: (newValue: number) => void;
  isClosing?: boolean;
}

const SalesShiftTabs: React.FC<SalesShiftTabsProps> = ({ 
  salesShift, 
  activeTab, 
  onTabChange,
  isClosing = false
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down("lg"));

  // ✅ Using parent form context to maintain data across tabs
  const { formState: { errors } } = useFormContext();

  return (
    <>
      <Grid size={12}>
        <Divider />
        <Tabs
          value={activeTab}
          onChange={(e, newValue: number) => onTabChange(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Pump Reading" />
          <Tab label="Fuel Voucher" />
          <Tab label="Dipping" />
          <Tab label="Adjustments" />
          <Tab label="Cash Reconciliation" />
        </Tabs>
      </Grid>
      
      <Grid container sx={{ width: "100%", mt: 2 }}>
        {/* Pump Reading Tab */}
        <Grid size={12} sx={{ display: activeTab === 0 ? "block" : "none" }}>
          <PumpReadingTab salesShift={salesShift} isClosing={isClosing} />
        </Grid>
        
        {/* Fuel Voucher Tab */}
        <Grid size={12} sx={{ display: activeTab === 1 ? "block" : "none" }}>
          <FuelVoucherTab salesShift={salesShift} />
        </Grid>
        
        {/* Dipping Tab */}
        <Grid size={12} sx={{ display: activeTab === 2 ? "block" : "none" }}>
          <DippingTab salesShift={salesShift} />
        </Grid>
        
        {/* Adjustments Tab */}
        <Grid size={12} sx={{ display: activeTab === 3 ? "block" : "none" }}>
          <AdjustmentsTab salesShift={salesShift} />
        </Grid>
        
        {/* Cash Reconciliation Tab */}
        <Grid size={12} sx={{ display: activeTab === 4 ? "block" : "none" }}>
          <CashReconciliationTab salesShift={salesShift} />
        </Grid>
      </Grid>
    </>
  );
};

export default SalesShiftTabs;