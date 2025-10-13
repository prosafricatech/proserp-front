"use client";

import React from "react";
import { Divider, Grid, Tab, Tabs, useMediaQuery } from "@mui/material";
import { useJumboAuth } from "@/app/providers/JumboAuthProvider";
import { PERMISSIONS } from "@/utilities/constants/permissions";
import ShiftTeamTab from "./ShiftTeamTab";
import FuelPumpTab from "./FuelPumpTab";
import { Station } from "./StationType";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import { useFormContext } from "react-hook-form";

interface StationTabsProps {
  station?: Station;
  activeTab: number;
  onTabChange: (newValue: number) => void;
}

const StationTabs: React.FC<StationTabsProps> = ({ 
  station, 
  activeTab, 
  onTabChange 
}) => {
  const { checkOrganizationPermission } = useJumboAuth();
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down("lg"));
  const canCreateOrEdit = checkOrganizationPermission([
    PERMISSIONS.FUEL_STATIONS_CREATE,
    PERMISSIONS.FUEL_STATIONS_UPDATE,
  ]);

  // ✅ now using parent form context
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
          <Tab label="Shift Team" />
          <Tab label="Fuel Pump" />
        </Tabs>
      </Grid>
      <Grid container sx={{ width: "100%", mt: 2 }}>
        <Grid size={12} sx={{ display: activeTab === 0 ? "block" : "none" }}>
          <ShiftTeamTab station={station} />
        </Grid>
        <Grid size={12} sx={{ display: activeTab === 1 ? "block" : "none" }}>
          <FuelPumpTab station={station} />
        </Grid>
      </Grid>
    </>
  );
};

export default StationTabs;