'use client';
import { shortNumber } from '@/app/helpers/input-sanitization-helpers';
import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { ViewTimelineOutlined } from '@mui/icons-material';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import IncomeStatement from '../../accounts/reports/incomeStatement/IncomeStatement';
import { useDashboardSettings } from '../Dashboard';

interface FinancialFigure {
  period: string;
  amount: number;
}

interface ChartDataPoint {
  name: string;
  Revenue: number;
  Expenses: number;
  Profit: number;
}

function ProfitAndLossTrendCard() {
  const [openDialog, setOpenDialog] = useState(false);

  // Screen handling constants
  const { theme } = useJumboTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const midScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const {
    chartFilters: { from, to, cost_center_ids },
  } = useDashboardSettings();
  const [params, setParams] = useState({
    from,
    to,
    cost_center_ids,
    aggregate_by: 'day' as 'day' | 'week' | 'month' | 'year',
  });

  useEffect(() => {
    setParams((prevParams) => ({ ...prevParams, from, to, cost_center_ids }));
  }, [from, to, cost_center_ids]);

  const { data: profitAndLossTrend, isLoading } = useQuery({
    queryKey: ['profitAndLossTrend', params],
    queryFn: async () => {
      const { incomeFigures, expenseFigures } =
        await financialReportsServices.profitAndLossFigures(params);

      const mergedArray: { name: string; Revenue: number; Expenses: number }[] =
        [];

      incomeFigures.forEach((salesItem: FinancialFigure) => {
        const expenseItem = expenseFigures.find(
          (expense: FinancialFigure) => expense.period === salesItem.period
        );
        const mergedItem = {
          name: salesItem.period,
          Revenue: salesItem.amount,
          Expenses: expenseItem ? expenseItem.amount : 0,
        };
        mergedArray.push(mergedItem);
      });

      expenseFigures.forEach((expenseItem: FinancialFigure) => {
        const incomeItem = incomeFigures.find(
          (income: FinancialFigure) => income.period === expenseItem.period
        );
        if (!incomeItem) {
          const mergedItem = {
            name: expenseItem.period,
            Revenue: 0,
            Expenses: expenseItem.amount,
          };
          mergedArray.push(mergedItem);
        }
      });

      mergedArray.sort((a, b) => a.name.localeCompare(b.name));

      return mergedArray.map((item) => ({
        name:
          params.aggregate_by === 'day'
            ? dayjs(item.name).format('ddd, MMM D, YYYY')
            : item.name,
        Revenue: item.Revenue,
        Expenses: item.Expenses,
        Profit: item.Revenue - item.Expenses,
      })) as ChartDataPoint[];
    },
  });

  const textColor = theme.palette.text.primary;

  return (
    <JumboCardQuick
      title='Profit & Loss Trend'
      sx={{
        height: midScreen ? 360 : null,
      }}
      action={
        <Grid container columnSpacing={1} alignItems='center'>
          <Grid size={{ xs: 8 }}>
            {!midScreen && !smallScreen ? (
              <ButtonGroup variant='outlined' size='small' disableElevation>
                <Tooltip title='Daily Trend'>
                  <Button
                    variant={
                      params.aggregate_by === 'day' ? 'contained' : 'outlined'
                    }
                    onClick={() =>
                      setParams((prev) => ({ ...prev, aggregate_by: 'day' }))
                    }
                  >
                    Daily
                  </Button>
                </Tooltip>
                <Tooltip title='Weekly Trend'>
                  <Button
                    variant={
                      params.aggregate_by === 'week' ? 'contained' : 'outlined'
                    }
                    onClick={() =>
                      setParams((prev) => ({ ...prev, aggregate_by: 'week' }))
                    }
                  >
                    Weekly
                  </Button>
                </Tooltip>
                <Tooltip title='Monthly Trend'>
                  <Button
                    variant={
                      params.aggregate_by === 'month' ? 'contained' : 'outlined'
                    }
                    onClick={() =>
                      setParams((prev) => ({ ...prev, aggregate_by: 'month' }))
                    }
                  >
                    Monthly
                  </Button>
                </Tooltip>
                <Tooltip title='Yearly Trend'>
                  <Button
                    variant={
                      params.aggregate_by === 'year' ? 'contained' : 'outlined'
                    }
                    onClick={() =>
                      setParams((prev) => ({ ...prev, aggregate_by: 'year' }))
                    }
                  >
                    Yearly
                  </Button>
                </Tooltip>
              </ButtonGroup>
            ) : (
              <Div>
                <FormControl fullWidth size='small'>
                  <InputLabel id='business-trend-group-by-input-label'>
                    Interval
                  </InputLabel>
                  <Select
                    labelId='business-trend-group-by-label'
                    id='business-trend-group-by'
                    value={params.aggregate_by}
                    label='Interval'
                    onChange={(e) =>
                      setParams((prev) => ({
                        ...prev,
                        aggregate_by: e.target.value as
                          | 'day'
                          | 'week'
                          | 'month'
                          | 'year',
                      }))
                    }
                  >
                    <MenuItem value='day'>Daily</MenuItem>
                    <MenuItem value='week'>Weekly</MenuItem>
                    <MenuItem value='month'>Monthly</MenuItem>
                    <MenuItem value='year'>Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Div>
            )}
          </Grid>
          <Grid size={{ xs: 4 }} textAlign={'end'} p={0}>
            <Tooltip title='Income Statement'>
              <IconButton
                onClick={() => setOpenDialog(true)}
                size='small'
                color='primary'
                sx={{ p: 0 }}
              >
                <ViewTimelineOutlined
                  sx={
                    smallScreen
                      ? { fontSize: '40px', p: 0 }
                      : {
                          fontSize: '28px',
                          marginLeft: 2,
                          p: 0,
                        }
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
        fullScreen={smallScreen}
        scroll={smallScreen ? 'body' : 'paper'}
        maxWidth='lg'
      >
        <IncomeStatement
          from={from}
          to={to}
          cost_center_ids={cost_center_ids}
          aggregate_by={null}
          setOpenIncomeStatementDialog={setOpenDialog}
        />
        <DialogActions>
          <Button
            size='small'
            variant='outlined'
            onClick={() => setOpenDialog(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {isLoading ? (
        <Skeleton
          variant='rectangular'
          width='100%'
          height={midScreen ? 245 : 245}
          sx={{ borderRadius: 2 }}
        />
      ) : (
        <ResponsiveContainer width='100%' height={midScreen ? 240 : 245}>
          <ComposedChart
            data={profitAndLossTrend}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
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
              formatter={(value: number) =>
                value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            />
            <Legend wrapperStyle={{ color: textColor }} />
            <Line
              type='monotone'
              dataKey='Revenue'
              stroke='#2196f3'
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type='monotone'
              dataKey='Expenses'
              stroke='#e91e63'
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type='monotone'
              dataKey='Profit'
              stroke='#4caf50'
              dot={false}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </JumboCardQuick>
  );
}

export default ProfitAndLossTrendCard;
