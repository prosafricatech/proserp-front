import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  ComposedChart,
} from 'recharts';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import { useDashboardSettings } from '../Dashboard';
import dayjs from 'dayjs';
import { BalanceOutlined } from '@mui/icons-material';
import BalanceSheet from '../../accounts/reports/balance sheet/BalanceSheet';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { shortNumber } from '@/app/helpers/input-sanitization-helpers';

interface BalanceSheetItem {
  period: string;
  assetsFigure: number;
  liabilitiesFigure: number;
}

function BalanceSheetTrend() {
  const [openDialog, setOpenDialog] = useState(false);

  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const xlScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const {
    chartFilters: { from, to, cost_center_ids },
  } = useDashboardSettings();

  const [params, setParams] = useState({
    from,
    to,
    cost_center_ids,
    aggregate_by: 'week' as 'day' | 'week' | 'month' | 'year',
  });

  useEffect(() => {
    setParams((prevParams) => ({ ...prevParams, from, to, cost_center_ids }));
  }, [from, to, cost_center_ids]);

  const { data: balanceSheetTrend, isLoading } = useQuery({
    queryKey: ['balanceSheetTrend', params],
    queryFn: async () => {
      const balanceSheetFigures = await financialReportsServices.balanceSheetFigures(params);

      return balanceSheetFigures.map((item: BalanceSheetItem) => ({
        name:
          params.aggregate_by === 'day'
            ? dayjs(item.period).format('dddd, MMMM D, YYYY')
            : item.period,
        Assets: item.assetsFigure,
        Liabilities: item.liabilitiesFigure,
        Equity: item.assetsFigure - item.liabilitiesFigure,
      }));
    },
  });

  return (
    <JumboCardQuick
      title="Balance Sheet Trend"
      sx={{
        height: xlScreen ? 310 : null,
      }}
      action={
        <Grid container columnSpacing={1} alignItems="center">
          <Grid size={8}>
            {!midScreen && !smallScreen ? (
              <ButtonGroup variant="outlined" size="small" disableElevation>
                <Tooltip title="Weekly Trend">
                  <Button
                    variant={params.aggregate_by === 'week' ? 'contained' : 'outlined'}
                    onClick={() => setParams((prev) => ({ ...prev, aggregate_by: 'week' }))}
                  >
                    Weekly
                  </Button>
                </Tooltip>
                <Tooltip title="Monthly Trend">
                  <Button
                    variant={params.aggregate_by === 'month' ? 'contained' : 'outlined'}
                    onClick={() => setParams((prev) => ({ ...prev, aggregate_by: 'month' }))}
                  >
                    Monthly
                  </Button>
                </Tooltip>
                <Tooltip title="Yearly Trend">
                  <Button
                    variant={params.aggregate_by === 'year' ? 'contained' : 'outlined'}
                    onClick={() => setParams((prev) => ({ ...prev, aggregate_by: 'year' }))}
                  >
                    Yearly
                  </Button>
                </Tooltip>
              </ButtonGroup>
            ) : (
              <Div>
                <FormControl fullWidth size="small">
                  <InputLabel id="balance-sheet-trend-group-by-input-label">Interval</InputLabel>
                  <Select
                    labelId="balance-sheet-trend-group-by-label"
                    id="balance-sheet-trend-group-by"
                    value={params.aggregate_by}
                    label="Interval"
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        aggregate_by: e.target.value as 'week' | 'month' | 'year',
                      }))
                    }
                  >
                    <MenuItem value="week">Weekly</MenuItem>
                    <MenuItem value="month">Monthly</MenuItem>
                    <MenuItem value="year">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Div>
            )}
          </Grid>
          <Grid size={4}>
            <Tooltip title="Open Balance Sheet Report">
              <IconButton onClick={() => setOpenDialog(true)} size="small" color="primary">
                <BalanceOutlined
                  sx={
                    smallScreen
                      ? { fontSize: '40px' }
                      : { fontSize: '38px', marginLeft: 2 }
                  }
                />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      }
    >
      <Dialog
        open={openDialog}
        fullWidth
        scroll={smallScreen ? 'body' : 'paper'}
        fullScreen={smallScreen}
        maxWidth="md"
      >
        <BalanceSheet as_at={to} />
        <DialogActions>
          <Button size="small" variant="outlined" onClick={() => setOpenDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {isLoading ? (
        <LinearProgress />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={balanceSheetTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey="name"
              stroke={theme.palette.text.primary}
              tick={{ fill: theme.palette.text.primary }}
            />
            <YAxis
              stroke={theme.palette.text.primary}
              tick={{ fill: theme.palette.text.primary }}
              tickFormatter={shortNumber}
            />
            <RechartTooltip
              contentStyle={{
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : '#fff',
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
              }}
              itemStyle={{ color: theme.palette.text.primary }}
              labelStyle={{ color: theme.palette.text.primary }}
              cursor={false}
              formatter={(value: number) =>
                value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            />
            <Legend wrapperStyle={{ color: theme.palette.text.primary }} />
            <Line
              type="monotone"
              dataKey="Assets"
              stroke={theme.palette.success.main}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="Liabilities"
              stroke={theme.palette.error.main}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="Equity"
              stroke={theme.palette.info.main}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </JumboCardQuick>
  );
}

export default BalanceSheetTrend;
