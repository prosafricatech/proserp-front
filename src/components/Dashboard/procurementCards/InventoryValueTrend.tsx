import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import React, { useEffect, useState } from 'react';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import {
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import {
  Area,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { useDashboardSettings } from '../Dashboard';
import dayjs from 'dayjs';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { shortNumber } from '@/app/helpers/input-sanitization-helpers';

interface GroupedValue {
  balanceValue?: number;
}

interface InventoryValueItem {
  asOf: string;
  groupedValues?: Record<string, GroupedValue>;
}

interface ProcessedInventoryValue {
  name: string;
  [key: string]: number | string;
}

function InventoryValueTrend() {
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const xlScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const textColor = theme.palette.text.primary;

  const { chartFilters: { from, to, cost_center_ids } } = useDashboardSettings();
  const [params, setParams] = useState({
    from,
    to,
    cost_center_ids,
    aggregate_by: 'day' as 'day' | 'week' | 'month' | 'year'
  });

  useEffect(() => {
    setParams(prevParams => ({ ...prevParams, from, to, cost_center_ids }));
  }, [from, to, cost_center_ids]);

  const processInventoryValues = (data: InventoryValueItem[], aggregateBy: string): ProcessedInventoryValue[] => {
    if (!data || data.length === 0) return [];

    const latestTimestamp = data[data.length - 1];
    const sortedCategories = Object.entries(latestTimestamp.groupedValues || {})
      .map(([key, value]) => ({ key, value: value.balanceValue || 0 }))
      .sort((a, b) => b.value - a.value);

    const top5Categories = sortedCategories.slice(0, 5).map(item => item.key);

    return data.map(item => {
      const transformedItem: ProcessedInventoryValue = {
        name: aggregateBy === 'day' ? dayjs(item.asOf).format('ddd, MMM D, YYYY') : item.asOf
      };

      let totalValue = 0;
      let othersValue = 0;

      top5Categories.forEach(category => {
        const value = item.groupedValues?.[category]?.balanceValue || 0;
        transformedItem[category] = value;
        totalValue += value;
      });

      Object.keys(item.groupedValues || {}).forEach(category => {
        if (!top5Categories.includes(category)) {
          othersValue += item.groupedValues![category].balanceValue || 0;
        }
      });

      if (othersValue > 0) {
        transformedItem['Others'] = othersValue;
        totalValue += othersValue;
      }

      transformedItem['Total Value'] = totalValue;

      return transformedItem;
    });
  };

  const { data: inventoryValues = [], isLoading } = useQuery({
    queryKey: ['inventoryValueTrend', params],
    queryFn: async () => {
      const stockValues = await financialReportsServices.inventoryValue({
        from: params.from,
        to: params.to,
        cost_center_ids: params.cost_center_ids,
        aggregate_by: params.aggregate_by,
        group_by: 'product_category'
      });

      return processInventoryValues(stockValues, params.aggregate_by);
    }
  });

  // Generate dynamic colors
  const colorCodes: Record<string, string> = {};
  if (inventoryValues.length > 0) {
    for (const key in inventoryValues[0]) {
      if (key !== 'name') {
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        colorCodes[key] = randomColor;
      }
    }
  }

  const renderAreas = inventoryValues.length > 0 &&
    Object.keys(inventoryValues[0])
      .filter((key) => key !== 'name' && key !== 'Total Value')
      .map((key) => (
        <Area
          key={key}
          type="monotone"
          dataKey={key}
          stackId="1"
          stroke={colorCodes[key]}
          fill={colorCodes[key]}
          fillOpacity={0.3}
          strokeOpacity={0.6}
        />
      ));

  return (
    <JumboCardQuick
      title={'Inventory Value'}
      sx={{
        height: xlScreen ? 310 : null
      }}
      action={
        !smallScreen ? (
          <ButtonGroup variant="outlined" size="small" disableElevation>
            <Tooltip title="Daily Trend">
              <Button
                variant={params.aggregate_by === "day" ? "contained" : "outlined"}
                onClick={() => setParams(prev => ({ ...prev, aggregate_by: 'day' }))}
              >Daily</Button>
            </Tooltip>
            <Tooltip title="Weekly Trend">
              <Button
                variant={params.aggregate_by === "week" ? "contained" : "outlined"}
                onClick={() => setParams(prev => ({ ...prev, aggregate_by: 'week' }))}
              >Weekly</Button>
            </Tooltip>
            <Tooltip title="Monthly Trend">
              <Button
                variant={params.aggregate_by === "month" ? "contained" : "outlined"}
                onClick={() => setParams(prev => ({ ...prev, aggregate_by: 'month' }))}
              >Monthly</Button>
            </Tooltip>
            <Tooltip title="Yearly Trend">
              <Button
                variant={params.aggregate_by === "year" ? "contained" : "outlined"}
                onClick={() => setParams(prev => ({ ...prev, aggregate_by: 'year' }))}
              >Yearly</Button>
            </Tooltip>
          </ButtonGroup>
        ) : (
          <Div sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="inventory-value-trend-group-by-input-label">Interval</InputLabel>
              <Select
                labelId="inventory-value-trend-group-by-label"
                id="inventory-value-trend-group-by"
                value={params.aggregate_by}
                label="Interval"
                onChange={(e) =>
                  setParams(prev => ({ ...prev, aggregate_by: e.target.value as 'day' | 'week' | 'month' | 'year' }))
                }
              >
                <MenuItem value="day">Daily</MenuItem>
                <MenuItem value="week">Weekly</MenuItem>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Div>
        )
      }
    >
      {isLoading ? (
        <LinearProgress />
      ) : (
        <ResponsiveContainer width="100%" height={xlScreen ? 200 : 238}>
          <ComposedChart data={inventoryValues}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="name" stroke={textColor} />
            <YAxis tickFormatter={shortNumber} stroke={textColor} />
            <RechartTooltip
              contentStyle={{ backgroundColor: theme.palette.background.paper, color: textColor }}
              labelStyle={{ color: textColor }}
              itemStyle={{ color: textColor }}
              cursor={{ stroke: theme.palette.divider }}
              formatter={(value: number) =>
                value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            />
            {renderAreas}
            <Line type="monotone" dataKey="Total Value" dot={false} stroke="#1976d2" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </JumboCardQuick>
  );
}

export default InventoryValueTrend;
