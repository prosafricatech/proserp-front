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
        fill={theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
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

const getBarColor = (value) => {
  if (value >= 80) return '#2e7d32';
  if (value >= 60) return '#1976d2';
  if (value >= 40) return '#ed6c02';
  return '#d32f2f';
};

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
      color: getBarColor(certified),
    },
    { 
      label: isXs ? 'Exec.' : 'Execution', 
      value: executed,
      color: getBarColor(executed),
    },
  ];

  const overallProgress = ((certified + executed) / 2).toFixed(1);

  const chartHeight = isXs ? 160 : isSm ? 180 : 220;
  const yAxisWidth = isXs ? 60 : isSm ? 80 : 100;
  const barLabelFontSize = isXs ? 11 : 13;
  const marginRight = isXs ? 60 : isSm ? 70 : 80;

  return (
    <Box sx={{ 
      width: '100%',
      px: isXs ? 0.5 : 2,
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isXs ? 'column' : 'row',
        alignItems: isXs ? 'flex-start' : 'center',
        mb: isXs ? 2 : 3,
        p: isXs ? 1.5 : 2,
        borderRadius: 1,
        bgcolor: theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
      }}>
        <Box sx={{ 
          flex: 1, 
          width: isXs ? '100%' : 'auto',
          mb: isXs ? 1 : 0 
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 0.5,
              fontSize: isXs ? '0.875rem' : 'inherit'
            }}
          >
            Overall Progress
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isXs ? 1 : 2 
          }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ 
                height: isXs ? 6 : 8,
                bgcolor: theme.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  width: `${overallProgress}%`,
                  height: '100%',
                  bgcolor: getBarColor(overallProgress),
                  borderRadius: 4
                }} />
              </Box>
            </Box>
            <Typography 
              variant={isXs ? "body1" : "h6"}
              fontWeight={isXs ? 600 : 400}
              sx={{ minWidth: isXs ? '45px' : 'auto' }}
            >
              {overallProgress}%
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        overflowX: isXs ? 'auto' : 'visible',
        overflowY: 'hidden',
        '& .MuiBarChart-root': {
          minWidth: isXs ? '300px' : 'auto'
        }
      }}>
        <BarChart
          layout="horizontal"
          height={chartHeight}
          dataset={dataset}
          margin={{ 
            top: isXs ? 15 : 20, 
            right: marginRight, 
            left: isXs ? 5 : 10, 
            bottom: isXs ? 15 : 20 
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
                fontSize: isXs ? 11 : 12,
              },
            },
          ]}
          
          yAxis={[
            {
              scaleType: 'band',
              dataKey: 'label',
              width: yAxisWidth,
              tickLabelStyle: {
                fontSize: isXs ? 12 : 14,
              },
            },
          ]}
          
          colors={dataset.map(item => item.color)}
          
          slots={{
            bar: CustomBarWithBackground,
            barLabel: BarLabelAtEnd,
          }}
          
          slotProps={{
            bar: {
              rx: 4,
            },
            barLabel: {
              style: {
                fontSize: barLabelFontSize,
              },
            },
          }}
          
          grid={{ horizontal: true }}
          
          tooltip={{ trigger: 'item' }}
        />
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexWrap: isXs ? 'wrap' : 'nowrap',
        justifyContent: isXs ? 'flex-start' : 'center',
        gap: isXs ? 1.5 : 3,
        mt: isXs ? 1.5 : 2,
        pt: isXs ? 1.5 : 2,
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        {[
          { color: '#d32f2f', label: isXs ? 'Low' : 'Low (<40%)' },
          { color: '#ed6c02', label: isXs ? 'Medium' : 'Medium (40-60%)' },
          { color: '#1976d2', label: isXs ? 'Good' : 'Good (60-80%)' },
          { color: '#2e7d32', label: isXs ? 'Excellent' : 'Excellent (>80%)' },
        ].map((item, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              flex: isXs ? '0 0 calc(50% - 8px)' : 'none'
            }}
          >
            <Box sx={{ 
              width: isXs ? 10 : 12, 
              height: isXs ? 10 : 12, 
              borderRadius: '2px',
              bgcolor: item.color 
            }} />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: isXs ? '0.7rem' : '0.75rem' }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default DeliverableSummary;