import JumboCardQuick from '@jumbo/components/JumboCardQuick/JumboCardQuick';
import React, { useEffect, useState } from 'react';
import { LinearProgress, Typography, useMediaQuery, Box } from '@mui/material';
import financialReportsServices from '../../accounts/reports/financial-reports-services';
import { useDashboardSettings } from '../Dashboard';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface RevenueData {
  ledger_name: string;
  amount: number;
}

interface ChartDataPoint {
  name: string;
  y: number;
}

function RevenueDistributionCard() {
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
  const isDark = theme.palette.mode === 'dark';

  const { data: revenueDistribution, isLoading } = useQuery({
    queryKey: ['revenueDistribution', params],
    queryFn: async () => {
      const revenues = await financialReportsServices.incomeFigures({
        from: params.from,
        to: params.to,
        ledgerGroupId: 3,
        cost_center_ids: params.cost_center_ids,
        group_by_ledgers: true
      });

      return revenues.map((rev: RevenueData) => ({
        name: rev.ledger_name,
        y: rev.amount
      } as ChartDataPoint));
    }
  });

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 245,
      backgroundColor: 'transparent',
      spacing: [10, 10, 10, 10]
    },
    title: { text: '' },
    tooltip: {
      pointFormat: '{point.y}: <b>({point.percentage:.1f}%)</b>',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      style: { color: isDark ? '#fff' : '#000' }
    },
    plotOptions: {
      pie: {
        size: '70%',
        center: ['50%', '50%'],
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b><br>{point.percentage:.1f} %',
          style: { color: isDark ? '#fff' : '#000', textOutline: 'none' }
        }
      }
    },
    series: [{
      type: 'pie',
      name: 'Revenue',
      colorByPoint: true,
      data: revenueDistribution || []
    } as Highcharts.SeriesPieOptions]
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
            color: theme.palette.text.primary,
            fontFamily: 'NoirPro, Arial',
          }}
        >
          Revenue Composition
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

export default RevenueDistributionCard;