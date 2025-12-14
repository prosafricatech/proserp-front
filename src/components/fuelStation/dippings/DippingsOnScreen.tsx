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
  Divider,
  useTheme,
} from '@mui/material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { DippingDetails, Organization } from './DippingsTypes';
import { Product } from '@/components/productAndServices/products/ProductType';

interface DippingsOnScreenProps {
  productOptions: Product[];
  dippingData: DippingDetails;
  fuel_pumps: any[];
  shift_teams: any[];
  organization: Organization;
}

const DippingsOnScreen: React.FC<DippingsOnScreenProps> = ({
  dippingData,
  organization,
}) => {
  const theme = useTheme();

  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const headerColor =
    theme.type === 'dark'
      ? '#29f096'
      : organization.settings?.main_color || '#2113AD';

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={12}>
          <Box textAlign="center">
            <Typography variant="h4" sx={{ color: headerColor }} gutterBottom>
              Fuel Station Dippings
            </Typography>
            <Typography variant="subtitle1" fontWeight="medium">
              {dippingData.station?.name}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: headerColor }}
            gutterBottom
          >
            As At
          </Typography>
          <Typography variant="body2">
            {readableDate(dippingData.as_at, true)}
          </Typography>
        </Grid>
      </Grid>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: theme.shadows[2],
          mb: 3,
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Tank
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Product
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Reading
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontSize: '0.875rem',
                }}
              >
                Deviation
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {dippingData?.readings?.map((reading, index) => (
              <TableRow
                key={reading.id ?? index}
                sx={{
                  backgroundColor:
                    index % 2 === 0
                      ? theme.palette.background.paper
                      : theme.palette.action.hover,
                }}
              >
                <TableCell>
                  {reading.tank?.name ?? '—'}
                </TableCell>
                <TableCell>
                  {reading.product?.name ?? '—'}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontFamily: 'monospace' }}
                >
                  {reading.reading != null
                    ? Number(reading.reading).toLocaleString('en-US', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })
                    : '0.000'}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontFamily: 'monospace' }}
                >
                  {reading.deviation != null
                    ? Number(reading.deviation).toLocaleString('en-US', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })
                    : '0.000'}
                </TableCell>
              </TableRow>
            ))}

            {(!dippingData?.readings ||
              dippingData.readings.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{ py: 3, fontStyle: 'italic' }}
                >
                  No readings available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {dippingData.remarks && (
        <Box
          sx={{
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: headerColor }}
            fontWeight="bold"
            gutterBottom
          >
            Remarks
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2">
            {dippingData.remarks}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DippingsOnScreen;
