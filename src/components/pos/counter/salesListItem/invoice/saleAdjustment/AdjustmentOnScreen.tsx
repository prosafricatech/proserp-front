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
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { AuthObject } from '@/types/auth-types';

interface AdjustmentItem {
  quantity: number;
  rate: number;
  vat_percentage: number;
  vat_exempted: number;
  description?: string;
  product?: {
    name: string;
  };
  measurement_unit?: MeasurementUnit | string;
}

interface Creator {
  name: string;
}

interface Adjustment {
  id: number;
  voucherNo: string;
  note_type: 'debit' | 'credit';
  adjustment_date: string;
  transaction_date?: string;
  narration: string;
  currency: Currency;
  items: AdjustmentItem[];
  cost_centers: CostCenter[];
  creator: Creator;
}

interface AdjustmentOnScreenProps {
  adjustment: Adjustment;
  authObject: AuthObject;
}

const formatCurrency = (
  amount: number,
  currencyCode: string,
  options?: Intl.NumberFormatOptions
): string => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
};

const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
): string => {
  return value.toLocaleString('en-US', options);
};

const AdjustmentOnScreen: React.FC<AdjustmentOnScreenProps> = ({
  adjustment,
  authObject,
}) => {
  const currencyCode = adjustment.currency.code;
  const {
    authOrganization: { organization },
  } = authObject;

  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const calculatedValues = React.useMemo(() => {
    const totalAmountForVAT = adjustment.items
      .filter((item) => item.vat_exempted !== 1)
      .reduce((total: number, item: AdjustmentItem) => {
        const itemAmount = item.quantity * item.rate;
        const vatAmount = itemAmount * (item.vat_percentage / 100);
        return total + vatAmount;
      }, 0);

    const totalAmount = adjustment.items.reduce((total: number, item: AdjustmentItem) => {
      return total + item.quantity * item.rate;
    }, 0);

    const grandTotal = totalAmount + totalAmountForVAT;

    return {
      totalAmountForVAT,
      totalAmount,
      grandTotal,
      hasVAT: totalAmountForVAT > 0,
    };
  }, [adjustment.items]);

  const { totalAmountForVAT, totalAmount, grandTotal, hasVAT } = calculatedValues;

  const tableRows = React.useMemo(() => {
    return adjustment.items.map((item: AdjustmentItem, index: number) => {
      const itemAmount = item.quantity * item.rate;
      const vatAmount =
        item.vat_exempted !== 1
          ? itemAmount * (item.vat_percentage / 100)
          : 0;

      const unitDisplay = typeof item.measurement_unit === 'string'
        ? item.measurement_unit
        : item.measurement_unit?.symbol || '';

      return (
        <TableRow
          key={`${item.product?.name || index}-${index}`}
          sx={{
            backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
            '&:hover': {
              backgroundColor: `${lightColor} !important`,
            },
          }}
        >
          <TableCell>{index + 1}</TableCell>
          <TableCell>
            <Box>
              <Typography variant="body2" component="span">
                {item.product?.name || 'No Product'}
              </Typography>
              {item.description && (
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    display: 'block',
                    ml: 0.5,
                  }}
                >
                  ({item.description})
                </Typography>
              )}
            </Box>
          </TableCell>
          <TableCell>{unitDisplay}</TableCell>
          <TableCell sx={{ textAlign: 'right' }}>
            {item.quantity}
          </TableCell>
          <TableCell sx={{ textAlign: 'right' }}>
            {formatNumber(item.rate)}
          </TableCell>
          {hasVAT && (
            <TableCell sx={{ textAlign: 'right' }}>
              {item.vat_exempted !== 1
                ? formatNumber(vatAmount)
                : 'Exempt'
              }
            </TableCell>
          )}
          <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>
            {formatNumber(itemAmount)}
          </TableCell>
        </TableRow>
      );
    });
  }, [adjustment.items, hasVAT, lightColor]);

  const renderTotalsRow = (label: string, amount: number, bold = false) => (
    <Grid container sx={{ mb: 1 }}>
      <Grid size={8} />
      <Grid size={2}>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'right',
            fontWeight: bold ? 'bold' : 'normal',
          }}
        >
          {label}
        </Typography>
      </Grid>
      <Grid size={2}>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'right',
            fontWeight: bold ? 'bold' : 'normal',
          }}
        >
          {formatCurrency(amount, currencyCode)}
        </Typography>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Grid size={6}>
        </Grid>
        <Grid size={6} sx={{ textAlign: 'right' }}>
          <Typography
            variant="h6"
            sx={{
              color: mainColor,
              fontWeight: 'bold',
              letterSpacing: '0.5px',
            }}
          >
            {adjustment.note_type === 'debit' ? 'Debit Note' : 'Credit Note'}
          </Typography>
          <Typography variant="h4" sx={{ color: mainColor, mt: 0.5 }}>
            {adjustment.voucherNo}
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={6}>
          <Typography
            variant="body2"
            sx={{ color: mainColor, fontWeight: 'bold', mb: 0.5 }}
          >
            Adjustment Date
          </Typography>
          <Typography variant="body1" color="text.primary">
            {readableDate(adjustment.adjustment_date)}
          </Typography>
        </Grid>
        {adjustment.cost_centers.length > 0 && (
          <Grid size={6}>
            <Typography
              variant="body2"
              sx={{ color: mainColor, fontWeight: 'bold', mb: 0.5 }}
            >
              Cost Center
            </Typography>
            <Typography variant="body1" color="text.primary">
              {adjustment.cost_centers
                .map((cost_center: CostCenter) => cost_center.name)
                .join(', ')}
            </Typography>
          </Grid>
        )}
      </Grid>

      <TableContainer
        component={Paper}
        sx={{
          mb: 2,
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: (theme) => theme.shadows[2],
        }}
        elevation={0}
      >
        <Table sx={{ minWidth: 650 }} aria-label="Adjustment items table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: '5%',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                S/N
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: '35%',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Product
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: '10%',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Unit
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: '10%',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Quantity
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: '10%',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Rate
              </TableCell>
              {hasVAT && (
                <TableCell
                  sx={{
                    backgroundColor: mainColor,
                    color: contrastText,
                    fontWeight: 'bold',
                    width: '10%',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    py: 1.5,
                  }}
                >
                  VAT
                </TableCell>
              )}
              <TableCell
                sx={{
                  backgroundColor: mainColor,
                  color: contrastText,
                  fontWeight: 'bold',
                  width: '10%',
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  py: 1.5,
                }}
              >
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
            {adjustment.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={hasVAT ? 7 : 6} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No items found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {adjustment.items.length > 0 && (
        <>
          {renderTotalsRow('Total', totalAmount)}
          
          {hasVAT && (
            <>
              {renderTotalsRow('VAT', totalAmountForVAT, true)}
              {renderTotalsRow('Grand Total', grandTotal, true)}
            </>
          )}
        </>
      )}

      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={6}>
          <Typography
            variant="body2"
            sx={{ color: mainColor, fontWeight: 'bold', mb: 0.5 }}
          >
            Narration
          </Typography>
          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.5 }}>
            {adjustment.narration}
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography
            variant="body2"
            sx={{ color: mainColor, fontWeight: 'bold', mb: 0.5 }}
          >
            Posted By
          </Typography>
          <Typography variant="body1" color="text.primary">
            {adjustment.creator?.name}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdjustmentOnScreen;