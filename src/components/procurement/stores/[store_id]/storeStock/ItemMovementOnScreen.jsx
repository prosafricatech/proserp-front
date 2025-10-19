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

function ItemMovementOnScreen({ movementsData, authObject }) {
  const theme = useTheme();
  const { authOrganization } = authObject;
  
  const mainColor = authOrganization.organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (authOrganization.organization.settings?.main_color || "#2113AD");
  const contrastText = authOrganization.organization.settings?.contrast_text || "#FFFFFF";
  
  let cumulativeBalance = 0;
  const { movements } = movementsData;

  // Helper function to determine balance color and style
  const getBalanceStyle = (balance) => {
    if (balance < 0) {
      return {
        fontWeight: 'bold',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(244, 67, 54, 0.1)' 
          : 'rgba(244, 67, 54, 0.05)'
      };
    } else if (balance > 0) {
      return {
        color: theme.palette.success.main,
        fontWeight: 'bold'
      };
    }
    return {
      fontWeight: 'bold',
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

      {/* Movement Items Section */}
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
          MOVEMENT DETAILS
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
                  Date
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Description
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Reference
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Quantity In
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Quantity Out
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Balance
                </TableCell>
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
                    <TableCell sx={{ fontWeight: 'medium' }}>{index + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {readableDate(movement.movement_date)}
                    </TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell>{movement.reference}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {movement.quantity_in !== 0 && formatQuantity(movement.quantity_in)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {movement.quantity_out !== 0 && formatQuantity(movement.quantity_out)}
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontFamily: 'monospace',
                        ...balanceStyle,
                        position: 'relative'
                      }}
                    >
                      {formatQuantity(cumulativeBalance)}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Empty State */}
              {movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
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
                    fontWeight: 'bold'
                  }
                }}>
                  <TableCell 
                    colSpan={4} 
                    align="right" 
                    sx={{ 
                      fontWeight: 'bold'
                    }}
                  >
                    Final Balance
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'medium'
                    }}
                  >
                    {formatQuantity(movements.reduce((sum, m) => sum + m.quantity_in, 0))}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'medium'
                    }}
                  >
                    {formatQuantity(movements.reduce((sum, m) => sum + m.quantity_out, 0))}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      ...getBalanceStyle(cumulativeBalance),
                      fontSize: '1rem'
                    }}
                  >
                    {formatQuantity(cumulativeBalance)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}

export default ItemMovementOnScreen;