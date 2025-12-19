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
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Organization } from '@/types/auth-types';

interface Product {
  id: string;
  name: string;
}

interface DispatchedItem {
  deliveryNo: string;
  dispatch_date: string;
  quantity: number;
  productId: string;
  measurement_unit: MeasurementUnit;
}

interface DispatchItem {
  id: string;
  product: Product;
  quantity: number;
  measurement_unit: MeasurementUnit;
  dispatched_items: DispatchedItem[];
}

interface Creator {
  name: string;
}

interface Stakeholder {
  name: string;
}

interface DispatchReport {
  saleNo: string;
  transaction_date: string;
  items: DispatchItem[];
  creator?: Creator;
  stakeholder?: Stakeholder;
}

interface DispatchReportOnScreenProps {
  organization: Organization;
  dispatchReport: DispatchReport;
}

interface GroupedDispatchedItem {
  deliveryNo: string;
  dispatch_date: string;
  products: {
    productId: string;
    quantity: number;
    measurement_unit: MeasurementUnit;
  }[];
}

const DispatchReportOnScreen: React.FC<DispatchReportOnScreenProps> = ({ 
  organization, 
  dispatchReport 
}) => {
  const theme = useTheme();
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const groupedDispatchedItems = dispatchReport.items.reduce((acc: Record<string, GroupedDispatchedItem>, item) => {
    item.dispatched_items.forEach((dispatchedItem) => {
      const key = dispatchedItem.deliveryNo;
      if (!acc[key]) {
        acc[key] = {
          deliveryNo: key,
          dispatch_date: dispatchedItem.dispatch_date,
          products: [],
        };
      }
      acc[key].products.push({
        productId: item.id,
        quantity: dispatchedItem.quantity,
        measurement_unit: item.measurement_unit,
      });
    });
    return acc;
  }, {});

  const dispatchedItem = Object.values(groupedDispatchedItems);

  return (
    <Box sx={{ padding: 2 }}>
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
              color={headerColor} 
              fontWeight="bold" 
              gutterBottom
            >
              SALES DISPATCH REPORT
            </Typography>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              gutterBottom
            >
              {dispatchReport.saleNo}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {`As at: ${readableDate(undefined, true)}`}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Dispatch Report Table */}
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
              }}>#</TableCell>
              
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
              
              {dispatchedItem.map(item => (
                <TableCell 
                  sx={{
                    backgroundColor: mainColor, 
                    color: contrastText, 
                    borderRight: `1px solid ${theme.palette.divider}`,
                    fontSize: '0.875rem',
                    minWidth: '120px'
                  }} 
                  key={item.deliveryNo}
                  align="center"
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
                      {item.deliveryNo}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                      ({readableDate(item.dispatch_date)})
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
                    Balance
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                    ({readableDate()})
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dispatchReport.items.map((item, index) => {
              const totalDispatchedQuantity = dispatchedItem.reduce((total, dispatchedItem) => {
                const product = dispatchedItem.products.find(p => p.productId === item.id);
                return total + (product ? product.quantity : 0);
              }, 0);

              const undispatchedQuantity = item.quantity - totalDispatchedQuantity;

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
                  
                  {dispatchedItem.map(dispatchedItem => {
                    const product = dispatchedItem.products.find(p => p.productId === item.id);
                    return (
                      <TableCell 
                        key={dispatchedItem.deliveryNo} 
                        align="right"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {product ? Math.floor(product.quantity).toLocaleString() : '0'}
                      </TableCell>
                    );
                  })}
                  
                  <TableCell 
                    align="right"
                    sx={{ 
                      fontFamily: 'monospace', 
                      color: undispatchedQuantity > 0 ? 'warning.main' : 'success.main'
                    }}
                  >
                    {Math.max(undispatchedQuantity, 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Empty State */}
            {dispatchReport.items.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={4 + dispatchedItem.length + 1} 
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No dispatch items found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Section */}
      {dispatchReport.items.length > 0 && (
        <Box 
          sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{xs: 12, md: 6}}>
              <Typography variant="subtitle2" color={headerColor} fontWeight="bold">
                Total Orders: {dispatchReport.items.length}
              </Typography>
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <Typography variant="subtitle2" color={headerColor} fontWeight="bold">
                Total Dispatches: {dispatchedItem.length}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export { DispatchReportOnScreen };