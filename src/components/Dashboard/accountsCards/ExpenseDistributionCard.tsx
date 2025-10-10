import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import React, { useEffect, useState } from 'react';
import { LinearProgress, Typography, useMediaQuery, Box } from '@mui/material';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import { useDashboardSettings } from '../Dashboard';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ExpenseData {
  ledger_name: string;
  amount: number;
}
interface ChartDataPoint {
  name: string;
  y: number;
}

function ExpenseDistributionCard() {
  const { chartFilters: { from, to, cost_center_ids } } = useDashboardSettings();
  const [params, setParams] = useState({ 
    from,
    to,
    cost_center_ids,
    aggregate_by: 'day' as const
  });

  useEffect(() => {
    setParams(prev => ({ ...prev, from, to, cost_center_ids }));
  }, [from, to, cost_center_ids]);

  const { theme } = useJumboTheme();
  const xlScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const textColor = theme.palette.text.primary;
  const backgroundColor = theme.palette.background.paper;

  const { data: expenseDistribution, isLoading } = useQuery({
    queryKey: ['expenseDistribution', params],
    queryFn: async () => {
      const expenses = await financialReportsServices.expenseFigures({
        from: params.from,
        to: params.to,
        ledgerGroupId: 19,
        cost_center_ids: params.cost_center_ids,
        group_by_ledgers: true
      });

      return expenses.map((expense: ExpenseData) => ({
        name: expense.ledger_name,
        y: expense.amount
      } as ChartDataPoint));
    }
  });

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 245,
      backgroundColor: 'transparent',
      spacing: [10, 10, 10, 10],
      style: { color: textColor }
    },
    title: { text: '' },
    tooltip: {
      pointFormat: '{point.y}: <b>({point.percentage:.1f}%)</b>',
      backgroundColor,
      style: { color: textColor }
    },
    plotOptions: {
      pie: {
        size: '55%',
        center: ['50%', '55%'],
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          distance: 15,
          format: '<b>{point.name}</b><br>{point.percentage:.1f} %',
          style: {
            color: textColor,
            textOutline: 'none',
            fontSize: '11px'
          }
        }
      }
    },
    credits: { enabled: false },
    legend: {
      itemStyle: { color: textColor }
    },
    series: [
      {
        type: 'pie',
        name: 'Expenses',
        colorByPoint: true,
        data: expenseDistribution || [],
      } as Highcharts.SeriesPieOptions,
    ],
  };

  return (
    <JumboCardQuick
      sx={{
        height: xlScreen ? 310 : null,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: textColor,
            fontFamily: 'NoirPro, Arial',
          }}
        >
          Operating Expenses
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLoading ? (
          <LinearProgress sx={{ width: '100%' }} />
        ) : (
          <HighchartsReact highcharts={Highcharts} options={options} />
        )}
      </Box>
    </JumboCardQuick>
  );
}

export default ExpenseDistributionCard;
