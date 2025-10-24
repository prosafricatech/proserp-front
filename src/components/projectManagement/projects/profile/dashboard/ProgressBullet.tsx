'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Highcharts from 'highcharts';
import { LinearProgress } from '@mui/material';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';

const HighchartsReact = dynamic(() => import('highcharts-react-official'), {
  ssr: false,
});

function ProgressBullet() {
  const [isReady, setIsReady] = useState(false);
  const { theme } = useJumboTheme();
  const isDarkMode = theme.palette.mode === 'dark' || theme.type === 'dark';

  useEffect(() => {
    let mounted = true;
    async function loadBulletModule() {
      try {
        const mod: any = await import('highcharts/modules/bullet');
        const initFn = mod?.default ?? mod;
        if (typeof initFn === 'function') {
          initFn(Highcharts);
        }
      } catch (err) {
        console.error('Failed to load bullet module:', err);
      } finally {
        if (mounted) setIsReady(true);
      }
    }
    loadBulletModule();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) return <LinearProgress />;

  const options: Highcharts.Options = {
    chart: {
      inverted: true,
      type: 'bullet',
      height: 130,
      marginLeft: 130,
      backgroundColor: theme.palette.background.paper,
      style: { color: theme.palette.text.primary },
    },
    title: {
      text: 'Progress',
      style: { color: theme.palette.text.primary },
    },
    xAxis: {
      categories: ['Progress'],
      labels: { style: { color: isDarkMode ? theme.palette.text.secondary : "#000" } },
      lineColor: theme.palette.divider,
    },
    yAxis: {
      gridLineWidth: 0,
      plotBands: [
        {
          from: 0,
          to: 100,
          color: isDarkMode ? theme.palette.success.main : '#29A3AD',
        },
      ],
      title: { text: undefined },
      labels: { style: { color: isDarkMode ? theme.palette.text.secondary : "#000" } },
    },
    series: [
      {
        type: 'bullet',
        name: 'Progress',
        data: [{ y: 14, target: 29 }],
        color: isDarkMode ? theme.palette.primary.main : '#000',
        targetOptions: {
          width: '200%',
          color: isDarkMode ? theme.palette.warning.main : "#000", 
        },
      } as Highcharts.SeriesOptionsType,
    ],
    tooltip: {
      backgroundColor: theme.palette.background.default,
      borderColor: theme.palette.divider,
      style: { color: theme.palette.text.primary },
      pointFormat: '<b>{point.y}</b> (target: {point.target})',
    },
    legend: { enabled: false },
    plotOptions: {
      bullet: {
        pointPadding: 0.25,
        borderWidth: 0,
      } as Highcharts.PlotBulletOptions,
    },
    exporting: { enabled: false },
    accessibility: { enabled: false },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

export default ProgressBullet;
