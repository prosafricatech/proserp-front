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
  Box,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { DippingDetails, Organization } from './DippingsTypes';
import { Product } from '@/components/productAndServices/products/ProductType';

interface DippingsOnScreenProps {
  productOptions: Product[];
  dippingData: DippingDetails; // au badilisha na type halisi kama una Dipping type
  fuel_pumps: any[];
  shift_teams: any[]; // au ShiftTeam[]
  organization: Organization;
}

const DippingsOnScreen: React.FC<DippingsOnScreenProps> = ({ dippingData, organization }) => {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <Box style={{ padding: 5 }}>
      <Grid container spacing={2} marginBottom={2} paddingTop={2}>
        <Grid size={6}>
          <Typography variant="h4" color={mainColor}>
            Fuel Station Dippings
          </Typography>
          <Typography variant="subtitle1">
            {dippingData.station?.name}
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} marginBottom={3}>
       <Grid size={{xs:12, md:6}}>
          <Typography variant="body2" color={mainColor}>
            As At
          </Typography>
          <Typography variant="body2">
            {readableDate(dippingData.as_at, true)}
          </Typography>
        </Grid>
      </Grid>

      <TableContainer component={Paper} style={{ marginTop: 20, marginBottom: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ backgroundColor: mainColor, color: contrastText }}>
                Tank
              </TableCell>
              <TableCell style={{ backgroundColor: mainColor, color: contrastText }}>
                Product
              </TableCell>
              <TableCell 
                style={{ 
                  backgroundColor: mainColor, 
                  color: contrastText,
                  textAlign: 'right'
                }}
              >
                Reading
              </TableCell>
              <TableCell 
                style={{ 
                  backgroundColor: mainColor, 
                  color: contrastText,
                  textAlign: 'right'
                }}
              >
                Deviation
              </TableCell>
            </TableRow>
          </TableHead>
         <TableBody>
          {dippingData?.readings?.map((reading, index) => (
            <TableRow
              key={reading.id ?? index} // use real id if exists, fallback to index
              sx={{
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              }}
            >
              <TableCell>{reading.tank?.name ?? '—'}</TableCell>
              <TableCell>{reading.product?.name ?? '—'}</TableCell>
              <TableCell align="right">
                {reading.reading != null
                  ? Number(reading.reading).toLocaleString('en-US', {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })
                  : '0.000'}
              </TableCell>
              <TableCell align="right">
                {reading.deviation != null
                  ? Number(reading.deviation).toLocaleString('en-US', {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })
                  : '0.000'}
              </TableCell>
            </TableRow>
          ))}

          {/* Optional: Show message when no readings */}
          {(!dippingData?.readings || dippingData.readings.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3, fontStyle: 'italic' }}>
                No readings available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        </Table>
      </TableContainer>

      {dippingData.remarks && (
        <Grid container spacing={2} marginTop={3}>
          <Grid size={12}>
            <Typography variant="subtitle2" style={{ color: mainColor }} fontWeight="bold">
              Remarks
            </Typography>
            <Typography variant="body2" style={{ marginTop: 8 }}>
              {dippingData.remarks}
            </Typography>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default DippingsOnScreen;