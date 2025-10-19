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
  TableContainer,
  Divider
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

function BatchOnScreen({ batch }) {
  const theme = useTheme();
  const { authOrganization } = useJumboAuth();
  
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";

  // Calculations
  const totalConsumptions = batch.inventory_consumptions?.flatMap(consumption => consumption.items || [])
    .reduce((total, item) => {
      const quantity = item.quantity || 0;
      const rate = item.unit_cost || item.rate || 0;
      return total + (quantity * rate);
    }, 0) || 0;

  const totalOtherExpenses = batch.ledger_expenses?.reduce((total, item) => 
    total + (item.quantity * item.rate || 0), 0) || 0;

  const totalByProducts = batch.by_products?.reduce((total, item) => 
    total + (item.quantity * item.market_value || 0), 0) || 0;

  const combinedInputsOtherExpensesByProduct = (totalConsumptions + totalOtherExpenses) - totalByProducts;

  // Format currency values
  const formatCurrency = (value) => {
    return value?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || '0.00';
  };

  // Format quantity values
  const formatQuantity = (value) => {
    return value?.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    }) || '0';
  };

  // Get unit symbol helper
  const getUnitSymbol = (item) => {
    return item?.unit_symbol || item?.measurement_unit?.symbol || item?.product?.unit_symbol || '';
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
              sx={{ color: headerColor, fontWeight: 'bold' }} 
              gutterBottom
            >
              BATCH PRODUCTION REPORT
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {batch.batchNo}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Batch Summary */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
              Total Input Cost
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {formatCurrency(totalConsumptions + totalOtherExpenses)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
              By-Products Value
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {formatCurrency(totalByProducts)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
              Net Production Cost
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {formatCurrency(combinedInputsOtherExpensesByProduct)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
              Total Outputs
            </Typography>
            <Typography variant="body1">
              {batch.outputs?.length || 0}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Outputs Section */}
      {batch?.outputs?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: headerColor, 
              textAlign: 'center', 
              fontWeight: 'bold',
              mb: 2
            }}
          >
            OUTPUTS
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
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    #
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Product
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Quantity
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Unit Cost
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Amount
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Value %
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Remarks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batch.outputs.map((item, index) => {
                  const itemAmount = (item.value_percentage / 100) * combinedInputsOtherExpensesByProduct;
                  const unitCost = itemAmount / item.quantity;
                  
                  return (
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
                      <TableCell sx={{ fontWeight: 'medium' }}>{item.product.name}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                        {`${formatQuantity(item.quantity)} ${getUnitSymbol(item)}`}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                        {formatCurrency(unitCost)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {formatCurrency(itemAmount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                        {item.value_percentage}%
                      </TableCell>
                      <TableCell>{item.description || item.remarks}</TableCell>
                    </TableRow>
                  );
                })}

                {/* Total Row */}
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell 
                    colSpan={4} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold',
                      borderBottom: 'none'
                    }}
                  >
                    Total Output Value
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
                    {formatCurrency(batch.outputs.reduce((total, item) => 
                      total + ((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct), 0))}
                  </TableCell>
                  <TableCell 
                    sx={{ borderBottom: 'none' }}
                    align="right"
                  >
                    100%
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none' }}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* By-Products Section */}
      {batch?.by_products?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: headerColor, 
              textAlign: 'center', 
              fontWeight: 'bold',
              mb: 2
            }}
          >
            BY-PRODUCTS
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
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    #
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Product
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Store
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Quantity
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Market Value
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Amount
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Remarks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batch.by_products.map((item, index) => (
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
                    <TableCell sx={{ fontWeight: 'medium' }}>{item.product.name}</TableCell>
                    <TableCell>{item.store?.name}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {`${formatQuantity(item.quantity)} ${getUnitSymbol(item)}`}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {formatCurrency(item.market_value)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {formatCurrency(item.quantity * item.market_value)}
                    </TableCell>
                    <TableCell>{item.description || item.remarks}</TableCell>
                  </TableRow>
                ))}

                {/* Total Row */}
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell 
                    colSpan={5} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold',
                      borderBottom: 'none'
                    }}
                  >
                    Total By-Products Value
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
                    {formatCurrency(totalByProducts)}
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none' }}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Inventory Consumptions Section */}
      {batch?.inventory_consumptions?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: headerColor, 
              textAlign: 'center', 
              fontWeight: 'bold',
              mb: 2
            }}
          >
            INVENTORY CONSUMPTIONS
          </Typography>

          {batch.inventory_consumptions.map((consumption, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              {/* Consumption Header */}
              <Grid container spacing={2} sx={{ mb: 2, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
                <Grid size={{xs: 12, sm: 4}}>
                  <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {readableDate(consumption.consumption_date)}
                  </Typography>
                </Grid>
                <Grid size={{xs: 12, sm: 4}}>
                  <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                    Consumption No
                  </Typography>
                  <Typography variant="body1">{consumption.consumptionNo}</Typography>
                </Grid>
                <Grid size={{xs: 12, sm: 4}}>
                  <Typography variant="subtitle2" sx={{ color: headerColor, fontWeight: 'bold' }} gutterBottom>
                    Store
                  </Typography>
                  <Typography variant="body1">{consumption.store?.name}</Typography>
                </Grid>
              </Grid>

              {/* Consumption Items Table */}
              <TableContainer 
                component={Paper}
                sx={{
                  boxShadow: theme.shadows[1],
                  '& .MuiTableRow-root:hover': {
                    backgroundColor: theme.palette.action.hover,
                  }
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                        #
                      </TableCell>
                      <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                        Product
                      </TableCell>
                      <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                        Quantity
                      </TableCell>
                      <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                        Unit Cost
                      </TableCell>
                      <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                        Amount
                      </TableCell>
                      <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                        Description
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consumption.items?.map((item, idx) => (
                      <TableRow 
                        key={idx} 
                        sx={{ 
                          backgroundColor: theme.palette.background.paper,
                          '&:nth-of-type(even)': {
                            backgroundColor: theme.palette.action.hover,
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 'medium' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>{item.product?.name || "N/A"}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                          {`${formatQuantity(item.quantity)} ${getUnitSymbol(item)}`}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                          {formatCurrency(item.unit_cost || item.rate)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {formatCurrency((item.unit_cost || item.rate) * item.quantity)}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Box>
      )}

      {/* Other Expenses Section */}
      {batch?.ledger_expenses?.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              color: headerColor, 
              textAlign: 'center', 
              fontWeight: 'bold',
              mb: 2
            }}
          >
            OTHER EXPENSES
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
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    #
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Expense Name
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Quantity
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Rate
                  </TableCell>
                  <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontWeight: 'bold', fontSize: '0.875rem' }} align="right">
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batch.ledger_expenses.map((item, index) => (
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
                    <TableCell sx={{ fontWeight: 'medium' }}>{item.ledger?.name}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {formatQuantity(item.quantity)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {formatCurrency(item.rate)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {formatCurrency(item.quantity * item.rate)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total Row */}
                <TableRow sx={{ backgroundColor: theme.palette.background.default }}>
                  <TableCell 
                    colSpan={4} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold',
                      borderBottom: 'none'
                    }}
                  >
                    Total Other Expenses
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
                    {formatCurrency(totalOtherExpenses)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </>
  );
}

export default BatchOnScreen;