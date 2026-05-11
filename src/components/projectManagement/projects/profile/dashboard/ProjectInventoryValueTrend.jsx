import { Alert, Box } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { shortNumber } from '@/app/helpers/input-sanitization-helpers';

function ProjectInventoryValueTrend({ data = [] }) {
  const { theme } = useJumboTheme();
  const textColor = theme.palette.text.primary;

  if (!data.length) {
    return (
      <Alert variant='outlined' severity='info'>
        No inventory values found for trend
      </Alert>
    );
  }

  const areaKeys = Object.keys(data[0]).filter(
    (key) => key !== 'name' && key !== 'Total Value'
  );
  const colorCodes = {};

  areaKeys.forEach((key) => {
    const randomColor =
      '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    colorCodes[key] = randomColor;
  });

  return (
    <Box sx={{ width: '100%', height: 360, pt: 2 }}>
      <ResponsiveContainer width='100%' height='100%'>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke={theme.palette.divider}
          />
          <XAxis dataKey='name' stroke={textColor} />
          <YAxis tickFormatter={shortNumber} stroke={textColor} />
          <RechartTooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              color: textColor,
            }}
            labelStyle={{ color: textColor }}
            itemStyle={{ color: textColor }}
            cursor={{ stroke: theme.palette.divider }}
            formatter={(value) =>
              Number(value || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          />
          {areaKeys.map((key, index) => {
            const color = colorCodes[key];

            return (
              <Area
                key={key}
                type='monotone'
                dataKey={key}
                stackId='1'
                stroke={color}
                fill={color}
                fillOpacity={0.25}
                strokeOpacity={0.7}
              />
            );
          })}
          <Line
            type='monotone'
            dataKey='Total Value'
            dot={false}
            stroke='#1976d2'
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default ProjectInventoryValueTrend;