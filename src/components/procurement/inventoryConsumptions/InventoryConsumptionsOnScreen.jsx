import React from 'react';
import {
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  Box,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function InventoryConsumptionsOnScreen({ inventoryConsumption, authObject }) {
  const theme = useTheme();
  const {authOrganization: {organization}} = authObject;
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const transformedItems = inventoryConsumption.items.map((item, index) => {
    const journal = inventoryConsumption.journals[index];
    return {
      ...item,
      ledger: journal?.debit_ledger,
    };
  });

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
              INVENTORY CONSUMPTION
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {inventoryConsumption.consumptionNo}
            </Typography>
            {inventoryConsumption.reference && (
              <Typography variant="body1" color="text.secondary">
                Reference: {inventoryConsumption.reference}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Metadata Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Consumption Date
            </Typography>
            <Typography variant="body1">
              {readableDate(inventoryConsumption.consumption_date)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Cost Center
            </Typography>
            <Typography variant="body1">{inventoryConsumption.cost_center.name}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Items Table */}
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
                Product
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                Expense Ledger
              </TableCell>
              <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                Quantity
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transformedItems.map((item, index) => (
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
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {item.product.name}
                    </Typography>
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mt: 0.5 }}>
                        ({item.description})
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {item.ledger?.name}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                  {`${item.quantity.toLocaleString()} ${item.measurement_unit.symbol}`}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Empty State */}
            {transformedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No consumption items found
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

export default InventoryConsumptionsOnScreen;