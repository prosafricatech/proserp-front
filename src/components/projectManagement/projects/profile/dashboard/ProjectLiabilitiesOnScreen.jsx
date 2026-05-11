import {
  Alert,
  Box,
  Divider,
  Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

const formatAmount = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function ProjectLiabilitiesOnScreen({ rows, total, currencyCode }) {
  return (
    <Box>
      {rows.length ? (
        rows.map((row, index) => (
          <React.Fragment key={`${row.label}-${index}`}>
            <Divider />
            <Grid container size={12} sx={{ py: 1, px: 1 }}>
              <Grid size={8}>
                <Tooltip title={row.label}>
                  <Typography>{row.label}</Typography>
                </Tooltip>
              </Grid>
              <Grid size={4}>
                <Tooltip title='Amount'>
                  <Typography textAlign='right'>
                    {currencyCode ? `${currencyCode} ` : ''}
                    {formatAmount(row.value)}
                  </Typography>
                </Tooltip>
              </Grid>
            </Grid>
          </React.Fragment>
        ))
      ) : (
        <Alert variant='outlined' severity='info'>
          No Liabilities Found
        </Alert>
      )}

      <Divider />
      <Grid container size={12} sx={{ py: 1, px: 1 }}>
        <Grid size={6}>
          <Tooltip title='Total'>
            <Typography fontWeight={600}>Total</Typography>
          </Tooltip>
        </Grid>
        <Grid size={6}>
          <Tooltip title='Amount'>
            <Typography textAlign='right' fontWeight={600}>
              {currencyCode ? `${currencyCode} ` : ''}
              {formatAmount(total)}
            </Typography>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProjectLiabilitiesOnScreen;