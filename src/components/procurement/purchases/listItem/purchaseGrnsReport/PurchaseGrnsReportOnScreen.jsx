import React from 'react';
import { 
  Typography, 
  Table, 
  TableHead, 
  TableBody, 
  TableCell, 
  TableRow, 
  Grid,
  useTheme,
  Box,
  Paper,
  TableContainer
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function PurchaseGrnsReportOnScreen({ organization, purchaseGrnsReport }) {
  const theme = useTheme();
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const groupedGrnsItems = purchaseGrnsReport.purchase_order_items.reduce((acc, item) => {
    item.received_items.forEach((receivedItems) => {
      const key = receivedItems.grnNo;
      if (!acc[key]) {
        acc[key] = {
          grnNo: key,
          date_received: receivedItems.date_received,
          products: [],
        };
      }
      acc[key].products.push({
        ...receivedItems,
        productId: item.id,
        measurement_unit: item.measurement_unit,
      });
    });
    return acc;
  }, {});

  const receivedItems = Object.values(groupedGrnsItems);

  const formatNumber = (value) => {
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3
    });
  };

  return (
    <>
      {/* Header Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%'
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ color: headerColor }} 
              gutterBottom
            >
              PURCHASE ORDER GRNS REPORT
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {purchaseGrnsReport.orderNo}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {`As at: ${readableDate(undefined, true)}`}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* GRNs Report Table */}
      <TableContainer 
        component={Paper}
        sx={{
          boxShadow: theme.shadows[2],
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.action.hover,
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{
                backgroundColor: mainColor, 
                color: contrastText, 
                borderRight: `1px solid ${theme.palette.divider}`,
                fontSize: '0.875rem',
                width: '5%'
              }}>S/N</TableCell>
              
              <TableCell sx={{
                backgroundColor: mainColor, 
                color: contrastText, 
                borderRight: `1px solid ${theme.palette.divider}`,
                fontSize: '0.875rem',
                width: '25%'
              }}>Products</TableCell>
              
              <TableCell sx={{
                backgroundColor: mainColor, 
                color: contrastText, 
                borderRight: `1px solid ${theme.palette.divider}`,
                fontSize: '0.875rem',
                width: '8%'
              }}>Unit</TableCell>
              
              <TableCell sx={{
                backgroundColor: mainColor, 
                color: contrastText, 
                borderRight: `1px solid ${theme.palette.divider}`,
                fontSize: '0.875rem',
                width: '8%'
              }}>Ordered</TableCell>
              
              {receivedItems.map(item => (
                <TableCell 
                  sx={{
                    backgroundColor: mainColor, 
                    color: contrastText, 
                    borderRight: `1px solid ${theme.palette.divider}`,
                    fontSize: '0.875rem',
                    minWidth: '120px'
                  }} 
                  key={item.grnNo}
                  align="center"
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                      {item.grnNo}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                      ({readableDate(item.date_received)})
                    </Typography>
                  </Box>
                </TableCell>
              ))}
              
              <TableCell sx={{
                backgroundColor: mainColor, 
                color: contrastText,
                fontSize: '0.875rem',
                width: '10%'
              }} align="center">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                    Pending
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                    ({readableDate()})
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchaseGrnsReport.purchase_order_items.map((item, index) => {
              const totalReceivedQuantity = receivedItems.reduce((total, receivedItems) => {
                const product = receivedItems.products.find(p => p.productId === item.id);
                return total + (product ? product.quantity : 0);
              }, 0);

              const unReceivedQuantity = item.quantity - totalReceivedQuantity;

              return (
                <TableRow 
                  key={item.id} 
                  sx={{ 
                    backgroundColor: theme.palette.background.paper,
                    '&:nth-of-type(even)': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.measurement_unit.symbol}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {item.quantity.toLocaleString()}
                  </TableCell>
                  
                  {receivedItems.map(receivedItems => {
                    const product = receivedItems.products.find(p => p.productId === item.id);
                    return (
                      <TableCell 
                        key={receivedItems.grnNo} 
                        align="right"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {product ? formatNumber(product.quantity) : '0.000'}
                      </TableCell>
                    );
                  })}
                  
                  <TableCell 
                    align="right"
                    sx={{ 
                      fontFamily: 'monospace', 
                      color: unReceivedQuantity > 0 ? 'warning.main' : 'success.main'
                    }}
                  >
                    {formatNumber(Math.max(unReceivedQuantity, 0))}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Empty State */}
            {purchaseGrnsReport.purchase_order_items.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={3 + receivedItems.length + 1} 
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No purchase order items found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default PurchaseGrnsReportOnScreen;