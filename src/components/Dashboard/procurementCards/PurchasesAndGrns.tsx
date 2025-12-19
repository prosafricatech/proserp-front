'use client'
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import React, { useEffect, useState } from 'react';
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
import { useDashboardSettings } from '../Dashboard';
import purchaseServices from '../../procurement/purchases/purchase-services';
import grnServices from '../../procurement/grns/grn-services';
import {
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  Bar,
  ComposedChart,
  Legend
} from 'recharts';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { shortNumber } from '@/app/helpers/input-sanitization-helpers';

interface ChartDataItem {
  period: string;
  amount: number;
}

interface MergedDataItem {
  name: string;
  Purchases: number;
  GRNs: number;
}

function PurchasesAndGrns() {
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));
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
    setParams(prev => ({ ...prev, from, to, cost_center_ids }));
  }, [from, to, cost_center_ids]);

  const { data: mergedData = [], isLoading } = useQuery({
    queryKey: ['purchasesChart', params],
    queryFn: async () => {
      const purchaseValues: ChartDataItem[] = await purchaseServices.purchaseValues(params);
      const grnValues: ChartDataItem[] = await grnServices.grnValues(params);
      const mergedArray: MergedDataItem[] = [];

      purchaseValues.forEach(purchase => {
        const grn = grnValues.find(g => g.period === purchase.period);
        mergedArray.push({
          name: purchase.period,
          Purchases: purchase.amount,
          GRNs: grn ? grn.amount : 0
        });
      });

      grnValues.forEach(grn => {
        if (!purchaseValues.some(p => p.period === grn.period)) {
          mergedArray.push({
            name: grn.period,
            Purchases: 0,
            GRNs: grn.amount
          });
        }
      });

      mergedArray.sort((a, b) => a.name.localeCompare(b.name));

      return mergedArray.map(item => ({
        ...item,
        name: params.aggregate_by === 'day' ? dayjs(item.name).format('ddd, MMM D, YYYY') : item.name
      }));
    }
  });

  // Dynamic colors depending on theme mode
  const colorCodes: Record<string, string> = {
    Purchases: theme.type === 'dark' ? '#4dabf5' : '#1976d2',
    GRNs: theme.type === 'dark' ? '#81c784' : '#39960e'
  };

  return (
    <JumboCardQuick
      title={'Purchases & GRNs'}
      sx={{ height: smallScreen ? null : xlScreen ? 310 : null }}
      action={
        !smallScreen && !midScreen ? (
          <ButtonGroup variant="outlined" size="small" disableElevation>
            {['day', 'week', 'month', 'year'].map(interval => (
              <Tooltip key={interval} title={`${interval[0].toUpperCase() + interval.slice(1)} Trend`}>
                <Button
                  variant={params.aggregate_by === interval ? 'contained' : 'outlined'}
                  onClick={() => setParams(prev => ({ ...prev, aggregate_by: interval as 'day' | 'week' | 'month' | 'year' }))}
                >
                  {interval[0].toUpperCase() + interval.slice(1)}
                </Button>
              </Tooltip>
            ))}
          </ButtonGroup>
        ) : (
          <Div sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="purchase-and-grns-group-by-input-label">Interval</InputLabel>
              <Select
                labelId="purchase-and-grns-group-by-label"
                id="purchase-and-grns-group-by"
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
        <ResponsiveContainer width="100%" height={xlScreen ? 250 : 180}>
          <ComposedChart data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="name" stroke={textColor} />
            <YAxis tickFormatter={shortNumber} stroke={textColor} />

            <RechartTooltip
              contentStyle={{
                backgroundColor:
                  theme.type === 'dark'
                    ? theme.palette.background.paper
                    : '#fff',
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                color: textColor,
              }}
              itemStyle={{ color: textColor }}
              labelStyle={{ color: textColor }}
              cursor={{ stroke: theme.palette.divider }}
              formatter={(value: number) =>
                value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              }
            />
            <Legend wrapperStyle={{ color: textColor }} />
            <Bar type="monotone" dataKey="Purchases" fill={colorCodes.Purchases} barSize={10} />
            <Bar type="monotone" dataKey="GRNs" fill={colorCodes.GRNs} barSize={10} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </JumboCardQuick>
  );
}

export default PurchasesAndGrns;
