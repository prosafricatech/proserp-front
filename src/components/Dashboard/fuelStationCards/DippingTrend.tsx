"use client";

import React, { useMemo } from "react";
import { Alert, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import dayjs from "dayjs";
import { COLORS } from "@/utilities/constants/colors";

// ---------- Types ----------
interface Tank {
  calculated_stock: number;
  deviation: number;
  reading: number;
}

interface Reading {
  name: string;
  tanks: Tank[];
}

interface Report {
  as_at: string;
  readings: Reading[];
}

interface Station {
  report_data?: Report[];
}

export type SelectedType = "calculated stock" | "deviation" | "reading";

interface DippingTrendProps {
  reportData: Station[];
  selectedType: SelectedType;
}

interface ChartPoint {
  time: Date;
  value: number;
}

interface ChartDataset {
  name: string;
  data: ChartPoint[];
}

// ---------- Data Builder ----------
function generateChartData(
  stations: Station[],
  selectedType: SelectedType
): ChartDataset[] {
  const timestamps = new Set<string>();
  const series: Record<string, ChartPoint[]> = {};

  stations.forEach((station) => {
    station.report_data?.forEach((r) => {
      timestamps.add(r.as_at);
    });
  });

  Array.from(timestamps)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .forEach((ts) => {
      const totals: Record<string, number> = {};

      stations.forEach((station) => {
        const report = station.report_data?.find(
          (r) => new Date(r.as_at).getTime() === new Date(ts).getTime()
        );

        report?.readings?.forEach((reading) => {
          const sum = reading.tanks.reduce((acc, t) => {
            switch (selectedType) {
              case "calculated stock":
                return acc + t.calculated_stock;
              case "deviation":
                return acc + t.deviation;
              default:
                return acc + t.reading;
            }
          }, 0);

          totals[reading.name] = (totals[reading.name] || 0) + sum;
        });
      });

      Object.entries(totals).forEach(([name, value]) => {
        if (!series[name]) series[name] = [];
        series[name].push({
          time: new Date(ts),
          value,
        });
      });
    });

  return Object.keys(series).map((name) => ({
    name,
    data: series[name],
  }));
}

// ---------- Tooltip ----------
interface CustomTooltipProps extends TooltipProps<number, string> {}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  const theme = useTheme();

  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        padding: 10,
        borderRadius: 8,
        boxShadow: theme.shadows[3],
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        {dayjs(label as string).format("dddd, MMM D, YYYY")}
      </Typography>

      {payload.map((item, idx) => (
        <Typography key={idx} variant="body2">
          {item.name}: {item.value?.toLocaleString()}
        </Typography>
      ))}
    </div>
  );
};

// ---------- High-Contrast Color Helper ----------
function getSeriesColor(index: number, theme: any): string {
  const paletteFallback = [
    theme.palette.primary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];

  return paletteFallback[index] ?? COLORS[index % COLORS.length];
}

// ---------- Component ----------
const DippingTrend: React.FC<DippingTrendProps> = ({
  reportData,
  selectedType,
}) => {
  const theme = useTheme();

  const chartData = useMemo(
    () => generateChartData(reportData, selectedType),
    [reportData, selectedType]
  );

  const mergedData = chartData.reduce<Record<string, any>>((acc, ds) => {
    ds.data.forEach(({ time, value }) => {
      const key = time.toISOString();
      if (!acc[key]) acc[key] = { time };
      acc[key][ds.name] = value;
    });
    return acc;
  }, {});

  const finalData = Object.values(mergedData);

  return (
    <div>
      <Typography mb={2} variant="h5">
        Dipping Trend
      </Typography>

      <ResponsiveContainer width="100%" height={230}>
        {finalData.length ? (
          <LineChart data={finalData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
              opacity={0.4}
            />

            <XAxis
              dataKey="time"
              tickFormatter={(t) => dayjs(t).format("ddd, MMM D")}
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 11 }}
            />

            <YAxis
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 10 }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{
                color: theme.palette.text.primary,
                fontSize: 12,
                paddingBottom: 28,
              }}
            />

            {chartData.map((ds, index) => (
              <Line
                key={ds.name}
                type="monotone"
                dataKey={ds.name}
                stroke={getSeriesColor(index, theme)}
                strokeWidth={1.2} 
                dot={false}
                activeDot={{
                  r: 3,
                  stroke: theme.palette.background.paper,
                  strokeWidth: 1,
                }}
              />
            ))}
          </LineChart>
        ) : (
          <Alert
            variant="outlined"
            severity="info"
            sx={{
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
            }}
          >
            No Trend for the selected period
          </Alert>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default DippingTrend;
