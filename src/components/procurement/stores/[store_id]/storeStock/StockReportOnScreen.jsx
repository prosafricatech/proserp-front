import React from 'react';
import {
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  Box,
  TableContainer
} from '@mui/material';

function StockReportOnScreen({ stockData, authObject, hasPermissionToView }) {
  const theme = useTheme();
  const { authOrganization } = authObject;
  
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";

  // Calculate total amount
  const totalAmount = stockData.reduce((total, stock) => total + (stock.latest_rate * stock.balance), 0);

  // Format currency values
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format quantity values
  const formatQuantity = (value) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  };

  return stockData ? (
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
              sx={{ color: headerColor, fontWeight: 'bold' }} 
              gutterBottom
            >
              STOCK REPORT
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Summary Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {hasPermissionToView && (
          <Grid size={{xs: 12, sm: 6, md: 4}}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                Total Stock Value
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Stock Items Table */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: headerColor, 
            textAlign: 'center', 
            fontWeight: 'bold',
            mb: 2
          }}
        >
          STOCK ITEMS
        </Typography>
        
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
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  #
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Product Name
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Unit
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Balance
                </TableCell>
                {hasPermissionToView && (
                  <>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                      Unit Cost
                    </TableCell>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                      Amount
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {stockData.map((stock, index) => (
                <TableRow 
                  key={index} 
                  sx={{ 
                    backgroundColor: theme.palette.background.paper,
                    '&:nth-of-type(even)': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <TableCell sx={{ fontWeight: 'medium' }}>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 'medium' }}>{stock.name}</TableCell>
                  <TableCell>{stock.measurement_unit.symbol}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                    {formatQuantity(stock.balance)}
                  </TableCell>
                  {hasPermissionToView && (
                    <>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                        {formatCurrency(stock.latest_rate)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {formatCurrency(stock.balance * stock.latest_rate)}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              
              {/* Empty State */}
              {stockData.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={hasPermissionToView ? 6 : 4} 
                    sx={{ textAlign: 'center', py: 4 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No stock data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Total Row */}
              {hasPermissionToView && stockData.length > 0 && (
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell 
                    colSpan={5} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold',
                      borderBottom: 'none'
                    }}
                  >
                    Total Stock Value
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      borderBottom: 'none',
                      color: contrastText
                    }}
                  >
                    {formatCurrency(totalAmount)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  ) : null;
}

export default StockReportOnScreen;