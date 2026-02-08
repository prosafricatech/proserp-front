'use client';

import * as React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';

function CustomBarWithBackground(props) {
  const { ownerState, id, dataIndex, xOrigin, yOrigin, ...other } = props;
  const theme = useTheme();
  const { width } = useDrawingArea();

  return (
    <React.Fragment>
      <rect
        {...other}
        fill={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
        x={0}
        width={width}
        height={other.height}
        y={other.y}
        rx={4}
      />
      <rect
        {...other}
        filter={ownerState.isHighlighted ? 'brightness(120%)' : undefined}
        opacity={ownerState.isFaded ? 0.5 : 1}
        data-highlighted={ownerState.isHighlighted || undefined}
        data-faded={ownerState.isFaded || undefined}
        rx={4}
      />
    </React.Fragment>
  );
}

const BarLabelText = styled('text')(({ theme }) => ({
  fill: theme.palette.getContrastText('#1976d2'),
  fontSize: 12,
  textAnchor: 'start',
  dominantBaseline: 'middle',
  pointerEvents: 'none',
}));

function BarLabelAtEnd(props) {
  const { value, x, y, width, height } = props;
  
  return (
    <BarLabelText
      x={x + width + 8}
      y={y + height / 2}
    >
      {value}%
    </BarLabelText>
  );
}

const getBarColor = () => '#1976d2';

function DeliverableSummary({ deliverableDetails }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  if (!deliverableDetails) {
    return (
      <Box sx={{ width: '100%', p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">No deliverable data available</Typography>
      </Box>
    );
  }

  const certified = Number(deliverableDetails.certified_percentage ?? 0);
  const executed = Number(deliverableDetails.executed_percentage ?? 0);

  const dataset = [
    { 
      label: isXs ? 'Cert.' : 'Certification', 
      value: certified,
      color: getBarColor(),
    },
    { 
      label: isXs ? 'Exec.' : 'Execution', 
      value: executed,
      color: getBarColor(),
    },
  ];

  const chartHeight = isXs ? 120 : isSm ? 140 : 160;
  const yAxisWidth = isXs ? 60 : isSm ? 70 : 80;
  const barLabelFontSize = isXs ? 10 : 12;
  const marginRight = isXs ? 50 : isSm ? 60 : 70;
  const barThickness = isXs ? 20 : isSm ? 25 : 30;

  return (
    <Box sx={{ 
      width: '100%',
      px: isXs ? 0.5 : 2,
    }}>
      <Box sx={{ 
        overflowX: isXs ? 'auto' : 'visible',
        overflowY: 'hidden',
        '& .MuiBarChart-root': {
          minWidth: isXs ? '250px' : 'auto'
        }
      }}>
        <BarChart
          layout="horizontal"
          height={chartHeight}
          dataset={dataset}
          margin={{ 
            top: isXs ? 10 : 15,
            right: marginRight, 
            left: isXs ? 5 : 8,
            bottom: isXs ? 10 : 15
          }}
          
          series={[
            {
              dataKey: 'value',
              valueFormatter: (v) => `${v}%`,
              color: '#1976d2',
            },
          ]}
          
          xAxis={[
            {
              min: 0,
              max: 100,
              tickInterval: isXs ? [0, 50, 100] : [0, 25, 50, 75, 100],
              valueFormatter: (v) => `${v}%`,
              tickLabelStyle: {
                fontSize: isXs ? 10 : 11,
              },
            },
          ]}
          
          yAxis={[
            {
              scaleType: 'band',
              dataKey: 'label',
              width: yAxisWidth,
              tickLabelStyle: {
                fontSize: isXs ? 11 : 13,
              },
            },
          ]}
          
          colors={['#1976d2']}
          
          slots={{
            bar: CustomBarWithBackground,
            barLabel: BarLabelAtEnd,
          }}
          
          slotProps={{
            bar: {
              rx: 4,
              barSize: barThickness,
            },
            barLabel: {
              style: {
                fontSize: barLabelFontSize,
              },
            },
          }}
          
          grid={{ horizontal: false }}
          
          tooltip={{ trigger: 'item' }}
        />
      </Box>
    </Box>
  );
}

export default DeliverableSummary;