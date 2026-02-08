import React from 'react';
import {
  Grid,
  Typography,
  Tooltip,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  useTheme,
  Box
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function InventoryTransferOnScreen({ transfer, organization }) {
  const theme = useTheme();
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

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
              INVENTORY TRANSFER
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {transfer.transferNo}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Transfer Information */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Transfer Date
            </Typography>
            <Typography variant="body1">
              {readableDate(transfer.transfer_date)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Cost Center
            </Typography>
            <Typography variant="body1">{transfer.source_cost_center.name}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              From Store
            </Typography>
            <Typography variant="body1">{transfer.source_store.name}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              To Store
            </Typography>
            <Typography variant="body1">{transfer.destination_store.name}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 4}}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
              Transferred By
            </Typography>
            <Typography variant="body1">{transfer?.creator?.name}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Items Section */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: headerColor, 
            textAlign: 'center', 
            mb: 2
          }}
        >
          TRANSFER ITEMS
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
                  S/N
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Product
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Quantity
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transfer.items.map((item, index) => (
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
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {`${item.quantity} ${item.measurement_unit?.symbol}`}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Empty State */}
              {transfer.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No transfer items found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Additional Information Section */}
      {(transfer.vehicle_information || transfer.driver_information || transfer.narration) && (
        <Box sx={{ mt: 3 }}>
          
          <Box 
            sx={{ 
              p: 2, 
            }}
          >
            {transfer.vehicle_information && (
              <Box sx={{ mb: 2 }}>
                <Tooltip title="Information about the vehicle used for the transfer">
                  <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
                    Vehicle Information
                  </Typography>
                </Tooltip>
                <Typography variant="body1">{transfer.vehicle_information}</Typography>
              </Box>
            )}

            {transfer.driver_information && (
              <Box sx={{ mb: 2 }}>
                <Tooltip title="Information about the driver handling the transfer">
                  <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
                    Driver Information
                  </Typography>
                </Tooltip>
                <Typography variant="body1">{transfer.driver_information}</Typography>
              </Box>
            )}

            {transfer.narration && (
              <Box>
                <Typography variant="subtitle2" sx={{ color: headerColor }} gutterBottom>
                  Narration
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                  {transfer.narration}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}

export default InventoryTransferOnScreen;