"use client";

import React from "react";
import { readableDate } from "@/app/helpers/input-sanitization-helpers";
import { JumboScrollbar } from "@jumbo/components";
import { useJumboTheme } from "@jumbo/components/JumboTheme/hooks";
import {
  Alert,
  Grid,
  Typography,
  useMediaQuery,
} from "@mui/material";

interface Tank {
  tank: string;
  reading?: number;
  calculated_stock?: number;
  deviation?: number;
}

interface Reading {
  id: number | string;
  name: string;
  tanks: Tank[];
}

interface ReportData {
  id: number | string;
  name: string;
  report_data: {
    as_at: string;
    readings: Reading[];
  }[];
}

interface LatestDippingsProps {
  reportData?: ReportData[];
  selectedType: "calculated stock" | "deviation" | "reading";
}

function LatestDippings({ reportData, selectedType }: LatestDippingsProps) {
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Check if all stations have empty report_data
  const allReportsEmpty = reportData?.every(
    (station) => station.report_data?.length === 0
  );

  return (
    <>
      <Typography variant="h5" sx={{ paddingBottom: allReportsEmpty ? 1 : 0 }}>
        Most Recent
      </Typography>
      <JumboScrollbar
        autoHeight
        autoHeightMin={
          reportData?.length && reportData.length < 1
            ? 200
            : smallScreen
            ? 300
            : undefined
        }
        autoHide
        autoHideDuration={200}
        autoHideTimeout={500}
      >
        {allReportsEmpty ? (
          <Alert variant="outlined" severity="info">
            No Recents for the selected period
          </Alert>
        ) : (
          reportData?.map(
            (station) =>
              station.report_data?.length > 0 && (
                <Grid
                  container
                  spacing={1}
                  key={station.id}
                  marginTop={1}
                  borderTop={2}
                  borderColor={"#999"}
                >
                  <Grid size={{ xs: 12 }} p={1}>
                    <div>
                      {(() => {
                        const lastDipping =
                          station.report_data[
                            station.report_data.length - 1
                          ];
                        const lastDippingTime = lastDipping.as_at;

                        return (
                          <>
                            <Typography variant="h4">
                              <span style={{ fontWeight: "bold" }}>
                                {station.name}
                              </span>{" "}
                              <span>
                                ({readableDate(lastDippingTime, true)})
                              </span>
                            </Typography>
                            {lastDipping.readings.map((reading) => {
                              const tanks = reading.tanks;

                              // Calculate total reading
                              const totalReading = tanks.reduce(
                                (acc, tank) =>
                                  acc +
                                  (selectedType === "calculated stock"
                                    ? tank.calculated_stock ?? 0
                                    : selectedType === "deviation"
                                    ? tank.deviation ?? 0
                                    : tank.reading ?? 0),
                                0
                              );

                              return (
                                <Grid
                                  container
                                  spacing={1}
                                  key={reading.id}
                                  borderTop={1}
                                  borderColor={"divider"}
                                >
                                  <Grid size={{ xs: 12, md: 3 }}>
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight="bold"
                                    >
                                      {reading.name}
                                    </Typography>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 9 }}>
                                    {tanks.map((tank, tankIndex) => (
                                      <Grid
                                        container
                                        spacing={1}
                                        key={tankIndex}
                                        borderTop={1}
                                        borderColor={"divider"}
                                        mb={0.5}
                                      >
                                        <Grid size={{ xs: 6, md: 8 }}>
                                          <Typography>{tank.tank}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6, md: 4 }}>
                                          <Typography align="right">
                                            {(
                                              selectedType === "calculated stock"
                                                ? tank.calculated_stock
                                                : selectedType === "deviation"
                                                ? tank.deviation
                                                : tank.reading
                                            )?.toLocaleString()}
                                          </Typography>
                                        </Grid>
                                      </Grid>
                                    ))}
                                    {/* Total reading */}
                                    <Grid
                                      container
                                      spacing={1}
                                      borderTop={2}
                                      mb={{ xs: 2, lg: 1 }}
                                      borderColor={"divider"}
                                      pb={0.3}
                                    >
                                      <Grid size={{ xs: 6, md: 7 }}>
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight="bold"
                                        >
                                          Total
                                        </Typography>
                                      </Grid>
                                      <Grid size={{ xs: 6, md: 5 }}>
                                        <Typography
                                          align="right"
                                          variant="subtitle1"
                                          fontWeight="bold"
                                        >
                                          {totalReading.toLocaleString()}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  </Grid>
                </Grid>
              )
          )
        )}
      </JumboScrollbar>
    </>
  );
}

export default LatestDippings;
