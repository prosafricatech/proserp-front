"use client";

import React from "react";
import { Divider, Grid, Tab, Tabs, useMediaQuery, Box } from "@mui/material";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useFormContext } from "react-hook-form";
import { SalesShift } from "../SalesShiftType";
import PumpReadingTab from "./PumpReadingTab";
import DippingTab from "./DippingTab";
import CashReconciliationTab from "./CashReconciliationTab";
import Adjustments from "./adjustments/Adjustments";
import FuelVouchers from "./fuelVouchers/FuelVouchers";

interface SalesShiftTabsProps {
  salesShift?: SalesShift;
  activeTab: number;
  onTabChange: (newValue: number) => void;
  isClosing?: boolean;
  showTabsOnly?: boolean;
  showContentOnly?: boolean;
}

const SalesShiftTabs: React.FC<SalesShiftTabsProps> = ({ 
  salesShift, 
  activeTab, 
  onTabChange,
  isClosing = false,
  showTabsOnly = false,
  showContentOnly = false
}) => {
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down("lg"));

  // ✅ Using parent form context to maintain data across tabs
  const { formState: { errors } } = useFormContext();

  // If showTabsOnly is true, return only the tabs
  if (showTabsOnly) {
    return (
      <Grid size={12}>
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
    );
  }

  // If showContentOnly is true, return only the tab content
  if (showContentOnly) {
    return (
      <Grid container sx={{ width: "100%", mt: 2 }}>
        {/* Pump Reading Tab */}
        <Grid size={12} sx={{ display: activeTab === 0 ? "block" : "none" }}>
          <PumpReadingTab salesShift={salesShift} isClosing={isClosing} />
        </Grid>
        
        {/* Fuel Voucher Tab */}
        <Grid size={12} sx={{ display: activeTab === 1 ? "block" : "none" }}>
          <FuelVouchers productPrices={[]} />
        </Grid>
        
        {/* Dipping Tab */}
        <Grid size={12} sx={{ display: activeTab === 2 ? "block" : "none" }}>
          <DippingTab/>
        </Grid>
        
        {/* Adjustments Tab - WRAP to prevent nested forms */}
        <Grid size={12} sx={{ display: activeTab === 3 ? "block" : "none" }}>
          <Box component="div">
            <Adjustments />
          </Box>
        </Grid>
        
        {/* Cash Reconciliation Tab */}
        <Grid size={12} sx={{ display: activeTab === 4 ? "block" : "none" }}>
          <CashReconciliationTab salesShift={salesShift} />
        </Grid>
      </Grid>
    );
  }

  // Default behavior - return both tabs and content
  return (
    <>
      <Grid size={12}>
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
          <FuelVouchers productPrices={[]} />
        </Grid>
        
        {/* Dipping Tab */}
        <Grid size={12} sx={{ display: activeTab === 2 ? "block" : "none" }}>
          <DippingTab/>
        </Grid>
        
        {/* Adjustments Tab - WRAP to prevent nested forms */}
        <Grid size={12} sx={{ display: activeTab === 3 ? "block" : "none" }}>
          <Box component="div">
            <Adjustments />
          </Box>
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