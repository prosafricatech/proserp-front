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
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function ItemMovementOnScreen({ movementsData, authObject, baseCurrency }) {
  const theme = useTheme();
  const { authOrganization, checkOrganizationPermission } = authObject;
  const financePersonnel = checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS]);
  
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
  
  let cumulativeBalance = 0;
  const { movements } = movementsData;

  // Helper function to determine balance color and style
  const getBalanceStyle = (balance) => {
    if (balance < 0) {
      return {
        backgroundColor: theme.type === 'dark' 
          ? 'rgba(244, 67, 54, 0.1)' 
          : 'rgba(244, 67, 54, 0.05)'
      };
    } else if (balance > 0) {
      return {
        color: theme.palette.success.main,
      };
    }
    return {
      color: theme.palette.text.primary
    };
  };

  // Format number with consistent decimal places
  const formatQuantity = (value) => {
    if (value === 0 || value === null || value === undefined) return '';
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 5 
    });
  };

  // Column width styles
  const columnStyles = {
    header: {
      backgroundColor: mainColor, 
      color: contrastText, 
      fontSize: '0.875rem',
      fontWeight: 600,
      py: 1.5
    },
    serial: {
      width: '60px',
      minWidth: '60px',
      maxWidth: '60px'
    },
    date: {
      width: '130px',
      minWidth: '130px',
      maxWidth: '130px'
    },
    description: {
      minWidth: '200px',
      maxWidth: '250px',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      lineHeight: 1.3
    },
    reference: {
      width: '140px',
      minWidth: '140px',
      maxWidth: '140px'
    },
    quantity: {
      width: '110px',
      minWidth: '110px',
      maxWidth: '110px',
      textAlign: 'right'
    },
    finance: {
      width: '120px',
      minWidth: '120px',
      maxWidth: '120px',
      textAlign: 'right'
    }
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
              sx={{ color: headerColor}} 
              gutterBottom
            >
              ITEM MOVEMENT REPORT
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {movementsData?.filters?.product?.name}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: headerColor, 
            textAlign: 'center',
            mb: 2
          }}
        >
          MOVEMENT DETAILS
        </Typography>

        {financePersonnel && (
          <Typography 
            variant="h6" 
            sx={{
              textAlign: 'center', 
              mb: 2
            }}
          >
            {baseCurrency?.code}
          </Typography>
        )}
        
        <TableContainer 
          component={Paper}
          sx={{
            boxShadow: theme.shadows[2],
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: financePersonnel ? '1100px' : '900px',
              tableLayout: 'fixed'
            },
            '& .MuiTableRow-root:hover': {
              backgroundColor: theme.palette.action.hover,
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {/* Serial Number */}
                <TableCell sx={{ 
                  ...columnStyles.header,
                  ...columnStyles.serial
                }}>
                  S/N
                </TableCell>
                
                {/* Date */}
                <TableCell sx={{ 
                  ...columnStyles.header,
                  ...columnStyles.date
                }}>
                  Date
                </TableCell>
                
                {/* Description */}
                <TableCell sx={{ 
                  ...columnStyles.header,
                  ...columnStyles.description
                }}>
                  Description
                </TableCell>
                
                {/* Reference */}
                <TableCell sx={{ 
                  ...columnStyles.header,
                  ...columnStyles.reference
                }}>
                  Reference
                </TableCell>
                
                {/* Quantity In */}
                <TableCell sx={{ 
                  ...columnStyles.header,
                  ...columnStyles.quantity
                }}>
                  Quantity In
                </TableCell>
                
                {/* Quantity Out */}
                <TableCell sx={{ 
                  ...columnStyles.header,
                  ...columnStyles.quantity
                }}>
                  Quantity Out
                </TableCell>
                
                {/* Balance */}
                <TableCell sx={{ 
                  ...columnStyles.header,
                  ...columnStyles.quantity
                }}>
                  Balance
                </TableCell>
                
                {/* Finance Columns */}
                {financePersonnel && (
                  <>
                    <TableCell sx={{ 
                      ...columnStyles.header,
                      ...columnStyles.finance
                    }}>
                      Avg Cost
                    </TableCell>
                    <TableCell sx={{ 
                      ...columnStyles.header,
                      ...columnStyles.finance
                    }}>
                      Selling Price
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {movements.map((movement, index) => {
                const balance = movement.quantity_in - movement.quantity_out;
                cumulativeBalance += balance;
                const balanceStyle = getBalanceStyle(cumulativeBalance);
                
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
                    {/* Serial Number */}
                    <TableCell sx={columnStyles.serial}>
                      {index + 1}
                    </TableCell>
                    
                    {/* Date */}
                    <TableCell sx={columnStyles.date}>
                      {readableDate(movement.movement_date)}
                    </TableCell>
                    
                    {/* Description - WITH PROPER WRAPPING */}
                    <TableCell sx={columnStyles.description}>
                      {movement.description}
                    </TableCell>
                    
                    {/* Reference */}
                    <TableCell sx={columnStyles.reference}>
                      {movement.reference}
                    </TableCell>
                    
                    {/* Quantity In */}
                    <TableCell sx={columnStyles.quantity}>
                      {movement.quantity_in !== 0 && formatQuantity(movement.quantity_in)}
                    </TableCell>
                    
                    {/* Quantity Out */}
                    <TableCell sx={columnStyles.quantity}>
                      {movement.quantity_out !== 0 && formatQuantity(movement.quantity_out)}
                    </TableCell>
                    
                    {/* Balance */}
                    <TableCell 
                      sx={{ 
                        ...columnStyles.quantity,
                        ...balanceStyle,
                        fontFamily: 'monospace'
                      }}
                    >
                      {formatQuantity(cumulativeBalance)}
                    </TableCell>
                    
                    {/* Finance Columns */}
                    {financePersonnel && (
                      <>
                        <TableCell sx={{ 
                          ...columnStyles.finance,
                          fontFamily: 'monospace'
                        }}>
                          {movement.average_cost?.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ 
                          ...columnStyles.finance,
                          fontFamily: 'monospace'
                        }}>
                          {movement.selling_price?.toLocaleString()}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
              
              {/* Empty State */}
              {movements.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={financePersonnel ? 9 : 7} 
                    sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      borderBottom: 'none'
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No movement data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Summary Row */}
              {movements.length > 0 && (
                <TableRow sx={{ 
                  backgroundColor: theme.palette.background.default,
                  '& td': {
                    borderBottom: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }
                }}>
                  <TableCell 
                    colSpan={4} 
                    align="right" 
                    sx={{ 
                      py: 2
                    }}
                  >
                    Final Balance
                  </TableCell>
                  
                  <TableCell sx={{ 
                    ...columnStyles.quantity,
                    fontFamily: 'monospace'
                  }}>
                    {formatQuantity(movements.reduce((sum, m) => sum + m.quantity_in, 0))}
                  </TableCell>
                  
                  <TableCell sx={{ 
                    ...columnStyles.quantity,
                    fontFamily: 'monospace'
                  }}>
                    {formatQuantity(movements.reduce((sum, m) => sum + m.quantity_out, 0))}
                  </TableCell>
                  
                  <TableCell 
                    sx={{ 
                      ...columnStyles.quantity,
                      ...getBalanceStyle(cumulativeBalance),
                      fontFamily: 'monospace',
                      fontSize: '1rem'
                    }}
                  >
                    {formatQuantity(cumulativeBalance)}
                  </TableCell>
                  
                  {/* Empty cells for finance columns if needed */}
                  {financePersonnel && (
                    <>
                      <TableCell sx={columnStyles.finance}></TableCell>
                      <TableCell sx={columnStyles.finance}></TableCell>
                    </>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Mobile warning for horizontal scroll */}
        <Box sx={{ 
          display: { xs: 'block', md: 'none' },
          mt: 1,
          textAlign: 'center'
        }}>
          <Typography variant="caption" color="text.secondary">
            ← Scroll horizontally to view all columns →
          </Typography>
        </Box>
      </Box>
    </>
  );
}

export default ItemMovementOnScreen;