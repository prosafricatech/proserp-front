import React from 'react';
import { 
  Grid, 
  Typography, 
  Paper, 
  Box, 
  Divider, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  useTheme
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization, User } from '@/types/auth-types';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Product } from '@/components/productAndServices/products/ProductType';

interface SaleItem {
  measurement_unit?: MeasurementUnit;
}

interface Store {
  name: string;
}

interface Sale {
  stakeholder: Stakeholder;
}

interface DeliveryItem {
  product: Product;
  sale_item: SaleItem;
  quantity: number;
  store: Store;
}

interface Delivery {
  deliveryNo: string;
  dispatch_date: string;
  creator: User;
  dispatch_from: string;
  destination: string;
  sale: Sale;
  items: DeliveryItem[];
  vehicle_information?: string;
  driver_information?: string;
  remarks?: string;
}

interface DeliveryNoteOnScreenProps {
  delivery: Delivery;
  organization: Organization;
}

const DeliveryNoteOnScreen: React.FC<DeliveryNoteOnScreenProps> = ({ delivery, organization }) => {
  const theme = useTheme();
  const mainColor = organization.settings?.main_color || "#2113AD";
  const headerColor = theme.type === 'dark' ? '#29f096' : (organization.settings?.main_color || "#2113AD");
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const renderStakeholderInfo = (stakeholder: Stakeholder) => {
    const infoItems = [
      { label: 'TIN', value: stakeholder.tin },
      { label: 'VRN', value: stakeholder.vrn },
      { label: 'Phone', value: stakeholder.phone },
      { label: 'Email', value: stakeholder.email }
    ].filter(item => item.value);

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body1" fontWeight="medium">{stakeholder.name}</Typography>
        {stakeholder.address && (
          <Typography variant="body2" color="text.secondary">
            {stakeholder.address}
          </Typography>
        )}
        {infoItems.map((item, index) => (
          <Grid container justifyContent="space-between" key={index} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {item.label}:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {item.value}
            </Typography>
          </Grid>
        ))}
      </Box>
    );
  };

  return (
    <>
      <Grid container spacing={2} sx={{ textAlign: 'center', mb: 3 }}>
        <Grid size={12} sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color={headerColor} fontWeight="bold" gutterBottom>
            DELIVERY NOTE
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {delivery.deliveryNo}
          </Typography>
        </Grid>
      </Grid>

      {/* Dispatch Info Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor} fontWeight="bold" gutterBottom>
              Dispatch Date
            </Typography>
            <Typography variant="body1">
              {readableDate(delivery.dispatch_date)}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor} fontWeight="bold" gutterBottom>
              Dispatched By
            </Typography>
            <Typography variant="body1">{delivery.creator.name}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor} fontWeight="bold" gutterBottom>
              Dispatch From
            </Typography>
            <Typography variant="body1">{delivery.dispatch_from}</Typography>
          </Box>
        </Grid>
        <Grid size={{xs: 12, sm: 6, md: 3}}>
          <Box>
            <Typography variant="subtitle2" color={headerColor} fontWeight="bold" gutterBottom>
              Destination
            </Typography>
            <Typography variant="body1">{delivery.destination}</Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Stakeholder Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box 
            sx={{ 
              p: 2, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: theme.palette.background.default
            }}
          >
            <Typography 
              variant="subtitle1" 
              color={headerColor} 
              fontWeight="bold" 
              textAlign="center"
              gutterBottom
            >
              Deliver To
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderStakeholderInfo(delivery.sale.stakeholder)}
          </Box>
        </Grid>
      </Grid>

      {/* Items Table */}
      <Grid size={12}>
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
                  Product/Service
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Unit
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }} align="right">
                  Quantity
                </TableCell>
                <TableCell sx={{ backgroundColor: mainColor, color: contrastText, fontSize: '0.875rem' }}>
                  Store
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {delivery.items.map((deliveryItem, index) => (
                <TableRow 
                  key={`${deliveryItem.product.name}-${index}`}
                  sx={{ 
                    backgroundColor: theme.palette.background.paper,
                    '&:nth-of-type(even)': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{deliveryItem.product.name}</TableCell>
                  <TableCell>{deliveryItem.sale_item.measurement_unit?.symbol || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                    {deliveryItem.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell>{deliveryItem.store.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      {/* Additional Info Section */}
      {(delivery.vehicle_information || delivery.driver_information || delivery.remarks) && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {delivery.vehicle_information && (
            <Grid size={{xs: 12, md: 6}}>
              <Box>
                <Typography variant="subtitle2" color={headerColor} fontWeight="bold" gutterBottom>
                  Vehicle Information
                </Typography>
                <Typography variant="body1">{delivery.vehicle_information}</Typography>
              </Box>
            </Grid>
          )}
          {delivery.driver_information && (
            <Grid size={{xs: 12, md: 6}}>
              <Box>
                <Typography variant="subtitle2" color={headerColor} fontWeight="bold" gutterBottom>
                  Driver Information
                </Typography>
                <Typography variant="body1">{delivery.driver_information}</Typography>
              </Box>
            </Grid>
          )}
          {delivery.remarks && (
            <Grid size={12}>
              <Box>
                <Typography variant="subtitle2" color={headerColor} fontWeight="bold" gutterBottom>
                  Remarks
                </Typography>
                <Typography variant="body1">{delivery.remarks}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </>
  );
};

export default DeliveryNoteOnScreen;