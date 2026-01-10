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
            textAlign: 'center'
          }}
        >
          MOVEMENT DETAILS
        </Typography>

        { financePersonnel &&
          <Typography 
            variant="h6" 
            sx={{
              textAlign: 'center', 
              mb: 2
            }}
          >
            {baseCurrency?.code}
          </Typography>
        }
        
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
                {financePersonnel &&
                  <>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                      Avg Cost
                    </TableCell>
                    <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                      Selling Price
                    </TableCell>
                  </>
                }
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
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {readableDate(movement.movement_date)}
                    </TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell>{movement.reference}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      {movement.quantity_in !== 0 && formatQuantity(movement.quantity_in)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
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
                    {financePersonnel &&
                      <>
                      <TableCell
                        align="right" 
                        sx={{ 
                          fontFamily: 'monospace',
                          ...balanceStyle,
                          position: 'relative'
                        }}
                      >{movement.average_cost?.toLocaleString()}</TableCell>
                      <TableCell
                        align="right" 
                        sx={{ 
                          fontFamily: 'monospace',
                          ...balanceStyle,
                          position: 'relative'
                        }}
                      >{movement.selling_price?.toLocaleString()}</TableCell>
                      </>
                    }
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
                  }
                }}>
                  <TableCell 
                    colSpan={4} 
                    align="right" 
                    sx={{ 
                    }}
                  >
                    Final Balance
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatQuantity(movements.reduce((sum, m) => sum + m.quantity_in, 0))}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatQuantity(movements.reduce((sum, m) => sum + m.quantity_out, 0))}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontFamily: 'monospace',
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