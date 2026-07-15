'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';
import {
  Box,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useMemo } from 'react';

export interface PurchaseManifestItem {
  order_date: string;
  date_required: string | null;
  orderNo: string;
  product: {
    id: number;
    type: string;
    sku: string | null;
    brand: string | null;
    model: string | null;
    specifications: string | null;
    item_name: string;
    name: string;
  };
  measurement_unit: {
    id: number;
    name: string;
    symbol: string;
  };
  quantity_ordered: number;
  quantity_received: number;
  rate: number;
  currency: {
    id: number;
    name: string;
    symbol: string;
    code: string;
    exchangeRate: number;
  };
  vendor: {
    name: string;
  };
  status: string;
}

interface PurchasesManifestOnScreenProps {
  reportData: {
    filters: {
      cost_centers: Array<{
        id: number;
        name: string;
        code: string | null;
        type: string;
      }> | null;
      from: string;
      to: string;
      suppliers: Array<{
        id: number;
        name: string;
        type?: string | null;
      }> | null;
      status: string;
    };
    items: PurchaseManifestItem[];
  };
  organization?: Organization;
}

const PurchasesManifestOnScreen: React.FC<PurchasesManifestOnScreenProps> = ({
  reportData,
  organization,
}) => {
  const theme = useTheme();

  // Color Tokens based on System Guidelines
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization?.settings?.main_color || '#2113AD';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  const formatCurrency = (amount: number, currencyCode: string) => {
    return amount?.toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const reportItems = reportData?.items || [];

  // Group and compute totals per unique currency
  const currencyTotals =
    reportData?.items?.reduce((acc: Record<string, number>, item) => {
      const code = item.currency?.code || 'TZS';
      acc[code] =
        (acc[code] || 0) + (item.quantity_ordered || 0) * (item.rate || 0);
      return acc;
    }, {}) || {};

  // total recevied
  const totalreceivedAmt = useMemo(() => {
    return (
      reportItems.reduce((acc: Record<string, number>, item) => {
        const code = item.currency?.code || 'TZS';
        const receivedAmt = (item.quantity_received || 0) * (item.rate || 0);
        acc[code] = (acc[code] || 0) + receivedAmt;
        return acc;
      }, {}) || {}
    );
  }, [reportItems]);

  // total recevied
  const totalPendingAmt = useMemo(() => {
    return (
      reportItems.reduce((acc: Record<string, number>, item) => {
        const code = item.currency?.code || 'TZS';
        const pendingAmt =
          ((item.quantity_ordered || 0) - (item.quantity_received || 0)) *
          (item.rate || 0);
        acc[code] = (acc[code] || 0) + pendingAmt;
        return acc;
      }, {}) || {}
    );
  }, [reportItems]);

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container spacing={2} width={'100%'}>
        {/* Title Header Section */}
        <Grid size={12} sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Typography
              variant='h4'
              sx={{ color: headerColor, fontWeight: 500 }}
            >
              PURCHASES MANIFEST REPORT
            </Typography>
          </Box>
        </Grid>

        {/* Filters/Meta Information Section */}
        <Grid
          container
          spacing={2}
          columnSpacing={2}
          sx={{ mb: 3 }}
          width={'100%'}
        >
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <Box>
              <Typography variant='subtitle2' sx={{ color: headerColor }}>
                Reporting Period
              </Typography>
              <Typography variant='body1'>
                {readableDate(reportData?.filters.from)} —{' '}
                {readableDate(reportData?.filters.to)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <Box>
              <Typography variant='subtitle2' sx={{ color: headerColor }}>
                Filter Status
              </Typography>
              <Typography variant='body1'>
                {reportData?.filters.status}
              </Typography>
            </Box>
          </Grid>
          {reportData?.filters.cost_centers &&
            reportData?.filters.cost_centers.length > 0 && (
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    Cost Centers
                  </Typography>
                  <Typography variant='body1' sx={{ wordBreak: 'break-word' }}>
                    {reportData?.filters.cost_centers
                      .map((cc) => cc.name)
                      .join(', ')}
                  </Typography>
                </Box>
              </Grid>
            )}
          {reportData?.filters.suppliers &&
            reportData?.filters.suppliers.length > 0 && (
              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ color: headerColor }}>
                    Stakeholders
                  </Typography>
                  <Typography variant='body1' sx={{ wordBreak: 'break-word' }}>
                    {reportData?.filters.suppliers
                      .map((s) => s.name)
                      .join(', ')}
                  </Typography>
                </Box>
              </Grid>
            )}
        </Grid>

        {/* Main Items Data Table */}
        <Grid size={12}>
          <TableContainer
            component={Paper}
            sx={{
              boxShadow: theme.shadows[2],
              '& .MuiTableRow-root:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    S/N
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    Order No.
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    Dates
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    Product Details
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                  >
                    Supplier / Vendor
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                    align='right'
                  >
                    Qty Ordered
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                    align='right'
                  >
                    Qty Received
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                    align='right'
                  >
                    Rate
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                    align='right'
                  >
                    Ordered Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                    align='right'
                  >
                    Received Amount
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '0.875rem',
                    }}
                    align='right'
                  >
                    Pending Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.items?.map((item, index) => {
                  const itemAmount =
                    (item.quantity_ordered || 0) * (item.rate || 0);
                  const receivedAmt =
                    (item.quantity_received || 0) * (item.rate || 0);
                  const pendingAmt =
                    ((item.quantity_ordered || 0) -
                      (item.quantity_received || 0)) *
                    (item.rate || 0);
                  const isFullyReceived =
                    item.status?.toLowerCase() === 'fully received';

                  return (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        '&:nth-of-type(even)': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {item.orderNo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          Ordered: {readableDate(item.order_date)}
                        </Typography>
                        {item.date_required && (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            display='block'
                            sx={{ mt: 0.5 }}
                          >
                            Required: {readableDate(item.date_required)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {item.product?.name}
                        </Typography>
                        {item.product?.type && (
                          <Typography variant='caption' color='text.secondary'>
                            Type: {item.product.type}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='body2'
                          sx={{
                            fontWeight: 600,
                            color: isFullyReceived
                              ? theme.palette.success.main
                              : theme.palette.warning.main,
                          }}
                        >
                          {item.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {item.vendor?.name}
                        </Typography>
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {`${item.quantity_ordered?.toLocaleString()} ${item.measurement_unit?.symbol || ''}`}
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {`${item.quantity_received?.toLocaleString()} ${item.measurement_unit?.symbol || ''}`}
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatNumber(item.rate)}
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(itemAmount, item.currency?.code)}
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(receivedAmt, item.currency?.code)}
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency(pendingAmt, item.currency?.code)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Aggregate Totals Summary Section */}
        <Grid size={12}>
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            {/* total ordered amount */}
            <Grid container spacing={1} alignItems='center'>
              <Grid size={7}>
                <Typography variant='h6' color={headerColor}>
                  Total Ordered Amount
                </Typography>
              </Grid>
              <Grid size={5} sx={{ textAlign: 'right' }}>
                {Object.entries(currencyTotals).map(
                  ([currencyCode, totalAmount]) => (
                    <Typography
                      key={currencyCode}
                      variant='h6'
                      color={headerColor}
                      fontFamily='monospace'
                      fontWeight={600}
                    >
                      {formatCurrency(totalAmount, currencyCode)}
                    </Typography>
                  )
                )}
              </Grid>
            </Grid>
            <Divider />

            {/* total received amount */}
            <Grid container spacing={1} alignItems='center' mt={2}>
              <Grid size={7}>
                <Typography variant='h6' color={headerColor}>
                  Total Received Amount
                </Typography>
              </Grid>
              <Grid size={5} sx={{ textAlign: 'right' }}>
                {Object.entries(totalreceivedAmt).map(
                  ([currencyCode, totalAmount]) => (
                    <Typography
                      key={currencyCode}
                      variant='h6'
                      color={headerColor}
                      fontFamily='monospace'
                      fontWeight={600}
                    >
                      {formatCurrency(totalAmount, currencyCode)}
                    </Typography>
                  )
                )}
              </Grid>
            </Grid>
            <Divider />

            {/* total pending amount */}
            <Grid container spacing={1} alignItems='center' mt={2}>
              <Grid size={7}>
                <Typography variant='h6' color={headerColor}>
                  Total Pending Amount
                </Typography>
              </Grid>
              <Grid size={5} sx={{ textAlign: 'right' }}>
                {Object.entries(totalPendingAmt).map(
                  ([currencyCode, totalAmount]) => (
                    <Typography
                      key={currencyCode}
                      variant='h6'
                      color={headerColor}
                      fontFamily='monospace'
                      fontWeight={600}
                    >
                      {formatCurrency(totalAmount, currencyCode)}
                    </Typography>
                  )
                )}
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchasesManifestOnScreen;
